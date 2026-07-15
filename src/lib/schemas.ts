import { z } from "zod"

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CANDIDATE", "RECRUITER"]),
  companyAction: z.enum(["create", "join"]).optional(),
  companyName: z.string().min(1, "Company name is required").optional(),
  companyWebsite: z.string().url("Invalid website URL").or(z.literal("")).optional(),
  companyDescription: z.string().optional(),
  companyInviteCode: z.string().min(1, "Invite code/Company ID is required").optional(),
})

// Candidate schemas
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  experienceYears: z.number().min(0, "Experience years must be non-negative").optional(),
  parsedSkills: z.array(z.string()),
  education: z.array(
    z.object({
      degree: z.string().min(1, "Degree is required"),
      institution: z.string().min(1, "Institution is required"),
      year: z.number().min(1900).max(new Date().getFullYear() + 5),
    })
  ),
  resumeUrl: z.string().refine(val => !val || val.startsWith("/") || val.startsWith("http"), "Invalid resume path format").optional(),
})

// Recruiter schemas
export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Invalid website URL").or(z.literal("")).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  description: z.string().optional(),
})

export const jobSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters"),
  description: z.string().min(10, "Job description must be at least 10 characters"),
  skillsRequired: z.array(z.string()).min(1, "At least one skill is required"),
  location: z.string().min(2, "Location is required"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  salaryMin: z.number().min(0, "Salary min must be positive").optional(),
  salaryMax: z.number().min(0, "Salary max must be positive").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
})
