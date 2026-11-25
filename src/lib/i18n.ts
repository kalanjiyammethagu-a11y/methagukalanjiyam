export type AppLocale = "ta" | "en";

/**
 * Single configurable publishing rule for Dual-Language CRUD.
 * - false (default): English is required; Tamil is optional and flagged "Missing Tamil" in admin lists.
 * - true: Both English and Tamil required text fields are enforced before publishing.
 */
export const REQUIRE_BOTH_LANGUAGES_TO_PUBLISH = false;

export const ASCII_SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Returns true if the input contains any Unicode Tamil block character (U+0B80..U+0BFF).
 */
export function isTamilText(value?: string | null): boolean {
  if (!value) return false;
  return /[\u0B80-\u0BFF]/.test(value);
}

export function isAsciiSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return ASCII_SLUG_REGEX.test(slug.trim());
}

/**
 * Generates an ASCII-only URL slug from English text (never containing Tamil script).
 */
export function generateAsciiSlug(englishText?: string | null, fallbackPrefix = "item"): string {
  const cleaned = (englishText || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

function readNonEmptyString(
  row: Record<string, any>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const val = row[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return null;
}

/**
 * Resolves a localized field from a CMS row or view model in `lang`,
 * automatically falling back to the alternate language or legacy base column when empty.
 *
 * Supports both DB snake_case (`title_en` / `title_ta`) and JS camelCase (`titleEn` / `titleTa`).
 */
export function localized<T extends object>(
  row: T | null | undefined,
  field: string,
  lang: AppLocale,
  defaultValue = ""
): string {
  if (!row || typeof row !== "object") return defaultValue;
  const record = row as Record<string, any>;

  const enKeys = [`${field}_en`, `${field}En`];
  const taKeys = [`${field}_ta`, `${field}Ta`];

  const primaryKeys = lang === "ta" ? taKeys : enKeys;
  const secondaryKeys = lang === "ta" ? enKeys : taKeys;

  const primary = readNonEmptyString(record, primaryKeys);
  if (primary) return primary;

  // Check bare legacy field when its script matches the requested language
  const bare = readNonEmptyString(record, [field]);
  if (bare) {
    const bareIsTamil = isTamilText(bare);
    if ((lang === "ta" && bareIsTamil) || (lang === "en" && !bareIsTamil)) {
      return bare;
    }
  }

  const secondary = readNonEmptyString(record, secondaryKeys);
  if (secondary) return secondary;

  // Fallback to legacy base column regardless of script when alternate is also absent
  if (bare) return bare;

  return defaultValue;
}

export interface LanguageCompleteness {
  enComplete: boolean;
  taComplete: boolean;
  missingEnglish: boolean;
  missingTamil: boolean;
  missingEnFields: string[];
  missingTaFields: string[];
}

/**
 * Evaluates per-language field completeness on an admin CMS item.
 */
export function getLanguageCompleteness<T extends object>(
  row: T | null | undefined,
  requiredFields: string[]
): LanguageCompleteness {
  if (!row || typeof row !== "object") {
    return {
      enComplete: false,
      taComplete: false,
      missingEnglish: true,
      missingTamil: true,
      missingEnFields: [...requiredFields],
      missingTaFields: [...requiredFields],
    };
  }
  const record = row as Record<string, any>;

  const missingEnFields: string[] = [];
  const missingTaFields: string[] = [];

  for (const field of requiredFields) {
    const enVal = readNonEmptyString(record, [`${field}_en`, `${field}En`]);
    const taVal = readNonEmptyString(record, [`${field}_ta`, `${field}Ta`]);
    if (!enVal) missingEnFields.push(field);
    if (!taVal) missingTaFields.push(field);
  }

  const enComplete = missingEnFields.length === 0;
  const taComplete = missingTaFields.length === 0;

  return {
    enComplete,
    taComplete,
    missingEnglish: !enComplete,
    missingTamil: !taComplete,
    missingEnFields,
    missingTaFields,
  };
}

/**
 * Normalizes bilingual field extraction when legacy columns (`title`, `author`, `name`, etc.)
 * are mixed with `_en` / `_ta` values during backfill or API writes.
 */
export function resolveBilingualPair(options: {
  en?: string | null;
  ta?: string | null;
  legacy?: string | null;
}): { en: string; ta: string } {
  const cleanEn = options.en?.trim() || "";
  const cleanTa = options.ta?.trim() || "";
  const cleanLegacy = options.legacy?.trim() || "";

  let en = cleanEn;
  let ta = cleanTa;

  if (cleanLegacy) {
    if (!ta && isTamilText(cleanLegacy)) {
      ta = cleanLegacy;
    } else if (!en && !isTamilText(cleanLegacy)) {
      en = cleanLegacy;
    }
  }

  return { en, ta };
}

/**
 * Concatenates English and Tamil values for case-insensitive bilingual admin search.
 */
export function buildBilingualSearchText<T extends object>(
  row: T,
  fields: string[]
): string {
  const record = row as Record<string, any>;
  const parts: string[] = [];
  for (const field of fields) {
    for (const key of [field, `${field}_en`, `${field}En`, `${field}_ta`, `${field}Ta`, "slug"]) {
      const v = record[key];
      if (typeof v === "string" && v.trim()) {
        parts.push(v.trim());
      }
    }
  }
  return parts.join(" ").toLowerCase();
}
