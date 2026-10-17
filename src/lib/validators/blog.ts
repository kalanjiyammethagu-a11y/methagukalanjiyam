import { z } from "zod";

export const blogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(2, "Slug is required"),
  post_type: z.enum(["article", "feed_update"]).default("article"),
  excerpt: z.string().optional(),
  content: z.any(), // Tiptap JSON document
  cover_image: z.string().min(1, "Cover image is required"),
  gallery_images: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  transliteration_keywords: z.array(z.string()).default([]),
  reading_time_mins: z.coerce.number().int().positive().default(5),
  is_published: z.boolean().default(false),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  tagged_book_ids: z.array(z.string().uuid()).default([]),
});

export type BlogInput = z.infer<typeof blogSchema>;
