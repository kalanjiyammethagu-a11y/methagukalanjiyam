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

export const adminSupporterSchema = z
  .object({
    nameEn: z.string().trim().max(100).optional(),
    nameTa: z.string().trim().max(100).optional(),
    roleEn: z.string().trim().max(100).optional(),
    roleTa: z.string().trim().max(100).optional(),
    image: z.string().trim().max(500).optional(),
    instagramUrl: z.string().trim().url().max(300).or(z.literal("")).optional(),
    whatsappUrl: z.string().trim().url().max(300).or(z.literal("")).optional(),
    isActive: z.boolean().default(true).optional(),
  })
  .refine((data) => Boolean(data.nameEn || data.nameTa), {
    message: "At least one name (English or Tamil) is required",
    path: ["nameEn"],
  });

export const adminSupporterUpdateSchema = z
  .object({
    id: z.string().trim().min(1, "Supporter ID is required"),
    nameEn: z.string().trim().max(100).optional(),
    nameTa: z.string().trim().max(100).optional(),
    roleEn: z.string().trim().max(100).optional(),
    roleTa: z.string().trim().max(100).optional(),
    image: z.string().trim().max(500).optional(),
    instagramUrl: z.string().trim().url().max(300).or(z.literal("")).optional(),
    whatsappUrl: z.string().trim().url().max(300).or(z.literal("")).optional(),
    isActive: z.boolean().optional(),
  });

export const adminImageFolderSchema = z.enum(["books", "blogs", "articles", "supporters", "members"]);
