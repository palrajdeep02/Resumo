import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}))
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}))
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
  cookies: vi.fn(),
}))

import { registerAction } from "@/server/auth-actions"
import { createJob } from "@/server/recruiter-actions"
import { applyToJobAction } from "@/server/application-actions"
import { db } from "@/lib/db"

// Mock Prisma
vi.mock("@/lib/db", () => {
  const mockDb = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    recruiterProfile: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    candidateProfile: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    job: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    application: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockDb)),
  }
  return { db: mockDb }
})

// Mock next-auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// Mock Vercel AI SDK and embeddings
vi.mock("@/ai/embeddings", () => ({
  generateAndStoreEmbedding: vi.fn(),
}))

vi.mock("@/server/matching-actions", () => ({
  computeMatchForApplication: vi.fn(),
}))

describe("Auth Server Actions Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fail user registration if email already exists in system", async () => {
    // Stub db.user.findUnique to return existing user
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "123", email: "bob@example.com" } as any)

    const res = await registerAction({
      name: "Bob Builder",
      email: "bob@example.com",
      password: "somepassword",
      role: "CANDIDATE",
    })

    expect(res.error).toBe("Email is already registered")
  })
})

describe("Recruiter Server Actions Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fail job creation if recruiter asserts unauthorized credentials", async () => {
    // Stub auth to return null/candidate role
    const authModule = await import("@/lib/auth")
    vi.mocked(authModule.auth).mockResolvedValue(null)

    const res = await createJob({
      title: "Backend Engineer",
      description: "Needs 5 years Node.js skills.",
      skillsRequired: ["Node.js"],
      location: "Remote",
      employmentType: "FULL_TIME",
      status: "PUBLISHED",
    })

    expect(res.error).toContain("Unauthorized")
  })
})

describe("Application Server Actions Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should block application submissions if candidate profile is not complete", async () => {
    const authModule = await import("@/lib/auth")
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "candidate-user", role: "CANDIDATE" },
    } as any)

    // Stub profile search to find nothing
    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue(null)

    const res = await applyToJobAction("12345678-1234-1234-8234-123456789abc")
    expect(res.error).toContain("Candidate profile not found")
  })
})
