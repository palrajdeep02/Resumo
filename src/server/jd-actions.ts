"use server"

import { auth } from "@/lib/auth"
import { z } from "zod"
import { generateObject } from "ai"
import { getLanguageModel } from "@/ai/ai-provider"
import { rateLimit } from "@/lib/rate-limit"

// Guard to ensure user is recruiter
async function assertRecruiterOrThrow() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "RECRUITER") {
    throw new Error("Unauthorized: Recruiter permissions required")
  }
}

const jdResponseSchema = z.object({
  improvedDescription: z.string(),
  biasCheckNotes: z.array(z.string()),
  suggestedSkills: z.array(z.string()),
})

/**
 * AI JD Writer: Generates a professional, bias-reduced job description
 * and extracts matching skill tags.
 */
export async function generateJobDescriptionAction(title: string, roughDraft: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id || "anonymous"

    // Rate Limiting (20 requests / hour)
    const limiter = rateLimit(userId + "-ai-jd", 20, 3600000)
    if (!limiter.success) {
      throw new Error("AI request limit exceeded. You are allowed 20 AI job description generator calls per hour.")
    }

    const validatedTitle = z.string().min(2).max(100).parse(title)
    const validatedRoughDraft = z.string().min(5).max(3000).parse(roughDraft)

    await assertRecruiterOrThrow()

    const hasKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    if (process.env.MOCK_AI === "true") {
      return {
        success: true,
        data: {
          improvedDescription: `### About the Role\nWe are looking for a Senior Developer to join our team to build scalable interfaces.\n\n### Key Responsibilities\n- Design and deploy front-end architectures.\n- Collaborate with backend engineers.\n\n### Requirements\n- Experience with React & TypeScript.\n- Solid understanding of database systems.`,
          biasCheckNotes: ["Replaced competitive slang with neutral language.", "Focused on skill capabilities rather than years of academic credentials."],
          suggestedSkills: ["React", "TypeScript", "Next.js", "Node.js"],
        }
      }
    }
    if (!hasKey) {
      throw new Error("Missing API Key: Configure GEMINI_API_KEY or OPENAI_API_KEY in .env to use the AI writer assistant.")
    }

    const model = getLanguageModel()
    const { object } = await generateObject({
      model,
      output: "no-schema",
      prompt: `You are an expert HR assistant and technical writer specializing in inclusive, bias-reduced job listings.
Take the following job title and rough requirements, and generate:
1. A professional, well-structured job description containing:
   - "About the Role" summary
   - "Key Responsibilities" section (bullet points)
   - "Requirements" section (bullet points)
2. A bias check note: scan the input for gendered terms (e.g. "ninja", "rockstar"), age bias (e.g. "young", "recent grad"), or unnecessary credentials (e.g. "native speaker", "top-tier university"). Explain what was corrected/removed and why. If none were found, provide a general tips note.
3. A list of up to 5 suggested technical skill keyword tags to extract.

Avoid gendered pronouns, age-discriminatory phrases, and specify clear requirements rather than credentials where possible.

You MUST respond with a JSON object that strictly adheres to the following structure:
{
  "improvedDescription": "Professional job description in markdown formatting",
  "biasCheckNotes": ["Bias scan correction 1", "Bias scan correction 2"],
  "suggestedSkills": ["Skill 1", "Skill 2"]
}

Rough Title: ${validatedTitle}
Rough Draft / Inputs:
${validatedRoughDraft}`,
    })

    const validatedData = jdResponseSchema.parse(object)
    return { success: true, data: validatedData }
  } catch (error: any) {
    console.error("AI JD Writer error:", error)
    return { error: error.message || "Failed to generate job description" }
  }
}
