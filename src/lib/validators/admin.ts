import { z } from "zod";

export const adminCategorySchema = z
  .object({
    name_ta: z.string().trim().min(1, "Tamil category name is required").max(100),
    name_en: z.string().trim().min(1, "English category name is required").max(100),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens")
      .max(100)
      .optional(),
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
  title: z.string().trim().min(1, "Book title is required").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(150)
    .optional(),
  author: z.string().trim().min(1, "Author is required").max(100),
  description: z.string().trim().optional().nullable(),
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
  published_year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  weight_grams: z.coerce.number().int().min(0).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  is_featured: z.boolean().default(false).optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

export const adminBookCreateSchema = adminBookSchema.superRefine((data, ctx) => {
  const coverUrl = (data.cover_image_url || data.cover_front || "").trim();
  if (!coverUrl || coverUrl === "/images/books/book-placeholder.webp") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cover_image_url"],
      message: "Front cover (outside) image is required.",
    });
  }
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
  });

// ============================================================================
// BLOG POSTS VALIDATOR
// ============================================================================
export const adminBlogPostSchema = z.object({
  title: z.string().trim().min(1, "Article title is required").max(300),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(150)
    .optional(),
  excerpt: z.string().trim().optional().nullable(),
  body: z.string().trim().min(1, "Article content or body is required"),
  author: z.string().trim().min(1, "Author is required").default("மேதகு களஞ்சியம்"),
  cover_image_path: z.string().trim().optional().nullable(),
  cover_image_url: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "published"]).default("published"),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  published_at: z.string().datetime().optional().nullable(),
  seo_title: z.string().trim().max(150).optional().nullable(),
  seo_description: z.string().trim().max(300).optional().nullable(),
  reading_time_mins: z.coerce.number().int().min(1).default(5).optional(),
});

export const adminBlogPostUpdateSchema = adminBlogPostSchema.partial().extend({
  id: z.string().uuid("Invalid article ID"),
});

// ============================================================================
// SUPPORTERS VALIDATOR
// ============================================================================
export const adminSupporterSchema = z.object({
  name: z.string().trim().min(1, "Supporter name is required").max(100),
  nameTa: z.string().trim().optional(),
  nameEn: z.string().trim().optional(),
  roleTa: z.string().trim().optional(),
  roleEn: z.string().trim().optional(),
  role_ta: z.string().trim().max(100).optional(),
  role_en: z.string().trim().max(100).optional(),
  tagline: z.string().trim().max(200).optional(),
  logo_or_photo_path: z.string().trim().optional(),
  logo_or_photo_url: z.string().trim().optional(),
  image: z.string().trim().optional(),
  website_url: z.string().trim().url().or(z.literal("")).optional(),
  instagramUrl: z.string().trim().url().or(z.literal("")).optional(),
  whatsappUrl: z.string().trim().url().or(z.literal("")).optional(),
  description: z.string().trim().optional(),
  sort_order: z.coerce.number().int().min(0).default(0).optional(),
  status: z.enum(["draft", "published"]).default("published"),
  isActive: z.boolean().default(true).optional(),
  is_active: z.boolean().default(true).optional(),
});

export const adminSupporterUpdateSchema = adminSupporterSchema.partial().extend({
  id: z.string().min(1, "Supporter ID is required"),
});

// ============================================================================
// VIDEOS VALIDATOR
// ============================================================================
export const adminVideoBaseSchema = z.object({
  title: z.string().trim().min(1, "Video title is required").max(300),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(150)
    .optional(),
  description: z.string().trim().optional(),
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

export const adminVideoSchema = adminVideoBaseSchema.refine(
  (data) => Boolean(data.video_path || data.video_url || data.embed_url),
  {
    message: "Either an uploaded video file, video URL, or embed URL is required",
    path: ["video_url"],
  }
);

export const adminVideoUpdateSchema = adminVideoBaseSchema.partial().extend({
  id: z.string().min(1, "Video ID is required"),
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
