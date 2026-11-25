-- ============================================================================
-- Migration 019: Complete Dual-Language (English + Tamil) CMS & Public Support
-- Status: NEW MIGRATION (NOT EXECUTED IN PRODUCTION)
-- Scope:
--   books, blog_posts, blogs (compat), supporters, videos, categories
-- Rules:
--   - Explicit paired `_en` / `_ta` columns for every user-facing text field.
--   - Single ASCII slug per item (`^[a-z0-9-]+$`); no Tamil characters in slugs.
--   - Existing single-language data is inspected via `public.contains_tamil()`
--     and copied into `_ta` when Tamil characters (`U+0B80..U+0BFF`) are present,
--     otherwise into `_en`, keeping legacy columns intact for later cleanup.
--
-- Rollback Notes (manual, if ever required):
--   DROP INDEX IF EXISTS public.idx_books_search_bilingual;
--   DROP INDEX IF EXISTS public.idx_blog_posts_search_bilingual;
--   DROP INDEX IF EXISTS public.idx_supporters_search_bilingual;
--   DROP INDEX IF EXISTS public.idx_videos_search_bilingual;
--   DROP FUNCTION IF EXISTS public.contains_tamil(TEXT);
--   -- Optionally drop added `_en` / `_ta` columns on books, blog_posts,
--   -- blogs, supporters, videos, categories (preserving legacy columns).
-- ============================================================================

-- 1. Helper to detect Tamil Unicode characters (U+0B80..U+0BFF) without escape ambiguity
CREATE OR REPLACE FUNCTION public.contains_tamil(txt TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(txt, '') ~ ('[' || chr(2944) || '-' || chr(3071) || ']');
$$;

-- ============================================================================
-- 2. BOOKS DUAL-LANGUAGE COLUMNS & BACKFILL
-- ============================================================================
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ta TEXT,
  ADD COLUMN IF NOT EXISTS author_en TEXT,
  ADD COLUMN IF NOT EXISTS author_ta TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ta TEXT,
  ADD COLUMN IF NOT EXISTS publisher_en TEXT,
  ADD COLUMN IF NOT EXISTS publisher_ta TEXT,
  ADD COLUMN IF NOT EXISTS quote_en TEXT,
  ADD COLUMN IF NOT EXISTS quote_ta TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_ta TEXT;

-- Detect existing language on books text fields and populate paired columns safely
UPDATE public.books
SET
  title_ta = CASE
    WHEN (title_ta IS NULL OR btrim(title_ta) = '') AND public.contains_tamil(title) THEN title
    ELSE title_ta
  END,
  title_en = CASE
    WHEN (title_en IS NULL OR btrim(title_en) = '') AND NOT public.contains_tamil(title) THEN title
    ELSE title_en
  END,
  author_ta = CASE
    WHEN (author_ta IS NULL OR btrim(author_ta) = '') AND public.contains_tamil(author) THEN author
    ELSE author_ta
  END,
  author_en = CASE
    WHEN (author_en IS NULL OR btrim(author_en) = '') AND NOT public.contains_tamil(author) THEN author
    ELSE author_en
  END,
  description_ta = CASE
    WHEN (description_ta IS NULL OR btrim(description_ta) = '') AND public.contains_tamil(description) THEN description
    ELSE description_ta
  END,
  description_en = CASE
    WHEN (description_en IS NULL OR btrim(description_en) = '') AND description IS NOT NULL AND NOT public.contains_tamil(description) THEN description
    ELSE description_en
  END,
  publisher_ta = CASE
    WHEN (publisher_ta IS NULL OR btrim(publisher_ta) = '') AND publisher IS NOT NULL AND public.contains_tamil(publisher) THEN publisher
    ELSE publisher_ta
  END,
  publisher_en = CASE
    WHEN (publisher_en IS NULL OR btrim(publisher_en) = '') AND publisher IS NOT NULL AND NOT public.contains_tamil(publisher) THEN publisher
    ELSE publisher_en
  END,
  updated_at = NOW();

-- ============================================================================
-- 3. BLOG_POSTS DUAL-LANGUAGE COLUMNS & BACKFILL
-- ============================================================================
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ta TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_ta TEXT,
  ADD COLUMN IF NOT EXISTS body_en TEXT,
  ADD COLUMN IF NOT EXISTS body_ta TEXT,
  ADD COLUMN IF NOT EXISTS author_en TEXT,
  ADD COLUMN IF NOT EXISTS author_ta TEXT,
  ADD COLUMN IF NOT EXISTS category_en TEXT,
  ADD COLUMN IF NOT EXISTS category_ta TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_ta TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_ta TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_ta TEXT;

UPDATE public.blog_posts
SET
  title_ta = CASE
    WHEN (title_ta IS NULL OR btrim(title_ta) = '') AND public.contains_tamil(title) THEN title
    ELSE title_ta
  END,
  title_en = CASE
    WHEN (title_en IS NULL OR btrim(title_en) = '') AND NOT public.contains_tamil(title) THEN title
    WHEN (title_en IS NULL OR btrim(title_en) = '') AND seo_title IS NOT NULL AND btrim(seo_title) <> '' AND NOT public.contains_tamil(seo_title) THEN seo_title
    ELSE title_en
  END,
  excerpt_ta = CASE
    WHEN (excerpt_ta IS NULL OR btrim(excerpt_ta) = '') AND excerpt IS NOT NULL AND public.contains_tamil(excerpt) THEN excerpt
    ELSE excerpt_ta
  END,
  excerpt_en = CASE
    WHEN (excerpt_en IS NULL OR btrim(excerpt_en) = '') AND excerpt IS NOT NULL AND NOT public.contains_tamil(excerpt) THEN excerpt
    WHEN (excerpt_en IS NULL OR btrim(excerpt_en) = '') AND seo_description IS NOT NULL AND btrim(seo_description) <> '' AND NOT public.contains_tamil(seo_description) THEN seo_description
    ELSE excerpt_en
  END,
  body_ta = CASE
    WHEN (body_ta IS NULL OR btrim(body_ta) = '') AND public.contains_tamil(body) THEN body
    ELSE body_ta
  END,
  body_en = CASE
    WHEN (body_en IS NULL OR btrim(body_en) = '') AND body IS NOT NULL AND btrim(body) <> '' AND NOT public.contains_tamil(body) THEN body
    ELSE body_en
  END,
  author_ta = CASE
    WHEN (author_ta IS NULL OR btrim(author_ta) = '') AND public.contains_tamil(author) THEN author
    ELSE author_ta
  END,
  author_en = CASE
    WHEN (author_en IS NULL OR btrim(author_en) = '') AND author IS NOT NULL AND NOT public.contains_tamil(author) THEN author
    ELSE author_en
  END,
  seo_title_ta = CASE
    WHEN (seo_title_ta IS NULL OR btrim(seo_title_ta) = '') AND seo_title IS NOT NULL AND public.contains_tamil(seo_title) THEN seo_title
    ELSE seo_title_ta
  END,
  seo_title_en = CASE
    WHEN (seo_title_en IS NULL OR btrim(seo_title_en) = '') AND seo_title IS NOT NULL AND NOT public.contains_tamil(seo_title) THEN seo_title
    ELSE seo_title_en
  END,
  seo_description_ta = CASE
    WHEN (seo_description_ta IS NULL OR btrim(seo_description_ta) = '') AND seo_description IS NOT NULL AND public.contains_tamil(seo_description) THEN seo_description
    ELSE seo_description_ta
  END,
  seo_description_en = CASE
    WHEN (seo_description_en IS NULL OR btrim(seo_description_en) = '') AND seo_description IS NOT NULL AND NOT public.contains_tamil(seo_description) THEN seo_description
    ELSE seo_description_en
  END,
  updated_at = NOW();

-- Legacy `blogs` table parity (additive only)
ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ta TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_ta TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_ta TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_ta TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_ta TEXT;

-- ============================================================================
-- 4. SUPPORTERS DUAL-LANGUAGE COLUMNS & BACKFILL
--    (`role_ta` and `role_en` already exist from migration 015)
-- ============================================================================
ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ta TEXT,
  ADD COLUMN IF NOT EXISTS tagline_en TEXT,
  ADD COLUMN IF NOT EXISTS tagline_ta TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ta TEXT,
  ADD COLUMN IF NOT EXISTS photo_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS photo_alt_ta TEXT;

UPDATE public.supporters
SET
  name_ta = CASE
    WHEN (name_ta IS NULL OR btrim(name_ta) = '') AND public.contains_tamil(name) THEN name
    ELSE name_ta
  END,
  name_en = CASE
    WHEN (name_en IS NULL OR btrim(name_en) = '') AND NOT public.contains_tamil(name) THEN name
    ELSE name_en
  END,
  tagline_ta = CASE
    WHEN (tagline_ta IS NULL OR btrim(tagline_ta) = '') AND tagline IS NOT NULL AND public.contains_tamil(tagline) THEN tagline
    ELSE tagline_ta
  END,
  tagline_en = CASE
    WHEN (tagline_en IS NULL OR btrim(tagline_en) = '') AND tagline IS NOT NULL AND NOT public.contains_tamil(tagline) THEN tagline
    ELSE tagline_en
  END,
  description_ta = CASE
    WHEN (description_ta IS NULL OR btrim(description_ta) = '') AND description IS NOT NULL AND public.contains_tamil(description) THEN description
    ELSE description_ta
  END,
  description_en = CASE
    WHEN (description_en IS NULL OR btrim(description_en) = '') AND description IS NOT NULL AND NOT public.contains_tamil(description) THEN description
    ELSE description_en
  END,
  updated_at = NOW();

-- ============================================================================
-- 5. VIDEOS DUAL-LANGUAGE TEXT COLUMNS & BACKFILL (Text fields + poster alt only)
-- ============================================================================
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ta TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ta TEXT,
  ADD COLUMN IF NOT EXISTS category_en TEXT,
  ADD COLUMN IF NOT EXISTS category_ta TEXT,
  ADD COLUMN IF NOT EXISTS poster_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS poster_alt_ta TEXT;

UPDATE public.videos
SET
  title_ta = CASE
    WHEN (title_ta IS NULL OR btrim(title_ta) = '') AND public.contains_tamil(title) THEN title
    ELSE title_ta
  END,
  title_en = CASE
    WHEN (title_en IS NULL OR btrim(title_en) = '') AND NOT public.contains_tamil(title) THEN title
    ELSE title_en
  END,
  description_ta = CASE
    WHEN (description_ta IS NULL OR btrim(description_ta) = '') AND description IS NOT NULL AND public.contains_tamil(description) THEN description
    ELSE description_ta
  END,
  description_en = CASE
    WHEN (description_en IS NULL OR btrim(description_en) = '') AND description IS NOT NULL AND NOT public.contains_tamil(description) THEN description
    ELSE description_en
  END,
  updated_at = NOW();

-- ============================================================================
-- 6. CATEGORIES OPTIONAL BILINGUAL DESCRIPTIONS
-- ============================================================================
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ta TEXT;

-- ============================================================================
-- 7. ASCII-ONLY SLUG CHECK CONSTRAINTS (NOT VALID preserves any legacy row while
--    enforcing pure ASCII `^[a-z0-9-]+$` on all new inserts and updates)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'books_slug_ascii_check' AND conrelid = 'public.books'::regclass
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_slug_ascii_check CHECK (slug ~ '^[a-z0-9-]+$') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_ascii_check' AND conrelid = 'public.blog_posts'::regclass
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_slug_ascii_check CHECK (slug ~ '^[a-z0-9-]+$') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'videos_slug_ascii_check' AND conrelid = 'public.videos'::regclass
  ) THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_slug_ascii_check CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$') NOT VALID;
  END IF;
END $$;

-- ============================================================================
-- 8. BILINGUAL SEARCH GIN INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_books_search_bilingual
  ON public.books
  USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(title_ta, '') || ' ' ||
      coalesce(author, '') || ' ' || coalesce(author_en, '') || ' ' || coalesce(author_ta, '') || ' ' ||
      coalesce(description_en, '') || ' ' || coalesce(description_ta, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_blog_posts_search_bilingual
  ON public.blog_posts
  USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(title_ta, '') || ' ' ||
      coalesce(excerpt_en, '') || ' ' || coalesce(excerpt_ta, '') || ' ' ||
      coalesce(author_en, '') || ' ' || coalesce(author_ta, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_supporters_search_bilingual
  ON public.supporters
  USING gin (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(name_ta, '') || ' ' ||
      coalesce(role_en, '') || ' ' || coalesce(role_ta, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_videos_search_bilingual
  ON public.videos
  USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(title_ta, '') || ' ' ||
      coalesce(description_en, '') || ' ' || coalesce(description_ta, '')
    )
  );
