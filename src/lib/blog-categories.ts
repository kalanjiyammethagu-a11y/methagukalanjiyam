import {
  ARTICLE_CATEGORY_OPTIONS,
  type ArticleCategoryOption,
} from "@/lib/blog-utils";
import { generateAsciiSlug } from "@/lib/i18n";

export interface ManagedBlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  sort_order: number;
  is_active: boolean;
}

export const BLOG_CATEGORIES_SETTINGS_KEY = "blog_categories";

export const DEFAULT_MANAGED_BLOG_CATEGORIES: ManagedBlogCategory[] =
  ARTICLE_CATEGORY_OPTIONS.map((opt, idx) => ({
    id: `blog-cat-${opt.slug}`,
    slug: opt.slug,
    name_en: opt.labelEn,
    name_ta: opt.labelTa,
    sort_order: idx + 1,
    is_active: true,
  }));

export function normalizeManagedBlogCategories(raw: unknown): ManagedBlogCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_MANAGED_BLOG_CATEGORIES.map((c) => ({ ...c }));
  }

  const seenSlugs = new Set<string>();
  const normalized: ManagedBlogCategory[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const nameEn = String((item as any).name_en || (item as any).labelEn || "").trim();
    const nameTa = String((item as any).name_ta || (item as any).labelTa || nameEn).trim();
    if (!nameEn && !nameTa) continue;
    const slug = String(
      (item as any).slug || generateAsciiSlug(nameEn || nameTa, `cat-${i + 1}`)
    )
      .trim()
      .toLowerCase();
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    normalized.push({
      id: String((item as any).id || `blog-cat-${slug}`),
      slug,
      name_en: nameEn || nameTa,
      name_ta: nameTa || nameEn,
      sort_order: Number.isFinite(Number((item as any).sort_order))
        ? Number((item as any).sort_order)
        : i + 1,
      is_active: (item as any).is_active !== false,
    });
  }

  if (normalized.length === 0) {
    return DEFAULT_MANAGED_BLOG_CATEGORIES.map((c) => ({ ...c }));
  }

  return normalized.sort((a, b) => a.sort_order - b.sort_order);
}

export function toArticleCategoryOptions(
  managed: ManagedBlogCategory[]
): ArticleCategoryOption[] {
  const defaultAliasMap = new Map(
    ARTICLE_CATEGORY_OPTIONS.map((opt) => [opt.slug, opt.aliases])
  );

  return managed
    .filter((cat) => cat.is_active)
    .map((cat) => {
      const baseAliases = defaultAliasMap.get(cat.slug) || [];
      const combined = new Set<string>([
        cat.slug.toLowerCase(),
        cat.name_en.toLowerCase(),
        cat.name_ta.toLowerCase(),
        ...baseAliases.map((a) => a.toLowerCase()),
      ]);
      return {
        slug: cat.slug,
        labelEn: cat.name_en,
        labelTa: cat.name_ta,
        aliases: Array.from(combined),
      };
    });
}

export async function fetchBlogCategories(supabase: any): Promise<ManagedBlogCategory[]> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", BLOG_CATEGORIES_SETTINGS_KEY)
      .maybeSingle();

    if (!error && Array.isArray(data?.value) && data.value.length > 0) {
      return normalizeManagedBlogCategories(data.value);
    }
  } catch {
    // Keep defaults if site_settings unavailable
  }
  return DEFAULT_MANAGED_BLOG_CATEGORIES.map((c) => ({ ...c }));
}
