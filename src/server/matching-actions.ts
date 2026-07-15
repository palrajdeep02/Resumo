"use server"

import { db } from "@/lib/db"
import { generateText } from "ai"
import { assertCompanyOwnership } from "./recruiter-actions"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { auth } from "@/lib/auth"
import { getLanguageModel } from "@/ai/ai-provider"

interface RawJobMatch {
  id: string
  title: string
  description: string
  location: string | null
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  status: string
  companyId: string
  companyName: string
  companyLogoUrl: string | null
  matchScore: number
  skillsRequired: string[]
}

interface RawScoreMatch {
  matchScore: number
}

// Check if embedding exists on table row
async function checkEmbeddingExists(type: "candidate" | "job", id: string): Promise<boolean> {
  const table = type === "candidate" ? "CandidateProfile" : "Job"
  try {
    const res = await db.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT (embedding IS NOT NULL) as "exists" FROM "${table}" WHERE id = $1`,
      id
    )
    return !!(res && res.length > 0 && res[0].exists)
  } catch (err) {
    console.error(`Error checking embedding existence for ${type} (${id}):`, err)
    return false
  }
}

/**
 * Computes semantic similarity score and generates AI fit explanation for a specific Application.
 * Caches the results on the Application record.
 */
export async function computeMatchForApplication(applicationId: string) {
  try {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!app) return null

    const hasCandidateEmbedding = await checkEmbeddingExists("candidate", app.candidateId)
    const hasJobEmbedding = await checkEmbeddingExists("job", app.jobId)

    let matchScore = 50
    let aiFitSummary = "AI fit summary is not available because profiles are not fully completed."

    const hasKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY

    if (hasCandidateEmbedding && hasJobEmbedding) {
      // 1. Run raw vector cosine similarity query
      const scoreRes = await db.$queryRawUnsafe<RawScoreMatch[]>(
        `SELECT (1 - (j.embedding <=> cp.embedding)) * 100 as "matchScore"
         FROM "Job" j
         CROSS JOIN "CandidateProfile" cp
         WHERE j.id = $1 AND cp.id = $2`,
        app.jobId,
        app.candidateId
      )

      if (scoreRes && scoreRes.length > 0) {
        matchScore = Math.max(0, Math.min(100, Math.round(scoreRes[0].matchScore)))
      }

      // 2. Generate fit explanation with LLM
      if (process.env.MOCK_AI === "true") {
        const candidateSkills = (app.candidate.parsedSkills || []).map((s) => s.toLowerCase().trim())
        const jobSkills = (app.job.skillsRequired || []).map((s) => s.toLowerCase().trim())
        const intersection = jobSkills.filter((s) => candidateSkills.includes(s))
        const union = Array.from(new Set([...jobSkills, ...candidateSkills]))
        
        let calculatedScore = 50
        if (union.length > 0) {
          calculatedScore = Math.round((intersection.length / union.length) * 100)
        }
        matchScore = Math.max(30, Math.min(100, calculatedScore))

        const matchedSkills = app.job.skillsRequired.filter((s) => candidateSkills.includes(s.toLowerCase().trim()))
        const missingSkills = app.job.skillsRequired.filter((s) => !candidateSkills.includes(s.toLowerCase().trim()))

        if (matchedSkills.length > 0) {
          aiFitSummary = `The candidate is a strong match due to direct overlap in ${matchedSkills.slice(0, 3).join(", ")}.`
          if (missingSkills.length > 0) {
            aiFitSummary += ` Exposure to ${missingSkills.slice(0, 2).join(", ")} is suggested.`
          }
        } else {
          aiFitSummary = `The candidate matches basic attributes but needs skills in ${app.job.skillsRequired.slice(0, 2).join(" and ")}.`
        }
      } else if (hasKey) {
        try {
          const model = getLanguageModel()
          const { text } = await generateText({
            model,
            prompt: `Compare the candidate profile with the job requirements and explain in 2 to 3 concise, professional sentences why they are or are not a strong match. Mention specific overlapping skills and gaps.
            
Candidate name: ${app.candidate.user?.name || "Candidate"}
Candidate Skills: ${(app.candidate.parsedSkills || []).join(", ")}
Candidate Experience: ${app.candidate.experienceYears || 0} years
Candidate Bio: ${app.candidate.bio || ""}

Job Title: ${app.job.title}
Job Required Skills: ${(app.job.skillsRequired || []).join(", ")}
Job Description: ${app.job.description.substring(0, 400)}...`,
          })
          aiFitSummary = text.trim()
        } catch {
          aiFitSummary = "Error generating AI fit summary."
        }
      } else {
        aiFitSummary = "Configure an AI API key in your .env file to generate this fit explanation."
      }
    } else {
      aiFitSummary = "Please complete both candidate profile resume details and job posting details to generate a semantic AI fit explanation."
    }

    // Cache computed data
    const updated = await db.application.update({
      where: { id: applicationId },
      data: {
        matchScore,
        aiFitSummary,
      },
      include: {
        candidate: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    })

    return updated
  } catch (error) {
    console.error(`Error computing match for application ${applicationId}:`, error)
    return null
  }
}

/**
 * Candidate recommended jobs semantic search.
 */
export async function getMatchesForCandidate(candidateId: string, limit = 5) {
  try {
    const candidate = await db.candidateProfile.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return { matches: [] }
    }

    const hasKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY

    // If mock AI mode is enabled, calculate matches deterministically based on skills overlap
    if (process.env.MOCK_AI === "true") {
      const allJobs = await db.job.findMany({
        where: { status: "PUBLISHED" },
        include: {
          company: {
            select: { name: true, logoUrl: true },
          },
        },
      })

      const candidateSkills = (candidate.parsedSkills || []).map((s) => s.toLowerCase().trim())

      const scoredJobs = allJobs.map((job) => {
        const jobSkills = (job.skillsRequired || []).map((s) => s.toLowerCase().trim())
        const intersection = jobSkills.filter((s) => candidateSkills.includes(s))
        const union = Array.from(new Set([...jobSkills, ...candidateSkills]))
        
        let matchScore = 50
        if (union.length > 0) {
          matchScore = Math.round((intersection.length / union.length) * 100)
        }

        // Add a slight match score boost if job title keywords appear in candidate bio
        const titleWords = job.title.toLowerCase().split(/\s+/)
        const bioWords = (candidate.bio || "").toLowerCase().split(/\s+/)
        const titleOverlap = titleWords.filter((w) => w.length > 3 && bioWords.includes(w))
        if (titleOverlap.length > 0) {
          matchScore = Math.min(100, matchScore + 15)
        }

        // Make sure it yields an accurate, sensible mock match score between 30 and 100
        matchScore = Math.max(30, Math.min(100, matchScore))

        // Dynamic explanation based on matching and missing skills
        const matchedSkills = job.skillsRequired.filter((s) => candidateSkills.includes(s.toLowerCase().trim()))
        const missingSkills = job.skillsRequired.filter((s) => !candidateSkills.includes(s.toLowerCase().trim()))

        let fitExplanation = ""
        if (matchedSkills.length > 0) {
          fitExplanation = `Strong fit because your profile overlaps with ${matchedSkills.slice(0, 3).join(", ")}.`
          if (missingSkills.length > 0) {
            fitExplanation += ` Consider adding exposure to ${missingSkills.slice(0, 2).join(", ")} to maximize match.`
          }
        } else {
          fitExplanation = `This role is a partial match. We suggest gaining skills in ${job.skillsRequired.slice(0, 2).join(" and ")}.`
        }

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          status: job.status,
          companyId: job.companyId,
          companyName: job.company.name,
          companyLogoUrl: job.company.logoUrl,
          skillsRequired: job.skillsRequired,
          matchScore,
          fitExplanation,
        }
      })

      const matches = scoredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)

      return { matches }
    }

    // Normal mode: Cosine similarity search against published jobs
    const embeddingExists = await checkEmbeddingExists("candidate", candidateId)
    if (!embeddingExists) {
      return {
        matches: [],
        warning: "Complete your profile or upload a resume to unlock AI job matches!",
      }
    }

    const rawMatches = await db.$queryRawUnsafe<RawJobMatch[]>(
      `SELECT j.id, j.title, j.description, j.location, j."employmentType", j."salaryMin", j."salaryMax", j.status, j."companyId", j."skillsRequired",
              c.name as "companyName", c."logoUrl" as "companyLogoUrl",
              (1 - (j.embedding <=> cp.embedding)) * 100 as "matchScore"
       FROM "Job" j
       JOIN "Company" c ON j."companyId" = c.id
       CROSS JOIN "CandidateProfile" cp
       WHERE cp.id = $1 AND j.status = 'PUBLISHED' AND j.embedding IS NOT NULL AND cp.embedding IS NOT NULL
       ORDER BY "matchScore" DESC
       LIMIT $2`,
      candidateId,
      limit
    )

    const matches = []

    for (const raw of rawMatches) {
      let fitExplanation = ""
      if (hasKey) {
        try {
          const model = getLanguageModel()
          const { text } = await generateText({
            model,
            prompt: `In 2 short sentences, explain why this candidate matches this job.
            Candidate Skills: ${(candidate.parsedSkills || []).join(", ")}, Experience: ${candidate.experienceYears || 0} years.
            Job Title: ${raw.title}, Skills: ${raw.description.substring(0, 300)}...`,
          })
          fitExplanation = text.trim()
        } catch {
          fitExplanation = "AI fit summary is currently unavailable."
        }
      } else {
        fitExplanation = "Add a GEMINI_API_KEY or OPENAI_API_KEY in .env to generate matching explanation."
      }

      matches.push({
        ...raw,
        matchScore: Math.max(0, Math.min(100, Math.round(raw.matchScore))),
        fitExplanation,
      })
    }

    return { matches }
  } catch (error: any) {
    console.error("Match search error:", error)
    return { error: error.message || "Failed to search matches" }
  }
}

/**
 * Recruiter ranked applicants for a job.
 */
export async function getRankedApplicantsForJob(jobId: string) {
  try {
    const companyId = await assertCompanyOwnership()

    // Verify job belongs to company
    const job = await db.job.findUnique({
      where: { id: jobId },
    })

    if (!job || job.companyId !== companyId) {
      throw new Error("Unauthorized: Job listing not owned by your company")
    }

    const applications = await db.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: {
        matchScore: "desc",
      },
    })

    const results = []
    for (const app of applications) {
      if (app.matchScore === null || app.aiFitSummary === null) {
        const computed = await computeMatchForApplication(app.id)
        if (computed) {
          results.push(computed)
          continue
        }
      }
      results.push(app)
    }

    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    return { applicants: results }
  } catch (error: any) {
    console.error("Ranked applicants fetch error:", error)
    return { error: error.message || "Failed to load ranked applicants" }
  }
}

/**
 * Manual recompute trigger server action.
 */
export async function recomputeApplicationScoreAction(applicationId: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id || "anonymous"

    // Rate Limiting (20 requests / hour)
    const limiter = rateLimit(userId + "-ai-recompute", 20, 3600000)
    if (!limiter.success) {
      throw new Error("AI request limit exceeded. You are allowed 20 AI recomputation calls per hour.")
    }

    const validatedAppId = z.string().uuid().parse(applicationId)

    // Assert recruiter
    await assertCompanyOwnership()
    const updated = await computeMatchForApplication(validatedAppId)
    if (!updated) {
      throw new Error("Application not found or update failed")
    }
    return { success: true, application: updated }
  } catch (error: any) {
    console.error("Manual recompute error:", error)
    return { error: error.message || "Failed to recompute application score" }
  }
}
