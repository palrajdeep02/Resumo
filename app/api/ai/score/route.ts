import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, profiles, matchScores, activityLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { generateObject } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { z } from "zod";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/security";

const requestSchema = z.object({
  applicationId: z.string().uuid(),
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
  const rateLimitStatus = isRateLimited(userId, "score");
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
      { error: "Invalid request parameters. 'applicationId' is required." },
      { status: 400 }
    );
  }

  const { applicationId } = parsedRequest.data;

  try {
    // 1. Fetch application and verify ownership
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
        { error: "Please complete your Base Profile details (resume text and skills) first before analyzing match quality." },
        { status: 400 }
      );
    }

    if (!process.env.AI_API_KEY) {
      return NextResponse.json(
        { error: "AI_API_KEY is not defined in the environment. Cannot perform AI analysis." },
        { status: 500 }
      );
    }

    // 3. Call Google Gemini model via Vercel AI SDK
    const promptSchema = z.object({
      overall_score: z.number().int().min(0).max(100),
      matched_skills: z.array(z.string()),
      missing_skills: z.array(z.string()),
      strengths: z.array(z.string()),
      recommendations: z.array(z.string()),
    });

    const systemPrompt = `You are a strict, honest technical recruiter. 
You are evaluating a candidate's profile (including core skills and full resume text) against a specific job description. 
Your task is to perform a rigorous compatibility match check and return a structured analysis.
Be strict and honest with your scoring. Do not be overly generous—realistic scoring is critical. A match score of 80+ should be reserved for candidates who fit all core requirements almost perfectly. If key qualifications, experience, or skills are missing, decrease the score appropriately.`;

    // Sanitize user inputs to guard against prompt injections
    const sanitizedResumeText = sanitizePromptInput(profile.baseResumeText);
    const sanitizedJobDescription = sanitizePromptInput(app.jobDescriptionText);

    const userPrompt = `Evaluate the match quality for this target job.
    
<candidate_profile>
SKILLS KEYWORDS: ${profile.skills?.join(", ") || "None provided"}
BASE RESUME TEXT:
"""
${sanitizedResumeText}
"""
</candidate_profile>

<job_description_input>
"""
${sanitizedJobDescription}
"""
</job_description_input>`;

    const response = await generateObject({
      model: google("gemini-1.5-flash"), // using standard flash model
      schema: promptSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    const scoreData = response.object;

    // 4. Save results to match_scores table
    const [existingScore] = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.applicationId, applicationId))
      .limit(1);

    if (existingScore) {
      await db
        .update(matchScores)
        .set({
          overallScore: scoreData.overall_score,
          skillGaps: scoreData.missing_skills,
          strengths: scoreData.strengths,
          aiRawResponse: scoreData,
          createdAt: new Date(),
        })
        .where(eq(matchScores.applicationId, applicationId));
    } else {
      await db.insert(matchScores).values({
        applicationId,
        overallScore: scoreData.overall_score,
        skillGaps: scoreData.missing_skills,
        strengths: scoreData.strengths,
        aiRawResponse: scoreData,
      });
    }

    // 5. Log activity event
    await db.insert(activityLog).values({
      applicationId,
      eventType: "match_score",
      note: `Application match analyzed by AI with overall compatibility score of ${scoreData.overall_score}%.`,
    });

    // Return the structured object
    return NextResponse.json({ success: true, data: scoreData });

  } catch (error) {
    console.error("AI Match score error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the job match. Please try again." },
      { status: 500 }
    );
  }
}
