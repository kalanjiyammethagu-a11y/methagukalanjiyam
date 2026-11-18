/**
 * Server-safe lightweight HTML sanitization utility.
 * Strips script tags, iframes, inline event handlers (onclick, onerror, onload, etc.),
 * and dangerous protocols (javascript:, data:text/html).
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,
  /href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi,
  /src\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi,
  /href\s*=\s*(?:'data:text\/html[^']*'|"data:text\/html[^"]*"|data:text\/html[^\s>]+)/gi,
];

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }

  let clean = dirtyHtml;
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }

  return clean;
}

/**
 * Escapes characters for safe JSON serialization inside <script> tags.
 * Prevents </script> breakout attacks in JSON-LD structured data.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

