"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

interface JobSearchResult {
  id: string
  title: string
  description: string
  location: string | null
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  status: string
  companyId: string
  skillsRequired: string[]
  createdAt: Date
  companyName: string
  companyLogoUrl: string | null
  matchScore: number | null
}

interface SearchParamsInput {
  q?: string
  location?: string
  employmentType?: string
  salaryMin?: number
  sort?: "newest" | "best"
  page?: number
  pageSize?: number
  workMode?: string
  minMatch?: number
}

/**
 * Searches, filters, and sorts public published job listings.
 * Integrates candidate embedding profile cross joining for best match similarity.
 */
export async function searchJobsAction(params: SearchParamsInput) {
  try {
    const { 
      q, 
      location, 
      employmentType, 
      salaryMin, 
      sort = "newest", 
      page = 1, 
      pageSize = 10,
      workMode,
      minMatch
    } = params

    // Verify session candidate embedding status
    const session = await auth()
    let candidate: any = null

    if (session?.user?.id && session.user.role === "CANDIDATE") {
      candidate = await db.candidateProfile.findUnique({
        where: { userId: session.user.id },
      })
    }

    const values: any[] = []
    const conditions: string[] = ["j.status = 'PUBLISHED'"]

    if (q && q.trim()) {
      values.push(`%${q.trim()}%`)
      const paramIndex = values.length
      conditions.push(
        `(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR $${paramIndex} = ANY(j."skillsRequired"))`
      )
    }

    if (location && location.trim()) {
      values.push(`%${location.trim()}%`)
      const paramIndex = values.length
      conditions.push(`j.location ILIKE $${paramIndex}`)
    }

    if (employmentType && employmentType !== "ALL") {
      values.push(employmentType)
      const paramIndex = values.length
      conditions.push(`j."employmentType" = $${paramIndex}`)
    }

    if (salaryMin && salaryMin > 0) {
      values.push(salaryMin)
      const paramIndex = values.length
      conditions.push(`(j."salaryMax" >= $${paramIndex} OR j."salaryMin" >= $${paramIndex})`)
    }

    if (workMode && workMode !== "ALL") {
      if (workMode === "REMOTE") {
        conditions.push(`j.location ILIKE '%remote%'`)
      } else if (workMode === "HYBRID") {
        conditions.push(`j.location ILIKE '%hybrid%'`)
      } else if (workMode === "ON_SITE") {
        conditions.push(`j.location NOT ILIKE '%remote%' AND j.location NOT ILIKE '%hybrid%'`)
      }
    }

    let selectClause = `j.id, j.title, j.description, j.location, j."employmentType", j."salaryMin", j."salaryMax", j.status, j."companyId", j."skillsRequired", j."createdAt",
                        c.name as "companyName", c."logoUrl" as "companyLogoUrl"`
    let fromClause = `FROM "Job" j JOIN "Company" c ON j."companyId" = c.id`

    const isMockAi = process.env.MOCK_AI === "true"

    // If Mock AI mode is enabled, we compute Jaccard index similarity in memory
    if (isMockAi && candidate) {
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
      
      // Calculate matching scores in memory
      const candidateSkills = (candidate.parsedSkills || []).map((s: string) => s.toLowerCase().trim())
      const calculateScore = (job: any) => {
        const jobSkills = (job.skillsRequired || []).map((s: string) => s.toLowerCase().trim())
        const intersection = jobSkills.filter((s: string) => candidateSkills.includes(s))
        const union = Array.from(new Set([...jobSkills, ...candidateSkills]))
        
        let score = 50
        if (union.length > 0) {
          score = Math.round((intersection.length / union.length) * 100)
        }
        
        const titleWords = job.title.toLowerCase().split(/\s+/)
        const bioWords = (candidate.bio || "").toLowerCase().split(/\s+/)
        const titleOverlap = titleWords.filter((w: string) => w.length > 3 && bioWords.includes(w))
        if (titleOverlap.length > 0) {
          score = Math.min(100, score + 15)
        }
        return Math.max(30, Math.min(100, score))
      }

      // Fetch all matching candidates to compute list sizes
      const allQueryStr = `SELECT ${selectClause} ${fromClause} ${whereClause}`
      const dbAllJobs = await db.$queryRawUnsafe<any[]>(allQueryStr, ...values)
      
      let scoredJobs = dbAllJobs.map((j) => {
        const skillsRequired = typeof j.skillsRequired === "string" ? JSON.parse(j.skillsRequired) : j.skillsRequired
        const parsedJob = { ...j, skillsRequired }
        return {
          ...parsedJob,
          matchScore: calculateScore(parsedJob),
        }
      })

      // Filter by minMatch threshold if supplied
      if (minMatch && minMatch > 0) {
        scoredJobs = scoredJobs.filter((j) => j.matchScore >= minMatch)
      }

      // Sort
      if (sort === "best") {
        scoredJobs.sort((a, b) => b.matchScore - a.matchScore)
      } else {
        scoredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }

      const totalItems = scoredJobs.length
      const pageNum = Math.max(1, page)
      const offset = (pageNum - 1) * pageSize
      const paginatedJobs = scoredJobs.slice(offset, offset + pageSize)
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        jobs: paginatedJobs as JobSearchResult[],
        pagination: {
          page: pageNum,
          pageSize,
          totalItems,
          totalPages,
        },
        hasCandidateEmbedding: true,
      }
    }

    // Normal mode: Vector Cross Join embeddings lookup
    let hasEmbedding = false
    if (candidate) {
      const embRes = await db.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT (embedding IS NOT NULL) as "exists" FROM "CandidateProfile" WHERE id = $1`,
        candidate.id
      )
      if (embRes && embRes.length > 0 && embRes[0].exists) {
        hasEmbedding = true
      }
    }

    if (hasEmbedding && candidate) {
      values.push(candidate.id)
      const candidateParamIndex = values.length
      selectClause += `, (1 - (j.embedding <=> cp.embedding)) * 100 as "matchScore"`
      fromClause += ` CROSS JOIN "CandidateProfile" cp`
      conditions.push(`cp.id = $${candidateParamIndex}`)

      if (minMatch && minMatch > 0) {
        conditions.push(`((1 - (j.embedding <=> cp.embedding)) * 100) >= ${Number(minMatch)}`)
      }
    } else {
      selectClause += `, NULL as "matchScore"`
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    let orderClause = `ORDER BY j."createdAt" DESC`
    if (sort === "best" && hasEmbedding) {
      orderClause = `ORDER BY "matchScore" DESC`
    }

    const countValues = [...values]
    const countQueryStr = `SELECT COUNT(*)::int as "total" ${fromClause} ${whereClause}`
    const countRes = await db.$queryRawUnsafe<{ total: number }[]>(countQueryStr, ...countValues)
    const totalItems = countRes && countRes.length > 0 ? countRes[0].total : 0

    const pageNum = Math.max(1, page)
    const offset = (pageNum - 1) * pageSize

    values.push(pageSize)
    const limitParamIndex = values.length
    values.push(offset)
    const offsetParamIndex = values.length

    const queryStr = `SELECT ${selectClause} ${fromClause} ${whereClause} ${orderClause} LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`
    const jobs = await db.$queryRawUnsafe<JobSearchResult[]>(queryStr, ...values)

    const serializedJobs = jobs.map((j) => ({
      ...j,
      skillsRequired: typeof j.skillsRequired === "string" ? JSON.parse(j.skillsRequired) : j.skillsRequired,
      matchScore: j.matchScore !== null ? Math.max(0, Math.min(100, Math.round(j.matchScore))) : null,
    }))

    const totalPages = Math.ceil(totalItems / pageSize)

    return {
      jobs: serializedJobs,
      pagination: {
        page: pageNum,
        pageSize,
        totalItems,
        totalPages,
      },
      hasCandidateEmbedding: hasEmbedding,
    }
  } catch (error: any) {
    console.error("Jobs search error:", error)
    return { error: error.message || "Failed to search jobs" }
  }
}
