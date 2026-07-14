"use server";

import { db } from "@/db";
import { applications, activityLog, tailoredDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const applicationSchema = z.object({
  company: z.string().min(1, "Company name is required."),
  jobTitle: z.string().min(1, "Job title is required."),
  jobDescriptionText: z.string().min(10, "Job description must be at least 10 characters long."),
});

const statusSchema = z.enum(["saved", "applied", "interviewing", "offer", "rejected"]);

export async function createApplication(prevState: any, formData: FormData) {
  const userId = await getCurrentUser();
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized. Please log in.",
    };
  }

  const rawData = {
    company: formData.get("company") as string,
    jobTitle: formData.get("jobTitle") as string,
    jobDescriptionText: formData.get("jobDescriptionText") as string,
  };

  const result = applicationSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { company, jobTitle, jobDescriptionText } = result.data;
  let newAppId = "";

  try {
    const [newApp] = await db
      .insert(applications)
      .values({
        userId,
        company,
        jobTitle,
        jobDescriptionText,
        status: "saved",
      })
      .returning({ id: applications.id });

    newAppId = newApp.id;

    // Log the initial activity event
    await db.insert(activityLog).values({
      applicationId: newApp.id,
      eventType: "status_change",
      note: "Application record created and status set to 'Saved'.",
    });

  } catch (error) {
    console.error("Create application error:", error);
    return {
      success: false,
      message: "Failed to create application. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/applications/${newAppId}`);
}

export async function updateApplicationStatus(applicationId: string, status: "saved" | "applied" | "interviewing" | "offer" | "rejected") {
  const userId = await getCurrentUser();
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized. Please log in.",
    };
  }

  const result = statusSchema.safeParse(status);
  if (!result.success) {
    return {
      success: false,
      message: "Invalid status value.",
    };
  }

  try {
    // Verify resource ownership
    const [app] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!app) {
      return {
        success: false,
        message: "Forbidden: You do not own this application record.",
      };
    }

    // Update status
    await db
      .update(applications)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    // Log this status change in the activity log
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    await db.insert(activityLog).values({
      applicationId,
      eventType: "status_change",
      note: `Application stage updated to '${statusLabel}'.`,
    });

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Status updated and logged successfully.",
    };
  } catch (error) {
    console.error("Update status error:", error);
    return {
      success: false,
      message: "Failed to update status. Please try again.",
    };
  }
}

export async function updateDocumentContent(documentId: string, content: string) {
  const userId = await getCurrentUser();
  if (!userId) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    // Verify document ownership by joining applications table
    const [doc] = await db
      .select({
        id: tailoredDocuments.id,
        applicationId: tailoredDocuments.applicationId,
        userId: applications.userId,
        type: tailoredDocuments.type,
        version: tailoredDocuments.version,
      })
      .from(tailoredDocuments)
      .innerJoin(applications, eq(applications.id, tailoredDocuments.applicationId))
      .where(and(eq(tailoredDocuments.id, documentId), eq(applications.userId, userId)))
      .limit(1);

    if (!doc) {
      return { success: false, message: "Forbidden or document not found." };
    }

    await db
      .update(tailoredDocuments)
      .set({
        contentMd: content,
      })
      .where(eq(tailoredDocuments.id, documentId));

    const docLabel = doc.type === "cover_letter" ? "Cover Letter" : "Tailored Resume";
    await db.insert(activityLog).values({
      applicationId: doc.applicationId,
      eventType: "document_edit",
      note: `Tailored ${docLabel} (v${doc.version}) edited and saved by user.`,
    });

    revalidatePath(`/applications/${doc.applicationId}`);

    return { success: true, message: "Document changes saved successfully." };
  } catch (error) {
    console.error("Update document error:", error);
    return { success: false, message: "Failed to save document modifications." };
  }
}

