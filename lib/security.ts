/**
 * Security utilities to sanitize untrusted input data, preventing prompt injections.
 */

const PROMPT_INJECTION_BLACKLIST = [
  /ignore\s+previous\s+instructions/gi,
  /ignore\s+above\s+instructions/gi,
  /system\s+override/gi,
  /bypass\s+instructions/gi,
  /you\s+are\s+now\s+a/gi,
  /new\s+instructions/gi,
  /assistant\s+bypass/gi,
  /rules\s+override/gi,
  /dan\s+mode/gi,
  /developer\s+mode/gi,
];

/**
 * Escapes XML/HTML tags and redacts common instruction override phrases.
 */
export function sanitizePromptInput(input: string | null | undefined): string {
  if (!input) return "";

  // 1. Convert < and > into safe character entities so users cannot escape structurally delimiting boundary tags
  let sanitized = input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Scan and redact common override terms
  for (const pattern of PROMPT_INJECTION_BLACKLIST) {
    sanitized = sanitized.replace(pattern, "[REDACTED INSTRUCTION OVERRIDE ATTEMPT]");
  }

  return sanitized.trim();
}
