import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, profiles, matchScores, tailoredDocuments, activityLog } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { streamText } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { z } from "zod";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/security";

const requestSchema = z.object({
  applicationId: z.string().uuid(),
  type: z.enum(["resume", "cover_letter"]),
});

// Configure Google provider using the key placeholder from .env
const google = createGoogle({
  apiKey: process.env.AI_API_KEY || "",
});

export async function POST(request: Request) {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limit check: 10 requests per user per hour
  const rateLimitStatus = isRateLimited(userId, "tailor");
  if (rateLimitStatus.limited) {
    return NextResponse.json(
      { error: "Too many requests. You are rate limited to 10 AI requests per hour. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsedRequest = requestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid request parameters. 'applicationId' and 'type' are required." },
      { status: 400 }
    );
  }

  const { applicationId, type } = parsedRequest.data;

  try {
    // 1. Fetch application details and verify ownership
    const [app] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!app) {
      return NextResponse.json({ error: "Forbidden: Application not found." }, { status: 403 });
    }

    // 2. Fetch candidate base profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile || !profile.baseResumeText) {
      return NextResponse.json(
        { error: "Please complete your Base Profile details first before generating tailored documents." },
        { status: 400 }
      );
    }

    if (!process.env.AI_API_KEY) {
      return NextResponse.json(
        { error: "AI_API_KEY is not defined in the environment. Cannot perform AI tailoring." },
        { status: 500 }
      );
    }

    // 3. Fetch most recent match score
    const [score] = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.applicationId, applicationId))
      .limit(1);

    // 4. Create prompts
    const strengthsStr = Array.isArray(score?.strengths) 
      ? (score.strengths as string[]).join("\n- ") 
      : "None analyzed yet.";
    const gapsStr = Array.isArray(score?.skillGaps) 
      ? (score.skillGaps as string[]).join("\n- ") 
      : "None analyzed yet.";

    // Sanitize user inputs to guard against prompt injections
    const sanitizedResumeText = sanitizePromptInput(profile.baseResumeText);
    const sanitizedJobDescription = sanitizePromptInput(app.jobDescriptionText);

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "resume") {
      systemPrompt = `You are a professional resume writer and recruiter. 
Your goal is to tailor the candidate's resume experience bullets specifically to highlight alignment with the target job description.
Identify relevant achievements, optimize key terms, mirror the vocabulary of the job description, and highlight the candidate's match strengths. 
If skill gaps exist, rephrase experience honestly to emphasize transferable skills.
Format your output as clean, copy-pasteable Markdown resume experience bullets under relevant sections (e.g. Work Experience, Skills). Do not output introduction or outro text—start directly with the tailored content.`;

      userPrompt = `Please tailor my resume experience bullets for the target job.
      
<candidate_profile>
CORE SKILLS: ${profile.skills?.join(", ") || "None listed"}
RESUME TEXT:
"""
${sanitizedResumeText}
"""
</candidate_profile>

<job_description_input>
"""
${sanitizedJobDescription}
"""
</job_description_input>

<match_context>
KEY MATCH STRENGTHS:
- ${strengthsStr}

IDENTIFIED GAPS TO RESOLVE:
- ${gapsStr}
</match_context>`;
    } else {
      systemPrompt = `You are a professional cover letter writer.
Your goal is to write a highly compelling, formal, and authentic one-page cover letter (in Markdown) from the candidate to the target hiring organization.
Incorporate candidate details, align strengths to job requirements, and make a strong case for the candidate's fit. Keep the tone professional, persuasive, and custom.
Do not output extra introduction or outro text beyond the letter content itself. Start directly with the letter structure (Date, Hiring Team details, Greeting, Letter Body, Signoff).`;

      userPrompt = `Please write a tailored cover letter for this job role.
      
<candidate_profile>
CANDIDATE NAME: ${profile.userId === userId ? (profile.skills ? "Alex Morgan" : "Alex Morgan") : "Alex Morgan"} (Use a placeholder name like Alex Morgan)
CORE SKILLS: ${profile.skills?.join(", ") || "None listed"}
RESUME TEXT:
"""
${sanitizedResumeText}
"""
</candidate_profile>

<job_description_input>
COMPANY: ${app.company}
JOB TITLE: ${app.jobTitle}
DETAILS:
"""
${sanitizedJobDescription}
"""
</job_description_input>

<match_context>
KEY MATCH STRENGTHS:
- ${strengthsStr}

IDENTIFIED GAPS TO MITIGATE:
- ${gapsStr}
</match_context>`;
    }

    // 5. Invoke streamText
    const result = await streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: async ({ text }) => {
        try {
          // Find the latest version number
          const [latestDoc] = await db
            .select({ version: tailoredDocuments.version })
            .from(tailoredDocuments)
            .where(
              and(
                eq(tailoredDocuments.applicationId, applicationId),
                eq(tailoredDocuments.type, type)
              )
            )
            .orderBy(desc(tailoredDocuments.version))
            .limit(1);

          const nextVersion = (latestDoc?.version || 0) + 1;

          // Insert new tailored document record
          await db.insert(tailoredDocuments).values({
            applicationId,
            type,
            contentMd: text,
            version: nextVersion,
          });

          // Log the activity
          const docLabel = type === "cover_letter" ? "Cover Letter" : "Tailored Resume";
          await db.insert(activityLog).values({
            applicationId,
            eventType: "document_tailor",
            note: `Generated tailored ${docLabel} (v${nextVersion}) via AI streaming.`,
          });
        } catch (error) {
          console.error("Failed to save tailored document on Finish callback:", error);
        }
      },
    });

    // 6. Return standard text stream response (pure text, no prefix blocks)
    return result.toTextStreamResponse();

  } catch (error) {
    console.error("AI Tailoring stream error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating tailored document." },
      { status: 500 }
    );
  }
}
