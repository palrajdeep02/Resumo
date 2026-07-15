import DOMPurify from "isomorphic-dompurify"

/**
 * Strips all HTML tags and unsafe script attributes to prevent XSS.
 * Ideal for sanitizing plain-text inputs before database saving.
 */
export function sanitizeText(text: string): string {
  if (!text) return ""
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip all HTML tags entirely
    ALLOWED_ATTR: [], // Strip all attributes
  }).trim()
}
