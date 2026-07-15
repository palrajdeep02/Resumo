# Security Architecture & Mitigations

This document outlines the threat model, mitigation strategies, and security design patterns implemented in **Resumo**.

## 1. Threat Model & Mitigations

### Stored XSS (Cross-Site Scripting)
* **Threat**: Malicious candidates or recruiters inject script tags into inputs (like bios, job descriptions, or names) that execute when rendered to other users.
* **Mitigation**: All text input fields are sanitized server-side in server actions before database insertion using `DOMPurify` (configured via `isomorphic-dompurify` to strip all HTML tags entirely for plain-text representations). React's default text rendering further ensures that escaping happens at view-time.

### Path Traversal & Unrestricted File Uploads
* **Threat**: Attacking candidates upload malicious script files (e.g. `.js`, `.exe`, or `.html` payloads) renamed with `.pdf` or `.docx` extensions to compromise the server or browser.
* **Mitigation**: 
  - File uploads strictly validate raw byte magic numbers on the server side: PDF files must start with `%PDF` (`25 50 44 46` in hex) and DOCX files must start with the standard ZIP archive header `PK\x03\x04` (`50 4B 03 04` in hex).
  - Filenames are randomized and saved to a static public directory with strict extension assignments.

### Resource Abuse & API Exploitation
* **Threat**: Automated scripts flood AI endpoints (resume parsing, applicant matching, quality checks, and AI description writing), incurring significant LLM API token costs.
* **Mitigation**: An in-memory token rate limiter restricts AI requests per authenticated user/IP to a maximum of 20 calls per hour. Excess requests fail gracefully returning HTTP 429 warnings.

### Authentication & RBAC (Role-Based Access Control)
* **Threat**: Candidate accounts attempting to modify jobs, update company details, or fetch other candidates' resumes.
* **Mitigation**: 
  - Authentication is managed via Auth.js (NextAuth v5) utilizing cryptographically secure JWT tokens carrying user id and role.
  - Server actions assert role controls (`CANDIDATE` or `RECRUITER`) on every execution.
  - Recruiter actions verify the company ownership constraint, ensuring a user can only query/edit entities associated with their company profile ID.
  - Next.js Edge proxy (`proxy.ts`) blocks unauthorized sub-page routes at the network boundary.

## 2. CSRF (Cross-Site Request Forgery)
NextAuth v5 (Auth.js) implements double-submit CSRF cookie checks by default for all credential operations and mutation actions.
