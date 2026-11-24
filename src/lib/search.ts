/**
 * Search & Transliteration Normalization Utilities
 *
 * Provides tolerant matching for Tamil titles, English titles, authors,
 * and common Tanglish / phonetic variations (e.g. prabakaran <-> prabhakaran,
 * thileepan <-> tileepan <-> deelipan, methagu <-> metagu).
 */

/**
 * Normalizes text for resilient phonetic / Tanglish substring matching.
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/bh/g, "b")
    .replace(/gh/g, "g")
    .replace(/ph/g, "f")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/sh/g, "s")
    .replace(/zh/g, "l")
    .replace(/ch/g, "s")
    .replace(/[\-_—.,'"`()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a search query matches any of the given candidate fields,
 * supporting exact substring match, normalized phonetic match, and multi-word token matching.
 */
export function matchesSearchQuery(
  rawQuery: string,
  targetFields: (string | undefined | null)[]
): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const qRaw = rawQuery.toLowerCase().trim();
  const qNorm = normalizeSearchTerm(rawQuery);

  // 1. Check full query against all fields
  for (const field of targetFields) {
    if (!field) continue;
    const fRaw = field.toLowerCase();
    if (fRaw.includes(qRaw)) return true;

    const fNorm = normalizeSearchTerm(field);
    if (fNorm.includes(qNorm)) return true;
  }

  // 2. Multi-word query: check if all query tokens find a match
  const words = qRaw.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const allWordsMatch = words.every((w) => {
      const wNorm = normalizeSearchTerm(w);
      return targetFields.some((field) => {
        if (!field) return false;
        return (
          field.toLowerCase().includes(w) ||
          normalizeSearchTerm(field).includes(wNorm)
        );
      });
    });
    if (allWordsMatch) return true;
  }

  return false;
}
