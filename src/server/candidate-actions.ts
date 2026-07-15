"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { promises as fs } from "fs"
import path from "path"
import "pdf-parse/worker"
import * as pdf from "pdf-parse"
import mammoth from "mammoth"
import { generateObject } from "ai"
import { getLanguageModel } from "@/ai/ai-provider"
import { generateAndStoreEmbedding } from "@/ai/embeddings"
import { sanitizeText } from "@/lib/sanitize"
import { rateLimit } from "@/lib/rate-limit"

async function getCandidateUserOrThrow() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "CANDIDATE") {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

import { profileSchema } from "@/lib/schemas"

// Schema for structured AI parser output
const parsedSchema = z.object({
  parsedSkills: z.array(z.string()),
  experienceYears: z.number(),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.number(),
    })
  ),
  bio: z.string(),
})

export async function getCandidateProfile() {
  try {
    const userId = await getCandidateUserOrThrow()
    const profile = await db.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    return { profile }
  } catch (error: any) {
    console.error("Fetch profile error:", error)
    return { error: error.message || "Failed to fetch candidate profile" }
  }
}

export async function updateCandidateProfile(values: z.infer<typeof profileSchema>) {
  try {
    const userId = await getCandidateUserOrThrow()
    const validatedData = profileSchema.parse(values)

    const result = await db.$transaction(async (tx) => {
      // Sanitize fields before database transaction
      const cleanName = sanitizeText(validatedData.name)
      const cleanBio = validatedData.bio ? sanitizeText(validatedData.bio) : null
      const cleanEducation = (validatedData.education || []).map((edu) => ({
        degree: sanitizeText(edu.degree),
        institution: sanitizeText(edu.institution),
        year: edu.year,
      }))

      await tx.user.update({
        where: { id: userId },
        data: { name: cleanName },
      })

      const profile = await tx.candidateProfile.update({
        where: { userId },
        data: {
          bio: cleanBio,
          experienceYears: validatedData.experienceYears ?? null,
          parsedSkills: validatedData.parsedSkills.map((s) => sanitizeText(s)),
          education: cleanEducation as any,
          resumeUrl: validatedData.resumeUrl || null,
        },
      })
      return profile
    })

    // Generate & store vector embedding asynchronously
    await generateAndStoreEmbedding("candidate", result.id)

    return { success: true, profile: result }
  } catch (error: any) {
    console.error("Update profile error:", error)
    return { error: error.message || "Failed to update profile" }
  }
}

// Text extraction helpers
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let lib = pdf as any
  if (!lib || (!lib.PDFParse && typeof lib !== "function" && typeof lib.default !== "function")) {
    try {
      lib = require("pdf-parse")
    } catch {}
  }

  // Handle modern mehmet-kozan/pdf-parse class-based API
  if (lib && lib.PDFParse) {
    const parser = new lib.PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text || ""
  }

  // Fallback to legacy functional pdf-parse API
  const pdfParser = lib?.default || lib
  if (typeof pdfParser === "function") {
    const data = await pdfParser(buffer)
    return data.text || ""
  }

  throw new Error("Could not resolve a valid PDF parser constructor.")
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const data = await mammoth.extractRawText({ buffer })
  return data.value || ""
}

export async function parseResumeAction(resumeUrl: string) {
  try {
    const userId = await getCandidateUserOrThrow()

    // Enforce AI Rate Limiter (20 requests / hour)
    const limiter = rateLimit(userId + "-ai-parse", 20, 3600000)
    if (!limiter.success) {
      throw new Error("AI request limit exceeded. You are allowed 20 AI resume parsing calls per hour.")
    }

    // Input validation
    const validatedUrl = z.string().min(1).refine(val => val.startsWith("/") || val.startsWith("http"), {
      message: "Invalid resume path format"
    }).parse(resumeUrl)
    if (!validatedUrl) {
      throw new Error("No resume file path specified")
    }

    // 1. Fetch/read the file into a buffer
    let fileBuffer: Buffer
    if (resumeUrl.startsWith("http")) {
      const response = await fetch(resumeUrl)
      if (!response.ok) throw new Error("Failed to fetch remote resume file")
      fileBuffer = Buffer.from(await response.arrayBuffer())
    } else {
      const relativePath = resumeUrl.startsWith("/") ? resumeUrl.substring(1) : resumeUrl
      const filePath = path.join(process.cwd(), "public", relativePath)
      fileBuffer = await fs.readFile(filePath)
    }

    // 2. Extract text based on file format extension
    const fileExtension = path.extname(resumeUrl).toLowerCase()
    let text = ""
    if (fileExtension === ".pdf") {
      text = await extractTextFromPdf(fileBuffer)
    } else if (fileExtension === ".docx") {
      text = await extractTextFromDocx(fileBuffer)
    } else {
      throw new Error("Unsupported file format. Only PDF and DOCX files are supported.")
    }

    const cleanText = text.trim()
    if (!cleanText) {
      throw new Error("The resume file is empty or text could not be extracted.")
    }

    // 3. Call AI SDK generateObject (or return mock data if MOCK_AI is enabled)
    if (process.env.MOCK_AI === "true") {
      return {
        success: true,
        data: {
          bio: "Experienced Full Stack Engineer specializing in React, Node.js, and Cloud Architectures.",
          experienceYears: 6,
          parsedSkills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "State University",
              year: 2019,
            }
          ]
        }
      }
    }

    const model = getLanguageModel()
    const { object } = await generateObject({
      model,
      output: "no-schema",
      prompt: `You are an expert ATS (Applicant Tracking System) parser. Extract structural details from the following resume text.
Ensure to list matching technical skills (programming languages, libraries, tools), total years of professional experience (as an integer), education entries (including degree title, university name, and graduation year), and write a concise professional bio (2-3 sentences max) summarizing their work profile.

You MUST respond with a JSON object that strictly adheres to the following structure:
{
  "parsedSkills": ["Skill 1", "Skill 2"],
  "experienceYears": number (total professional experience years),
  "education": [
    {
      "degree": "Degree Title",
      "institution": "Institution Name",
      "year": number (graduation year)
    }
  ],
  "bio": "Concise professional bio summarizing work profile"
}

Resume Text:
${cleanText}`,
    })

    const validatedData = parsedSchema.parse(object)

    return {
      success: true,
      data: validatedData,
    }
  } catch (error: any) {
    console.error("Resume parsing error:", error)
    return { error: error.message || "Failed to parse resume with AI" }
  }
}
