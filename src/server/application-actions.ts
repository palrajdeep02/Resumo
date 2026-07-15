"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { generateObject } from "ai"
import { getLanguageModel } from "@/ai/ai-provider"
import { computeMatchForApplication } from "./matching-actions"
import { assertCompanyOwnership } from "./recruiter-actions"
import { rateLimit } from "@/lib/rate-limit"

// Helper to get candidate user or throw
async function getCandidateUserOrThrow() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "CANDIDATE") {
    throw new Error("Unauthorized: Candidate access required")
  }
  return session.user.id
}

/**
 * Runs an AI quality check comparing candidate skills against job requirements.
 * Returns a warning flag and list of key missing skills.
 */
export async function checkApplicationQualityAction(jobId: string) {
  try {
    const userId = await getCandidateUserOrThrow()

    // Rate Limiting (20 requests / hour)
    const limiter = rateLimit(userId + "-ai-quality", 20, 3600000)
    if (!limiter.success) {
      throw new Error("AI request limit exceeded. You are allowed 20 AI quality checks per hour.")
    }

    const validatedJobId = z.string().uuid().parse(jobId)

    const candidate = await db.candidateProfile.findUnique({
      where: { userId },
    })

    const job = await db.job.findUnique({
      where: { id: validatedJobId },
    })

    if (!candidate || !job) {
      throw new Error("Candidate profile or job listing not found")
    }

    const candidateSkills = candidate.parsedSkills || []
    const jobSkills = job.skillsRequired || []

    const hasKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    if (process.env.MOCK_AI === "true") {
      return { warning: false, missingSkills: [] }
    }
    if (!hasKey) {
      // If no key, default to no warning so candidate can apply
      return { warning: false, missingSkills: [] }
    }

    const model = getLanguageModel()
    const checkSchema = z.object({
      warning: z.boolean(),
      missingSkills: z.array(z.string()),
    })
    const { object } = await generateObject({
      model,
      output: "no-schema",
      prompt: `Compare candidate skills: ${candidateSkills.join(", ")} against job required skills: ${jobSkills.join(", ")}.
Determine if the candidate has a significant gap matching this job role (e.g. missing more than 50% of required skills, or missing critical core capabilities).
If so, set warning = true and specify up to 3 major missing skills that the candidate should add if they have them. Otherwise, set warning = false.

You MUST respond with a JSON object that strictly adheres to the following structure:
{
  "warning": boolean,
  "missingSkills": ["Skill 1", "Skill 2"]
}`,
    })

    const validatedData = checkSchema.parse(object)
    return validatedData
  } catch (error: any) {
    console.error("AI application check error:", error)
    return { warning: false, missingSkills: [] }
  }
}

/**
 * Creates a job application record and triggers cached AI score computation.
 */
export async function applyToJobAction(jobId: string) {
  try {
    const userId = await getCandidateUserOrThrow()
    const validatedJobId = z.string().uuid().parse(jobId)

    const candidate = await db.candidateProfile.findUnique({
      where: { userId },
    })

    if (!candidate) {
      throw new Error("Candidate profile not found. Please edit your profile before applying.")
    }

    // Prevent duplicate applications
    const existingApp = await db.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: validatedJobId,
          candidateId: candidate.id,
        },
      },
    })

    if (existingApp) {
      return { error: "You have already applied to this position." }
    }

    // Create application
    const application = await db.application.create({
      data: {
        jobId: validatedJobId,
        candidateId: candidate.id,
        status: "APPLIED",
      },
    })

    // Compute and cache score asynchronously
    // In serverless, we await it directly to ensure it completes
    await computeMatchForApplication(application.id)

    return { success: true, applicationId: application.id }
  } catch (error: any) {
    console.error("Apply to job error:", error)
    return { error: error.message || "Failed to submit application" }
  }
}

/**
 * Recruiter updates applicant status and issues a notification.
 */
export async function updateApplicationStatusAction(
  applicationId: string,
  status: "APPLIED" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
) {
  try {
    const companyId = await assertCompanyOwnership()

    const validatedAppId = z.string().uuid().parse(applicationId)
    const validatedStatus = z.enum(["APPLIED", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]).parse(status)

    // Load application details
    const app = await db.application.findUnique({
      where: { id: validatedAppId },
      include: {
        job: { select: { companyId: true, title: true } },
        candidate: { select: { userId: true } },
      },
    })

    if (!app || app.job.companyId !== companyId) {
      throw new Error("Unauthorized: Job listing not owned by your company")
    }

    // Update status
    const updated = await db.application.update({
      where: { id: validatedAppId },
      data: { status: validatedStatus },
    })

    // Create Notification for Candidate
    await db.notification.create({
      data: {
        userId: app.candidate.userId,
        type: "APPLICATION_STATUS_UPDATE",
        message: `Your application status for "${app.job.title}" was updated to ${status}.`,
        read: false,
      },
    })

    return { success: true, application: updated }
  } catch (error: any) {
    console.error("Update application status error:", error)
    return { error: error.message || "Failed to update application status" }
  }
}
