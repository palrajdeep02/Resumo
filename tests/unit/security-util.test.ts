import { vi, describe, it, expect } from "vitest"

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
  headers: vi.fn(),
  cookies: vi.fn(),
}))

import { sanitizeText } from "@/lib/sanitize"
import { rateLimit } from "@/lib/rate-limit"
import { registerSchema, jobSchema } from "@/lib/schemas"

describe("Security Sanitizer Tests", () => {
  it("should strip out all HTML tags from plain text inputs", () => {
    const dirty = "<h1>Hello</h1> <p>World!</p> <strong>Bold</strong>"
    const clean = sanitizeText(dirty)
    expect(clean).toBe("Hello World! Bold")
  })

  it("should completely remove active script blocks and XSS targets", () => {
    const dirty = "<script>alert('hack');</script><img src=x onerror=alert(1)>Safe text"
    const clean = sanitizeText(dirty)
    expect(clean).toBe("Safe text")
  })

  it("should return empty string when null/undefined inputs are provided", () => {
    expect(sanitizeText("")).toBe("")
  })
})

describe("Zod Validation Schemas Tests", () => {
  it("should validate a correct candidate registration structure", () => {
    const valid = {
      name: "Alice Smith",
      email: "alice@example.com",
      password: "securepassword",
      role: "CANDIDATE",
    }
    const parse = registerSchema.safeParse(valid)
    expect(parse.success).toBe(true)
  })

  it("should fail registration validation for invalid emails or short passwords", () => {
    const invalid = {
      name: "Bob",
      email: "not-an-email",
      password: "123",
      role: "RECRUITER",
    }
    const parse = registerSchema.safeParse(invalid)
    expect(parse.success).toBe(false)
  })

  it("should validate a correct job listing structure", () => {
    const valid = {
      title: "Backend developer",
      description: "Must know PostgreSQL, Node.js, and TypeScript extensively.",
      skillsRequired: ["Node.js", "PostgreSQL"],
      location: "Remote",
      employmentType: "FULL_TIME",
      salaryMin: 90000,
      salaryMax: 120000,
      status: "PUBLISHED",
    }
    const parse = jobSchema.safeParse(valid)
    expect(parse.success).toBe(true)
  })

  it("should reject job validation if description is too short or status is invalid", () => {
    const invalid = {
      title: "Developer",
      description: "Short",
      skillsRequired: [],
      location: "Remote",
      employmentType: "FULL_TIME",
      status: "INVALID_STATUS",
    }
    const parse = jobSchema.safeParse(invalid)
    expect(parse.success).toBe(false)
  })
})

describe("Rate Limiter Tests", () => {
  it("should block requests when they exceed the defined limit thresholds", () => {
    const key = "test-limit-key-" + Date.now()
    const limit = 3
    const windowMs = 5000

    // Calls 1 to 3: Should succeed
    expect(rateLimit(key, limit, windowMs).success).toBe(true)
    expect(rateLimit(key, limit, windowMs).success).toBe(true)
    expect(rateLimit(key, limit, windowMs).success).toBe(true)

    // Call 4: Should fail
    expect(rateLimit(key, limit, windowMs).success).toBe(false)
  })
})
