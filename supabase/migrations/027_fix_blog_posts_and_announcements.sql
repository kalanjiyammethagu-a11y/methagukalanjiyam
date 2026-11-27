-- Fix public.blog_posts missing SQL table grants & admin policy
-- and add blog_categories support alongside announcements table

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;

DROP POLICY IF EXISTS "Admins can manage blog_posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog_posts"
  ON public.blog_posts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Ensure announcements table exists if 026 wasn't applied directly
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label TEXT NOT NULL DEFAULT '',
  date_label_en TEXT NOT NULL DEFAULT '',
  date_label_ta TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  title_ta TEXT NOT NULL DEFAULT '',
  desc_en TEXT NOT NULL DEFAULT '',
  desc_ta TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
CREATE POLICY "Public can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.announcements
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

CREATE INDEX IF NOT EXISTS idx_announcements_active_order
  ON public.announcements (is_active, sort_order ASC, created_at DESC);

-- Backfill missing legacy `blogs` entries into `blog_posts` so both stay consistent
INSERT INTO public.blog_posts (
  slug,
  title,
  title_en,
  title_ta,
  excerpt,
  excerpt_en,
  excerpt_ta,
  body,
  body_en,
  body_ta,
  author,
  author_en,
  author_ta,
  category_en,
  category_ta,
  cover_image_url,
  cover_alt_en,
  cover_alt_ta,
  status,
  reading_time_mins,
  published_at,
  created_at,
  updated_at
)
SELECT
  b.slug,
  b.title,
  COALESCE(b.title_en, b.meta_title),
  b.title_ta,
  b.excerpt,
  COALESCE(b.excerpt_en, b.meta_description),
  b.excerpt_ta,
  COALESCE(
    b.content->>'html',
    b.content->>'body_ta',
    b.content->>'body_en',
    b.content->>'body',
    ''
  ),
  b.content->>'body_en',
  COALESCE(b.content->>'body_ta', b.content->>'body'),
  COALESCE(b.content->>'author_ta', b.content->>'author_en', 'மேதகு களஞ்சியம்'),
  b.content->>'author_en',
  b.content->>'author_ta',
  COALESCE(b.content->>'category_en', 'Historical Record'),
  COALESCE(b.content->>'category_ta', 'வரலாற்று ஆவணம்'),
  b.cover_image,
  b.cover_alt_en,
  b.cover_alt_ta,
  CASE WHEN b.is_published THEN 'published' ELSE 'draft' END,
  COALESCE(b.reading_time_mins, 5),
  b.published_at,
  b.created_at,
  b.updated_at
FROM public.blogs b
WHERE b.slug ~ '^[a-z0-9-]+$'
ON CONFLICT (slug) DO NOTHING;
