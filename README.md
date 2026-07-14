# Resumo — AI-powered Job Application Tailoring & Match-Scoring Assistant

Resumo is a secure, high-performance job application assistant. It assesses job descriptions against candidate profiles, scores resume compatibility, identifies skill gaps, and streams tailored resume bullet points and cover letters in real-time.

---

## 📖 Architecture & Design Decisions

### 1. Visual Identity & Editorial Design System
Resumo features a bespoke **Editorial Design System** that mimics document sheets and traditional print media:
*   **Color Palette**: Parchment (`#FAF9F6`) canvas, deep ink typography (`#0D121F`), and Crimson (`#D23B38`) highlights.
*   **Typography**: Serif headings (using Google Fonts `Lora` or browser fallbacks) paired with clean sans-serif body fonts (`Inter`) and monospace annotations (`JetBrains Mono`).
*   **Flat Aesthetics**: `0px` border-radii on grids, inputs, cards, and buttons to give structured layouts a crisp, modern editorial block appearance.

### 2. Next.js 16 Edge proxy
Resumo is built on **Next.js 16 (App Router, React 19, TypeScript)**. It integrates Auth.js v5 using a root-level **`proxy.ts`** proxy pattern rather than `middleware.ts` to support clean Edge-compatible routing and guards on `/dashboard`, `/profile`, and `/applications/*` paths.

### 3. ORM & Database Schema
Resumo utilizes **Drizzle ORM** with the `postgres` driver to manage relational tables in PostgreSQL:
*   Users are stored with hashed credentials, feeding into target profiles, job applications, match evaluations, document versions, and audit history logs with cascade delete properties.
*   Security ownership validation is performed using inner joins (e.g. checking that a document's parent application belongs to the current user) rather than trusting client-supplied identifiers.

### 4. Vercel AI SDK & Streaming
*   Match scoring is calculated using Vercel AI SDK `generateObject` which extracts typed metrics (Compatibility score, strengths, missing skill lists, recommendations) using a strict Zod parser.
*   Tailoring resume experience bullets and cover letters utilizes Vercel AI SDK text streams (`streamText` and `toTextStreamResponse()`) to provide low-latency typewriter effects in the document workspace.

---

## 🛡️ Security Policies
We take security seriously. Resumo implements prompt injection filters, rate limiters, security headers, and secret isolation. Read the detailed specs here:
👉 [SECURITY.md](SECURITY.md)

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js 20+
*   PostgreSQL database instance

### 1. Environment Setup
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```
Ensure you provide a valid `DATABASE_URL`, `NEXTAUTH_SECRET`, and Google Gemini key under `AI_API_KEY`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migrations
Generate and execute schema migrations using Drizzle Kit:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🧪 Testing Suites

Resumo features a dual-layer testing suite:
*   **Unit Tests (Vitest)**: Tests authorization guards, token mapping, and match-scoring logic with fully mocked databases.
    ```bash
    npm run test
    ```
*   **E2E Browser Tests (Playwright)**: Automates the entire register-to-score pipeline inside actual browser targets, intercepting and mocking AI routes to save tokens.
    ```bash
    npm run test:e2e
    ```
