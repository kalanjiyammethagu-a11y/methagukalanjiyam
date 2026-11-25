import { z } from "zod";
import { ASCII_SLUG_REGEX, REQUIRE_BOTH_LANGUAGES_TO_PUBLISH } from "@/lib/i18n";

const asciiSlugField = z
  .string()
  .trim()
  .regex(ASCII_SLUG_REGEX, "Slug must be ASCII lowercase letters, numbers, and hyphens only (no Tamil script)")
  .max(150);

export const adminCategorySchema = z
  .object({
    name_ta: z.string().trim().min(1, "Tamil category name is required").max(100),
    name_en: z.string().trim().min(1, "English category name is required").max(100),
    description_en: z.string().trim().max(300).optional().nullable(),
    description_ta: z.string().trim().max(300).optional().nullable(),
    slug: asciiSlugField.max(100).optional(),
    sort_order: z.number().int().min(0).default(0).optional(),
    is_active: z.boolean().default(true).optional(),
  })
  .strict();

export const adminCategoryUpdateSchema = adminCategorySchema.partial();

// ============================================================================
// BOOKS VALIDATOR
// ============================================================================
export const bookGalleryImageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Gallery image URL is required")
    .refine(
      (val) => val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"),
      "Gallery image URL must be relative or HTTP(S)"
    ),
  path: z.string().trim().optional().nullable(),
  kind: z.enum(["inside", "back_cover", "spread", "other"]).default("inside").optional(),
  alt_en: z.string().trim().max(250).optional().nullable(),
  alt_ta: z.string().trim().max(250).optional().nullable(),
});

export const adminBookSchema = z.object({
  title: z.string().trim().max(200).optional(),
  title_en: z.string().trim().max(200).optional().nullable(),
  title_ta: z.string().trim().max(200).optional().nullable(),
  slug: asciiSlugField.optional(),
  author: z.string().trim().max(100).optional(),
  author_en: z.string().trim().max(100).optional().nullable(),
  author_ta: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  description_en: z.string().trim().optional().nullable(),
  description_ta: z.string().trim().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  discount_price: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  category_id: z.string().uuid().optional().nullable(),
  cover_image_path: z.string().trim().optional().nullable(),
  cover_image_url: z.string().trim().optional().nullable(),
  cover_front: z.string().trim().optional().nullable(),
  cover_is_front: z.boolean().default(true).optional(),
  cover_alt_en: z.string().trim().max(250).optional().nullable(),
  cover_alt_ta: z.string().trim().max(250).optional().nullable(),
  gallery_images: z.array(bookGalleryImageSchema).max(12).optional().default([]),
  whatsapp_link: z.string().trim().optional().nullable(),
  isbn: z.string().trim().max(30).optional().nullable(),
  pages: z.coerce.number().int().min(0).optional().nullable(),
  publisher: z.string().trim().max(100).optional().nullable(),
  publisher_en: z.string().trim().max(100).optional().nullable(),
  publisher_ta: z.string().trim().max(100).optional().nullable(),
  quote_en: z.string().trim().max(400).optional().nullable(),
  quote_ta: z.string().trim().max(400).optional().nullable(),
  published_year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  weight_grams: z.coerce.number().int().min(0).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  is_featured: z.boolean().default(false).optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

export function validateBilingualBookFields(
  data: {
    title?: string | null;
    title_en?: string | null;
    title_ta?: string | null;
    author?: string | null;
    author_en?: string | null;
    author_ta?: string | null;
    status?: "draft" | "published";
  },
  ctx: z.RefinementCtx,
  requireAll: boolean,
  requireBothLanguages = REQUIRE_BOTH_LANGUAGES_TO_PUBLISH
) {
  const hasEnTitle = Boolean((data.title_en || (!requireAll ? "" : data.title) || data.title || "").trim());
  const hasEnAuthor = Boolean((data.author_en || data.author || "").trim());

  if (requireAll && !hasEnTitle) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_en"], message: "English book title is required" });
  }
  if (requireAll && !hasEnAuthor) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["author_en"], message: "English author name is required" });
  }

  const effectiveStatus = data.status ?? "published";
  if (requireBothLanguages && effectiveStatus === "published") {
    if (!(data.title_ta || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_ta"], message: "Tamil book title is required to publish" });
    }
    if (!(data.author_ta || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["author_ta"], message: "Tamil author name is required to publish" });
    }
  }
}

export const adminBookCreateSchema = adminBookSchema.superRefine((data, ctx) => {
  const coverUrl = (data.cover_image_url || data.cover_front || "").trim();
  if (!coverUrl || coverUrl === "/images/books/book-placeholder.webp") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cover_image_url"],
      message: "Front cover (outside) image is required.",
    });
  }
  validateBilingualBookFields(data, ctx, true);
});

export const adminBookUpdateSchema = adminBookSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid book ID"),
  })
  .superRefine((data, ctx) => {
    if (data.cover_image_url !== undefined || data.cover_front !== undefined) {
      const coverUrl = (data.cover_image_url || data.cover_front || "").trim();
      if (!coverUrl || coverUrl === "/images/books/book-placeholder.webp") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cover_image_url"],
          message: "Front cover (outside) image cannot be blank.",
        });
      }
    }
    validateBilingualBookFields(data, ctx, false);
  });

// ============================================================================
// BLOG POSTS VALIDATOR
// ============================================================================
export const adminBlogPostSchema = z.object({
  title: z.string().trim().max(300).optional(),
  title_en: z.string().trim().max(300).optional().nullable(),
  title_ta: z.string().trim().max(300).optional().nullable(),
  slug: asciiSlugField.optional(),
  excerpt: z.string().trim().optional().nullable(),
  excerpt_en: z.string().trim().optional().nullable(),
  excerpt_ta: z.string().trim().optional().nullable(),
  body: z.string().trim().optional(),
  body_en: z.string().trim().optional().nullable(),
  body_ta: z.string().trim().optional().nullable(),
  category_en: z.string().trim().max(100).optional().nullable(),
  category_ta: z.string().trim().max(100).optional().nullable(),
  author: z.string().trim().default("Methagu Kalanjiyam"),
  author_en: z.string().trim().max(120).optional().nullable(),
  author_ta: z.string().trim().max(120).optional().nullable(),
  cover_image_path: z.string().trim().optional().nullable(),
  cover_image_url: z.string().trim().optional().nullable(),
  cover_alt_en: z.string().trim().max(250).optional().nullable(),
  cover_alt_ta: z.string().trim().max(250).optional().nullable(),
  status: z.enum(["draft", "published"]).default("published"),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  published_at: z.string().datetime().optional().nullable(),
  seo_title: z.string().trim().max(150).optional().nullable(),
  seo_title_en: z.string().trim().max(150).optional().nullable(),
  seo_title_ta: z.string().trim().max(150).optional().nullable(),
  seo_description: z.string().trim().max(300).optional().nullable(),
  seo_description_en: z.string().trim().max(300).optional().nullable(),
  seo_description_ta: z.string().trim().max(300).optional().nullable(),
  reading_time_mins: z.coerce.number().int().min(1).default(5).optional(),
});

export function validateBilingualArticleFields(
  data: {
    title?: string | null;
    title_en?: string | null;
    title_ta?: string | null;
    body?: string | null;
    body_en?: string | null;
    body_ta?: string | null;
    status?: "draft" | "published";
  },
  ctx: z.RefinementCtx,
  requireAll: boolean,
  requireBothLanguages = REQUIRE_BOTH_LANGUAGES_TO_PUBLISH
) {
  if (requireAll && !(data.title_en || data.title || "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_en"], message: "English article title is required" });
  }
  if (requireAll && !(data.body_en || data.body || "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["body_en"], message: "English article body is required" });
  }
  const effectiveStatus = data.status ?? "published";
  if (requireBothLanguages && effectiveStatus === "published") {
    if (!(data.title_ta || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_ta"], message: "Tamil article title is required to publish" });
    }
    if (!(data.body_ta || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["body_ta"], message: "Tamil article body is required to publish" });
    }
  }
}

export const adminBlogPostCreateSchema = adminBlogPostSchema.superRefine((data, ctx) => {
  validateBilingualArticleFields(data, ctx, true);
});

export const adminBlogPostUpdateSchema = adminBlogPostSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid article ID"),
  })
  .superRefine((data, ctx) => {
    validateBilingualArticleFields(data, ctx, false);
  });

// ============================================================================
// SUPPORTERS VALIDATOR
// ============================================================================
export const adminSupporterSchema = z.object({
  name: z.string().trim().max(100).optional(),
  name_en: z.string().trim().max(100).optional().nullable(),
  name_ta: z.string().trim().max(100).optional().nullable(),
  nameTa: z.string().trim().optional(),
  nameEn: z.string().trim().optional(),
  roleTa: z.string().trim().optional(),
  roleEn: z.string().trim().optional(),
  role_ta: z.string().trim().max(100).optional().nullable(),
  role_en: z.string().trim().max(100).optional().nullable(),
  tagline: z.string().trim().max(200).optional().nullable(),
  tagline_en: z.string().trim().max(200).optional().nullable(),
  tagline_ta: z.string().trim().max(200).optional().nullable(),
  logo_or_photo_path: z.string().trim().optional().nullable(),
  logo_or_photo_url: z.string().trim().optional().nullable(),
  photo_alt_en: z.string().trim().max(250).optional().nullable(),
  photo_alt_ta: z.string().trim().max(250).optional().nullable(),
  image: z.string().trim().optional(),
  website_url: z.string().trim().url().or(z.literal("")).optional(),
  instagramUrl: z.string().trim().url().or(z.literal("")).optional(),
  whatsappUrl: z.string().trim().url().or(z.literal("")).optional(),
  description: z.string().trim().optional().nullable(),
  description_en: z.string().trim().optional().nullable(),
  description_ta: z.string().trim().optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  status: z.enum(["draft", "published"]).default("published"),
  isActive: z.boolean().default(true).optional(),
  is_active: z.boolean().default(true).optional(),
});

export function validateBilingualSupporterFields(
  data: {
    name?: string | null;
    name_en?: string | null;
    nameEn?: string | null;
    name_ta?: string | null;
    nameTa?: string | null;
    role_en?: string | null;
    roleEn?: string | null;
    role_ta?: string | null;
    roleTa?: string | null;
    status?: "draft" | "published";
  },
  ctx: z.RefinementCtx,
  requireAll: boolean,
  requireBothLanguages = REQUIRE_BOTH_LANGUAGES_TO_PUBLISH
) {
  if (requireAll && !(data.name_en || data.nameEn || data.name || "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name_en"], message: "English name is required" });
  }
  if (requireAll && !(data.role_en || data.roleEn || "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role_en"], message: "English role / title is required" });
  }
  const effectiveStatus = data.status ?? "published";
  if (requireBothLanguages && effectiveStatus === "published") {
    if (!(data.name_ta || data.nameTa || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name_ta"], message: "Tamil name is required to publish" });
    }
    if (!(data.role_ta || data.roleTa || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role_ta"], message: "Tamil role is required to publish" });
    }
  }
}

export const adminSupporterCreateSchema = adminSupporterSchema.superRefine((data, ctx) => {
  validateBilingualSupporterFields(data, ctx, true);
});

export const adminSupporterUpdateSchema = adminSupporterSchema
  .partial()
  .extend({
    id: z.string().min(1, "Supporter ID is required"),
  })
  .superRefine((data, ctx) => {
    validateBilingualSupporterFields(data, ctx, false);
  });

// ============================================================================
// VIDEOS VALIDATOR
// ============================================================================
export const adminVideoBaseSchema = z.object({
  title: z.string().trim().max(300).optional(),
  title_en: z.string().trim().max(300).optional().nullable(),
  title_ta: z.string().trim().max(300).optional().nullable(),
  slug: asciiSlugField.optional(),
  description: z.string().trim().optional().nullable(),
  description_en: z.string().trim().optional().nullable(),
  description_ta: z.string().trim().optional().nullable(),
  category_en: z.string().trim().max(100).optional().nullable(),
  category_ta: z.string().trim().max(100).optional().nullable(),
  poster_alt_en: z.string().trim().max(250).optional().nullable(),
  poster_alt_ta: z.string().trim().max(250).optional().nullable(),
  video_path: z.string().trim().optional(),
  video_url: z.string().trim().optional(),
  embed_url: z.string().trim().optional(),
  poster_path: z.string().trim().optional(),
  poster_url: z.string().trim().min(1, "Poster image is mandatory for video entries"),
  duration_seconds: z.coerce.number().int().min(0).optional(),
  file_size_bytes: z.coerce.number().int().min(0).optional(),
  mime_type: z.string().trim().optional(),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  status: z.enum(["draft", "published"]).default("published"),
  is_active: z.boolean().default(true).optional(),
});

export function validateBilingualVideoFields(
  data: {
    title?: string | null;
    title_en?: string | null;
    title_ta?: string | null;
    status?: "draft" | "published";
  },
  ctx: z.RefinementCtx,
  requireAll: boolean,
  requireBothLanguages = REQUIRE_BOTH_LANGUAGES_TO_PUBLISH
) {
  if (requireAll && !(data.title_en || data.title || "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_en"], message: "English video title is required" });
  }
  const effectiveStatus = data.status ?? "published";
  if (requireBothLanguages && effectiveStatus === "published") {
    if (!(data.title_ta || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title_ta"], message: "Tamil video title is required to publish" });
    }
  }
}

export const adminVideoSchema = adminVideoBaseSchema
  .refine((data) => Boolean(data.video_path || data.video_url || data.embed_url), {
    message: "Either an uploaded video file, video URL, or embed URL is required",
    path: ["video_url"],
  })
  .superRefine((data, ctx) => {
    validateBilingualVideoFields(data, ctx, true);
  });

export const adminVideoUpdateSchema = adminVideoBaseSchema
  .partial()
  .extend({
    id: z.string().min(1, "Video ID is required"),
  })
  .superRefine((data, ctx) => {
    validateBilingualVideoFields(data, ctx, false);
  });

export const adminImageFolderSchema = z.enum([
  "books",
  "book",
  "blog",
  "blogs",
  "articles",
  "supporters",
  "members",
  "videos",
  "video-posters",
  "posters",
]);
