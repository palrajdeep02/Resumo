# Resumo — Security and Hardening Specifications

This document outlines the defensive measures implemented in **Resumo** to harden the application, protect AI APIs against abuse, defend prompts against injection attacks, isolate server secrets, and restrict browser-side vulnerabilities.

---

## 1. Rate Limiting (`lib/rate-limit.ts`)
*   **Mechanism**: Implemented a sliding-window tracker configured in `lib/rate-limit.ts`.
*   **Policy**: Limits `/api/ai/score` and `/api/ai/tailor` endpoints to **10 requests per user per hour** to prevent API key exhaustion and control runtime compute billing.
*   **Production Scalability**: The limiter uses a structured in-memory Map record-keeper. A code comment guide details how to drop-in Upstash Redis or `@upstash/ratelimit` for serverless environments where local node memory resets between invoke operations.

---

## 2. Prompt Injection Mitigation (`lib/security.ts`)
*   **Sanitization Filters**: User-pasted job descriptions and resume texts pass through `sanitizePromptInput` before LLM context concatenation.
*   **Tag Escaping**: Translates XML brackets (`<` and `>`) into safe html entities (`&lt;` and `&gt;`). This blocks users from injecting closing tags (e.g. `</job_description_input>`) and breaking out of their defined data container.
*   **Override Redaction**: Utilizes Regex pattern scanning to identify instruction override phrases (like `ignore previous instructions`, `system override`, `dan mode`, etc.) and replaces them with a `[REDACTED INSTRUCTION OVERRIDE ATTEMPT]` string.
*   **Isolated Context**: All untrusted inputs are encapsulated within structural XML blocks to ensure the LLM treats them strictly as data, not prompt overrides.

---

## 3. Strict Input Schema Validation
*   **Zod Schema Guarding**: Every POST API endpoint enforces input parameter validations using Zod schemas (`requestSchema.safeParse`).
*   **Invalidation Policies**: Any malformed payload, missing field, or invalid formatting (e.g. non-UUID parameters) is immediately rejected with a structured `400 Bad Request` JSON error response, preventing SQL errors or garbage API calls.

---

## 4. Server Secret Containment
*   **No Client Leakage**: Sensitive environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `AI_API_KEY`) are kept strictly server-only.
*   **Convention Enforcement**: No secret carries the `NEXT_PUBLIC_` suffix, ensuring the Next.js compiler strips these keys from any browser bundle chunk should they accidentally be typed in client components.

---

## 5. Defense-in-Depth HTTP Headers (`next.config.ts`)
Configured custom HTTP response headers via Next.js configurations:
*   **Content-Security-Policy (CSP)**: `default-src 'self'` restricts script/style load limits to prevent Cross-Site Scripting (XSS). Specific styles and font domains (`fonts.googleapis.com` and `fonts.gstatic.com`) are safelisted to support custom typography.
*   **X-Frame-Options (DENY)**: Prevents clickjacking by denying page frames rendering inside `<iframe>` blocks on external websites.
*   **X-Content-Type-Options (nosniff)**: Disables MIME-type sniffing to force the browser to respect standard headers.
*   **Referrer-Policy**: Sets `origin-when-cross-origin` to avoid leaking detailed routing paths to external referrers.
*   **Permissions-Policy**: Restricts access to client hardware APIs (e.g. camera, microphone, geolocation) that are not needed by the application.
