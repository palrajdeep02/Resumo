# Resumo — Step-Wise Build Prompts for Antigravity

Feed these prompts to Antigravity **in order**, one phase at a time. Let it finish and verify each phase before moving to the next — don't dump all prompts at once, agentic coding tools drift when given too much scope in one shot.

---

## Phase 0 — Project Bootstrap

```
Create a new Next.js 16 project called "resumo" using TypeScript, App Router, 
Tailwind CSS, and ESLint. Set up the following folder structure:
- src/app (routes)
- src/components (shared UI)
- src/lib (utilities, db client, auth config)
- src/server (server actions, business logic)
- src/types (shared TypeScript types)
- src/ai (AI integration logic)

Install and configure: Prisma (or Drizzle ORM), shadcn/ui, Zod, NextAuth (Auth.js v5).
Initialize a git repository with a proper .gitignore for Next.js + env files.
Set up a README.md with project title "Resumo", a one-line description as an 
AI-powered job matching platform, and placeholder sections for setup instructions, 
tech stack, and architecture.
```

---

## Phase 1 — Database Schema

```
Set up PostgreSQL with Prisma. Enable the pgvector extension for embedding storage.
Create the following schema:

- User: id, email (unique), passwordHash, role (enum: CANDIDATE, RECRUITER, ADMIN), 
  name, createdAt, updatedAt
- CandidateProfile: id, userId (1:1), resumeUrl, parsedSkills (string array), 
  experienceYears, education (Json), bio, embedding (vector, unsupported type 
  handled via raw SQL), updatedAt
- Company: id, name, website, logoUrl, description, createdAt
- RecruiterProfile: id, userId (1:1), companyId
- Job: id, companyId, title, description, skillsRequired (string array), location, 
  employmentType (enum), salaryMin, salaryMax, status (enum: DRAFT, PUBLISHED, CLOSED), 
  embedding (vector), createdAt, updatedAt
- Application: id, jobId, candidateId, status (enum: APPLIED, REVIEWED, SHORTLISTED, 
  REJECTED, HIRED), matchScore (float), aiFitSummary (text), appliedAt, updatedAt
- Notification: id, userId, type, message, read (boolean), createdAt

Add proper indexes on foreign keys, User.email, Job.status, Application.status.
Write a seed script that creates 2 companies, 3 recruiters, 10 candidates with 
realistic fake data, and 8 jobs with varied skill requirements, using faker.js.
```

---

## Phase 2 — Authentication & Authorization

```
Implement authentication using Auth.js (NextAuth v5) with credentials provider 
(email + password, bcrypt hashed). On signup, let the user choose a role: 
Candidate or Recruiter. If Recruiter, require they either create a new Company 
or join an existing one via invite code.

Implement:
- Signup page with role selection
- Login page
- Session handling via JWT strategy
- Middleware that protects routes: /dashboard/candidate/* only for CANDIDATE role, 
  /dashboard/recruiter/* only for RECRUITER role, redirect unauthenticated users to /login
- A useCurrentUser hook for client components
- Server-side helper getServerSession() wrapper for server components/actions

Ensure passwords are never returned in any API response or server action result.
Add rate limiting on login/signup endpoints (basic in-memory or Upstash-based) 
to prevent brute force.
```

---

## Phase 3 — Candidate Profile & Resume Upload

```
Build the candidate profile section:

1. Profile creation/edit form (React Hook Form + Zod validation): name, bio, 
   experience years, education entries (dynamic array), skills (tag input).
2. Resume upload: accept PDF/DOCX, max 5MB, validate mime type and size on both 
   client and server. Store the file (use Vercel Blob or local /uploads for dev) 
   and save the URL to CandidateProfile.resumeUrl.
3. A "Parse Resume with AI" button that sends the uploaded resume to an AI parsing 
   endpoint (build this in Phase 5) and pre-fills the profile form with extracted 
   data, letting the user review/edit before saving.
4. Candidate dashboard showing: profile completeness %, recent job matches, 
   application status summary (applied/shortlisted/rejected counts).

Use shadcn/ui components (Card, Input, Tag/Badge, Progress, Form) for a clean, 
responsive layout. Ensure all forms have accessible labels and error states.
```

---

## Phase 4 — Recruiter: Company & Job Management

```
Build the recruiter side:

1. Company profile page (create/edit): name, website, logo upload, description.
2. Job posting CRUD:
   - Create job form: title, description (rich text or markdown), skills required 
     (tag input), location, employment type, salary range, status (draft/published)
   - Job listing page (recruiter's own jobs) with status badges and edit/close actions
   - Job edit and soft-delete (close, don't hard-delete if applications exist)
3. Recruiter dashboard: total active jobs, total applicants across jobs, 
   applicants-per-job breakdown chart (use recharts).

Enforce authorization: a recruiter can only edit/view jobs and applicants 
belonging to their own company. Write a reusable `assertCompanyOwnership()` 
guard used in every recruiter server action.
```

---

## Phase 5 — AI Resume Parsing

```
Build an AI resume parsing pipeline using AI SDK (Vercel AI SDK) with OpenAI/Gemini:

1. Extract text from uploaded PDF/DOCX (use pdf-parse or mammoth for docx).
2. Send extracted text to the LLM with a structured prompt requesting JSON output: 
   { skills: string[], experienceYears: number, education: [{degree, institution, year}], 
   summary: string }.
3. Use AI SDK's `generateObject` with a Zod schema so the response is guaranteed 
   to match the expected shape (no manual JSON parsing).
4. Handle failures gracefully: if parsing fails or the resume text is empty/garbled, 
   return a clear error to the user asking them to fill the profile manually.
5. Add a loading state on the frontend while parsing runs (this can take a few seconds).

Wrap this in a server action `parseResumeAction(resumeUrl: string)` callable from 
the candidate profile page.
```

---

## Phase 6 — Embeddings & AI Job Matching (Core Differentiator)

```
Implement the semantic matching engine:

1. On candidate profile save and on job publish, generate an embedding vector 
   (OpenAI text-embedding-3-small or equivalent) from a concatenated text 
   representation (skills + experience + bio for candidates; title + description 
   + skills for jobs). Store in the `embedding` vector column via raw Prisma SQL.

2. Build a matching function `getMatchesForCandidate(candidateId)` that runs a 
   pgvector cosine similarity query against all PUBLISHED jobs, returns top N 
   ranked by similarity score (0-100 normalized).

3. Build the inverse `getRankedApplicantsForJob(jobId)` for recruiters.

4. For each match, generate an AI "fit explanation" (short, 2-3 sentences) using 
   the LLM: given candidate skills/experience and job requirements, explain in 
   plain language why this is or isn't a strong match, mentioning specific 
   overlapping skills and any gaps.

5. Display match results on:
   - Candidate dashboard: "Recommended Jobs" section with match % and fit explanation
   - Recruiter's job detail page: "Applicants" tab sorted by match score, with 
     AI fit summary shown per applicant card

Cache/store computed matchScore and aiFitSummary on the Application record when 
a candidate actually applies, so it doesn't get recomputed on every page view. 
Add a manual "Recompute" button for recruiters.
```

---

## Phase 7 — Application Flow

```
Build the apply flow:

1. Job detail page (public-facing, visible to all logged-in candidates) with 
   an "Apply" button.
2. On click, run an AI "application quality check": compare candidate profile 
   completeness/relevance against the job, and if weak (e.g. missing key skills, 
   thin profile), show a non-blocking warning modal: "Your profile may not fully 
   match this role. Consider adding: [specific skills]. Apply anyway?"
3. On confirm, create an Application record with computed matchScore and 
   aiFitSummary, status = APPLIED.
4. Candidate "My Applications" page: list with status badges, filter by status.
5. Recruiter "Applicants" page per job: table/card view sorted by match score, 
   with actions to change status (Reviewed → Shortlisted → Hired/Rejected).
6. On status change, create a Notification record for the candidate.
7. Notification bell in the navbar (candidate + recruiter) showing unread count, 
   dropdown with recent notifications, mark-as-read on click.

Prevent duplicate applications (unique constraint on jobId+candidateId).
```

---

## Phase 8 — Recruiter AI Assistant (JD Writer)

```
Add an AI-assisted job description writer on the job creation form:

1. Recruiter enters a rough title + bullet points of requirements.
2. "Improve with AI" button sends this to the LLM, requesting a well-structured, 
   bias-reduced job description (avoid gendered language, avoid unnecessary 
   degree requirements, clear responsibilities/requirements sections).
3. Show the AI-generated draft in an editable textarea so the recruiter can 
   review before saving — never auto-save AI output without human review.
4. Add a small "bias check" note: highlight if the original input contained 
   flagged terms (e.g. "young", "native speaker") and explain why they were removed.
```

---

## Phase 9 — Search, Filters & Public Job Board

```
Build a public job listing page (like Naukri's search page):

1. /jobs route: paginated list of PUBLISHED jobs, server-side rendered for SEO.
2. Filters: keyword search (title/skills), location, employment type, salary range.
3. Sort options: newest, best match (if logged in as candidate, use embedding 
   similarity to sort).
4. Job card: title, company logo/name, location, salary range, top matching 
   skills highlighted (if candidate is logged in).
5. Use URL search params for filter state so results are shareable/bookmarkable.

Ensure this page works well for unauthenticated visitors (prompt to sign up 
to apply) and is fully responsive.
```

---

## Phase 10 — Security Hardening

```
Review and harden the application:

1. Add Zod validation to every server action and API route input.
2. Sanitize all user-generated text (bio, job description) before rendering 
   to prevent XSS — use a sanitizer like DOMPurify if rendering as HTML/markdown.
3. Add CSRF protection notes/config (Auth.js handles most of this — verify).
4. Rate limit AI endpoints specifically (parsing, matching, JD writer) since 
   they cost money per call — use a token bucket per user, e.g. 20 AI calls/hour.
5. Ensure file upload validates actual file content type, not just extension.
6. Add security headers (CSP, X-Frame-Options, etc.) via next.config.js.
7. Write a SECURITY.md documenting: threat model, mitigations implemented 
   (auth, rate limiting, input validation, RBAC), and known limitations/future work.
```

---

## Phase 11 — Testing

```
Set up testing:

1. Unit tests (Vitest): Zod schemas, matching score calculation, utility functions.
2. Integration tests: auth flow, job CRUD server actions, application creation 
   (mock the AI calls — don't hit real API in tests).
3. E2E tests (Playwright): 
   - Candidate signup → build profile → upload resume → view matches → apply to a job
   - Recruiter signup → create company → post job → view ranked applicants → 
     change application status
4. Add a `npm run test` and `npm run test:e2e` script, and a coverage report target.
```

---

## Phase 12 — Accessibility & UI Polish

```
Do an accessibility pass across the app:

1. Ensure every interactive element is keyboard-navigable and has visible focus states.
2. All form inputs have associated labels and aria-describedby for error messages.
3. Color contrast meets WCAG AA (check Tailwind color choices).
4. Add skip-to-content link, proper heading hierarchy, alt text on all images/logos.
5. Test with a screen reader mentally / use axe-core devtools and fix flagged issues.

Also do a final visual polish pass: consistent spacing scale, loading skeletons 
for async data (job lists, applicant lists, match results), empty states 
(no jobs posted yet, no applications yet) with helpful CTAs, and toast 
notifications (via shadcn/sonner) for all mutation actions (save, apply, status change).
```

---

## Phase 13 — Deployment & CI/CD

```
Prepare for deployment:

1. Set up a Neon or Supabase PostgreSQL instance with pgvector enabled, get 
   connection string.
2. Add all required env vars to .env.example: DATABASE_URL, NEXTAUTH_SECRET, 
   OPENAI_API_KEY (or Gemini/Groq key), BLOB_STORAGE_TOKEN.
3. Create a GitHub Actions workflow (.github/workflows/ci.yml) that on every PR: 
   installs deps, runs lint, runs typecheck (tsc --noEmit), runs unit tests.
4. Configure automatic deployment to Vercel on merge to main, with Prisma 
   migrations run as part of the build step (prisma migrate deploy).
5. Add a footer component (visible on every page) containing: developer name, 
   GitHub profile link, LinkedIn profile link — required by the assignment.
6. Update README.md with: project overview, tech stack, architecture diagram 
   (text-based is fine), setup instructions (local dev), env vars needed, 
   how the AI matching works (brief), and the live deployment link once deployed.
```

---

## How to use this

1. Run phases in order — don't skip ahead even if it feels slow.
2. After each phase, ask Antigravity to run the dev server and manually click 
   through the new feature before starting the next phase.
3. Keep Phase 5 & 6 (AI parsing + matching) as your demo centerpiece — this is 
   what makes Resumo more than "another job board," so budget the most review 
   time there.
4. Commit after each phase completes so you have clean rollback points.
