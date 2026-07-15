"use server"

import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { registerSchema } from "@/lib/schemas"
import { z } from "zod"

export async function registerAction(values: z.infer<typeof registerSchema>) {
  // Validate fields
  const validatedFields = registerSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const {
    name,
    email,
    password,
    role,
    companyAction,
    companyName,
    companyWebsite,
    companyDescription,
    companyInviteCode,
  } = validatedFields.data

  // Rate Limiting
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "unknown"

  // Rate limit by IP (10 signups/hour)
  const ipLimit = rateLimit(`signup_ip_${ip}`, 10, 3600000)
  if (!ipLimit.success) {
    return { error: "Too many registrations from this IP. Please try again later." }
  }

  // Rate limit by email (5 signup attempts/hour)
  const emailLimit = rateLimit(`signup_email_${email}`, 5, 3600000)
  if (!emailLimit.success) {
    return { error: "Too many registration attempts for this email. Please try again later." }
  }

  try {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Email is already registered" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Execute in transaction
    await db.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      })

      // 2. Create profile based on role
      if (role === "CANDIDATE") {
        await tx.candidateProfile.create({
          data: {
            userId: user.id,
            parsedSkills: [],
            experienceYears: 0,
            education: [],
            bio: "",
          },
        })
      } else if (role === "RECRUITER") {
        let companyId = ""

        if (companyAction === "create") {
          if (!companyName) {
            throw new Error("Company name is required to create a company")
          }
          const company = await tx.company.create({
            data: {
              name: companyName,
              website: companyWebsite || null,
              description: companyDescription || null,
            },
          })
          companyId = company.id
        } else if (companyAction === "join") {
          if (!companyInviteCode) {
            throw new Error("Invite code (Company ID) is required to join a company")
          }

          // In this implementation, the invite code is the Company ID itself
          const company = await tx.company.findUnique({
            where: { id: companyInviteCode },
          })

          if (!company) {
            throw new Error("Company not found. Invalid invite code.")
          }
          companyId = company.id
        } else {
          throw new Error("Recruiters must either create or join a company")
        }

        await tx.recruiterProfile.create({
          data: {
            userId: user.id,
            companyId,
          },
        })
      }

      return { success: true }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Registration error:", error)
    return { error: error.message || "Something went wrong during registration" }
  }
}

export async function getUserRoleByEmail(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { role: true },
    })
    return { role: user?.role || null }
  } catch {
    return { role: null }
  }
}
