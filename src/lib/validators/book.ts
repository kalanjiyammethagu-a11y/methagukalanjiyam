import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().min(1, "Book title is required"),
  slug: z.string().min(1, "Slug is required"),
  author: z.string().min(1, "Author name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than zero"),
  discount_price: z.coerce.number().nonnegative().optional().nullable(),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  cover_front: z.string().optional().nullable(),
  cover_back: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  pages: z.coerce.number().int().positive().optional().nullable(),
  publisher: z.string().optional().nullable(),
  published_year: z.coerce.number().int().optional().nullable(),
  weight_grams: z.coerce.number().int().optional().nullable(),
  tags: z.array(z.string()).default([]),
  transliteration_keywords: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
});

export type BookInput = z.infer<typeof bookSchema>;
