import { embed } from "ai"
import { getEmbeddingModel } from "./ai-provider"
import { db } from "@/lib/db"

/**
 * Generates an embedding from the concatenated text representation of a
 * CandidateProfile or Job, and stores it in the database using raw SQL.
 * Supports zero-padding for 768-dimension models (Google) to fit 1536-dimension column.
 */
export async function generateAndStoreEmbedding(type: "candidate" | "job", id: string) {
  const hasKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (!hasKey && process.env.MOCK_AI !== "true") {
    console.warn(`[Embedding] Skipping generation for ${type} (${id}): GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY is not set.`)
    return
  }

  try {
    let textToEmbed = ""

    if (type === "candidate") {
      const profile = await db.candidateProfile.findUnique({
        where: { id },
      })
      if (!profile) throw new Error("Candidate profile not found")

      const skillsStr = (profile.parsedSkills || []).join(", ")
      const expStr = `${profile.experienceYears || 0} years experience`
      const bioStr = profile.bio || ""
      textToEmbed = `${skillsStr} | ${expStr} | ${bioStr}`
    } else {
      const job = await db.job.findUnique({
        where: { id },
      })
      if (!job) throw new Error("Job not found")

      const skillsStr = (job.skillsRequired || []).join(", ")
      const descStr = job.description || ""
      const titleStr = job.title || ""
      textToEmbed = `${titleStr} | ${descStr} | ${skillsStr}`
    }

    if (!textToEmbed.trim()) {
      return
    }

    // Generate embedding (or mock values if MOCK_AI is enabled)
    let embedding: number[]
    if (process.env.MOCK_AI === "true") {
      embedding = new Array(768).fill(0).map(() => Math.random() - 0.5)
    } else {
      const model = getEmbeddingModel()
      const res = await embed({
        model,
        value: textToEmbed,
      })
      embedding = res.embedding
    }

    // Handle padding/truncation: fit to 768-dim (Prisma vector)
    let finalVector = [...embedding]
    if (finalVector.length > 768) {
      finalVector = finalVector.slice(0, 768)
    } else if (finalVector.length < 768) {
      finalVector = [...finalVector, ...new Array(768 - finalVector.length).fill(0)]
    }

    if (finalVector.length !== 768) {
      throw new Error(`[Embedding] Vector size mismatch: got ${finalVector.length}, expected 768`)
    }

    const vectorStr = `[${finalVector.join(",")}]`

    // Update database using raw SQL cast
    if (type === "candidate") {
      await db.$executeRawUnsafe(
        `UPDATE "CandidateProfile" SET "embedding" = cast($1 as vector) WHERE "id" = $2`,
        vectorStr,
        id
      )
    } else {
      await db.$executeRawUnsafe(
        `UPDATE "Job" SET "embedding" = cast($1 as vector) WHERE "id" = $2`,
        vectorStr,
        id
      )
    }

    console.log(`[Embedding] Generated & stored embedding for ${type} (${id}) successfully. Dimensions: ${embedding.length} (resized to 768).`)
  } catch (error) {
    console.error(`[Embedding] Error generating/storing embedding for ${type} (${id}):`, error)
  }
}
