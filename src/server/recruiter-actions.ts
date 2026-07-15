"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { generateAndStoreEmbedding } from "@/ai/embeddings"
import { sanitizeText } from "@/lib/sanitize"

// Reusable guard to assert company ownership
export async function assertCompanyOwnership(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "RECRUITER") {
    throw new Error("Unauthorized: Recruiter access required")
  }

  const recruiter = await db.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!recruiter) {
    throw new Error("Unauthorized: Recruiter profile not found")
  }

  return recruiter.companyId
}

import { companySchema, jobSchema } from "@/lib/schemas"

// Company actions
export async function getCompanyProfile() {
  try {
    const companyId = await assertCompanyOwnership()
    const company = await db.company.findUnique({
      where: { id: companyId },
    })
    return { company }
  } catch (error: any) {
    console.error("Fetch company profile error:", error)
    return { error: error.message || "Failed to fetch company profile" }
  }
}

export async function updateCompanyProfile(values: z.infer<typeof companySchema>) {
  try {
    const companyId = await assertCompanyOwnership()
    const validatedData = companySchema.parse(values)

    const company = await db.company.update({
      where: { id: companyId },
      data: {
        name: sanitizeText(validatedData.name),
        website: validatedData.website ? sanitizeText(validatedData.website) : null,
        logoUrl: validatedData.logoUrl || null,
        description: validatedData.description ? sanitizeText(validatedData.description) : null,
      },
    })

    return { success: true, company }
  } catch (error: any) {
    console.error("Update company profile error:", error)
    return { error: error.message || "Failed to update company profile" }
  }
}

// Job actions
export async function getCompanyJobs() {
  try {
    const companyId = await assertCompanyOwnership()
    const jobs = await db.job.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })
    return { jobs }
  } catch (error: any) {
    console.error("Fetch jobs error:", error)
    return { error: error.message || "Failed to fetch jobs" }
  }
}

export async function createJob(values: z.infer<typeof jobSchema>) {
  try {
    const companyId = await assertCompanyOwnership()
    const validatedData = jobSchema.parse(values)

    const job = await db.job.create({
      data: {
        companyId,
        title: sanitizeText(validatedData.title),
        description: sanitizeText(validatedData.description),
        skillsRequired: validatedData.skillsRequired.map((s) => sanitizeText(s)),
        location: validatedData.location ? sanitizeText(validatedData.location) : null,
        employmentType: validatedData.employmentType,
        salaryMin: validatedData.salaryMin ?? null,
        salaryMax: validatedData.salaryMax ?? null,
        status: validatedData.status,
      },
    })

    // Generate & store vector embedding asynchronously on publish
    if (job.status === "PUBLISHED") {
      await generateAndStoreEmbedding("job", job.id)
    }

    return { success: true, job }
  } catch (error: any) {
    console.error("Create job error:", error)
    return { error: error.message || "Failed to create job" }
  }
}

export async function updateJob(jobId: string, values: z.infer<typeof jobSchema>) {
  try {
    const companyId = await assertCompanyOwnership()

    // Enforce ownership
    const existingJob = await db.job.findUnique({
      where: { id: jobId },
    })

    if (!existingJob || existingJob.companyId !== companyId) {
      throw new Error("Unauthorized: You do not own this job listing")
    }

    const validatedData = jobSchema.parse(values)

    const job = await db.job.update({
      where: { id: jobId },
      data: {
        title: sanitizeText(validatedData.title),
        description: sanitizeText(validatedData.description),
        skillsRequired: validatedData.skillsRequired.map((s) => sanitizeText(s)),
        location: validatedData.location ? sanitizeText(validatedData.location) : null,
        employmentType: validatedData.employmentType,
        salaryMin: validatedData.salaryMin ?? null,
        salaryMax: validatedData.salaryMax ?? null,
        status: validatedData.status,
      },
    })

    // Generate & store vector embedding asynchronously on publish
    if (job.status === "PUBLISHED") {
      await generateAndStoreEmbedding("job", job.id)
    }

    return { success: true, job }
  } catch (error: any) {
    console.error("Update job error:", error)
    return { error: error.message || "Failed to update job" }
  }
}

export async function deleteOrCloseJob(jobId: string) {
  try {
    const companyId = await assertCompanyOwnership()

    const existingJob = await db.job.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    if (!existingJob || existingJob.companyId !== companyId) {
      throw new Error("Unauthorized: You do not own this job listing")
    }

    // Soft-delete if applications exist, otherwise hard-delete
    if (existingJob._count.applications > 0) {
      await db.job.update({
        where: { id: jobId },
        data: { status: "CLOSED" },
      })
      return { success: true, status: "CLOSED", message: "Job closed because applications exist" }
    } else {
      await db.job.delete({
        where: { id: jobId },
      })
      return { success: true, status: "DELETED", message: "Job deleted successfully" }
    }
  } catch (error: any) {
    console.error("Delete/Close job error:", error)
    return { error: error.message || "Failed to delete/close job" }
  }
}

// Stats action
export async function getRecruiterStats() {
  try {
    const companyId = await assertCompanyOwnership()

    // Total active jobs
    const activeJobsCount = await db.job.count({
      where: {
        companyId,
        status: "PUBLISHED",
      },
    })

    // Get all jobs to calculate total applicants and chart data
    const jobs = await db.job.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    const totalApplicants = jobs.reduce((sum, job) => sum + job._count.applications, 0)

    // Chart data for Recharts: { name, applicants }
    const chartData = jobs.map((job) => ({
      name: job.title.length > 15 ? `${job.title.substring(0, 15)}...` : job.title,
      applicants: job._count.applications,
    }))

    return {
      stats: {
        activeJobsCount,
        totalApplicants,
        chartData,
      },
    }
  } catch (error: any) {
    console.error("Fetch recruiter stats error:", error)
    return { error: error.message || "Failed to fetch stats" }
  }
}
