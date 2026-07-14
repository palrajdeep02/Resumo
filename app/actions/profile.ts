"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  baseResumeText: z.string().min(10, "Base resume text must be at least 10 characters long."),
  skills: z.string().transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ),
  experienceYears: z.coerce.number().int().min(0, "Experience years must be 0 or greater."),
  targetRoles: z.string().transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ),
});

export async function saveProfile(prevState: any, formData: FormData) {
  const userId = await getCurrentUser();
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized. Please log in.",
    };
  }

  const rawData = {
    baseResumeText: formData.get("baseResumeText") as string,
    skills: formData.get("skills") as string,
    experienceYears: formData.get("experienceYears") as string,
    targetRoles: formData.get("targetRoles") as string,
  };

  const result = profileSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { baseResumeText, skills, experienceYears, targetRoles } = result.data;

  try {
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(profiles)
        .set({
          baseResumeText,
          skills,
          experienceYears,
          targetRoles,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        baseResumeText,
        skills,
        experienceYears,
        targetRoles,
      });
    }

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (error) {
    console.error("Save profile error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while saving your profile.",
    };
  }
}
