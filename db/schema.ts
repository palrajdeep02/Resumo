import { pgTable, uuid, text, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";

// Enums
export const applicationStatusEnum = pgEnum("application_status", [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "resume",
  "cover_letter",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  baseResumeText: text("base_resume_text"),
  skills: text("skills").array(),
  experienceYears: integer("experience_years"),
  targetRoles: text("target_roles").array(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Applications table
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  company: text("company").notNull(),
  jobTitle: text("job_title").notNull(),
  jobDescriptionText: text("job_description_text"),
  status: applicationStatusEnum("status").default("saved").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tailored Documents table
export const tailoredDocuments = pgTable("tailored_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  type: documentTypeEnum("type").notNull(),
  contentMd: text("content_md").notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Match Scores table
export const matchScores = pgTable("match_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  overallScore: integer("overall_score").notNull(),
  skillGaps: jsonb("skill_gaps"),
  strengths: jsonb("strengths"),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Activity Log table
export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  eventType: text("event_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
