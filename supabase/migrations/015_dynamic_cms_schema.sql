-- ============================================================
-- 015_DYNAMIC_CMS_SCHEMA.SQL
-- Methagu Kalanjiyam Dynamic CMS Architecture
-- Extends books, supporters, videos and introduces blog_posts
-- RLS enforced: Public SELECT (status='published'), Admin-only writes
-- ============================================================

-- Ensure moddatetime or custom updated_at function exists
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. BOOKS SCHEMA EXTENSION
-- ============================================================
ALTER TABLE public.books 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;

-- Synchronize status with existing is_active flag if present
UPDATE public.books
SET status = CASE WHEN is_active THEN 'published' ELSE 'draft' END
WHERE status IS NULL OR status = 'published';

-- Ensure cover_image_url points to cover_front if cover_image_url is null
UPDATE public.books
SET cover_image_url = cover_front
WHERE cover_image_url IS NULL AND cover_front IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_books_status ON public.books (status);
CREATE INDEX IF NOT EXISTS idx_books_sort_order ON public.books (sort_order);

-- Books RLS Update
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view books" ON public.books;
DROP POLICY IF EXISTS "Public can view published books" ON public.books;
CREATE POLICY "Public can view published books"
  ON public.books FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books"
  ON public.books FOR ALL
  USING (is_admin());

-- ============================================================
-- 2. BLOG_POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  excerpt           TEXT,
  body              TEXT NOT NULL DEFAULT '',
  author            TEXT NOT NULL DEFAULT 'மேதகு களஞ்சியம்',
  cover_image_path  TEXT,
  cover_image_url   TEXT,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order        INT NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ DEFAULT now(),
  seo_title         TEXT,
  seo_description   TEXT,
  reading_time_mins INT NOT NULL DEFAULT 5,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search vector on blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts (status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_sort_order ON public.blog_posts (sort_order);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts (published_at DESC);

-- Trigger for blog_posts updated_at
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

-- Blog Posts RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published blog_posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog_posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage blog_posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog_posts"
  ON public.blog_posts FOR ALL
  USING (is_admin());

-- Backwards compatibility view for legacy queries targeting `blogs`
CREATE OR REPLACE VIEW public.blogs_compat_view AS
SELECT
  id,
  title,
  slug,
  excerpt,
  json_build_object('body', body) as content,
  coalesce(cover_image_url, cover_image_path, '') as cover_image,
  'article' as post_type,
  author,
  (status = 'published') as is_published,
  published_at,
  reading_time_mins,
  seo_title as meta_title,
  seo_description as meta_description,
  created_at,
  updated_at
FROM public.blog_posts;

-- ============================================================
-- 3. SUPPORTERS SCHEMA EXTENSION
-- ============================================================
ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS role_ta TEXT,
  ADD COLUMN IF NOT EXISTS role_en TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS logo_or_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS logo_or_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update existing supporters rows
UPDATE public.supporters
SET status = CASE WHEN is_active THEN 'published' ELSE 'draft' END,
    logo_or_photo_url = COALESCE(avatar_url, logo_or_photo_url)
WHERE status IS NULL OR status = 'published';

CREATE INDEX IF NOT EXISTS idx_supporters_status ON public.supporters (status);
CREATE INDEX IF NOT EXISTS idx_supporters_sort_order ON public.supporters (sort_order);

-- Trigger for supporters updated_at
DROP TRIGGER IF EXISTS trg_supporters_updated_at ON public.supporters;
CREATE TRIGGER trg_supporters_updated_at
  BEFORE UPDATE ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

-- Supporters RLS Update
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active supporters" ON public.supporters;
DROP POLICY IF EXISTS "Public can view published supporters" ON public.supporters;
CREATE POLICY "Public can view published supporters"
  ON public.supporters FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage supporters" ON public.supporters;
CREATE POLICY "Admins can manage supporters"
  ON public.supporters FOR ALL
  USING (is_admin());

-- ============================================================
-- 4. VIDEOS SCHEMA EXTENSION
-- ============================================================
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS video_path TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS poster_path TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure unique slug constraint
DO $$ BEGIN
  ALTER TABLE public.videos ADD CONSTRAINT uq_videos_slug UNIQUE (slug);
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Populate missing video slugs and status
UPDATE public.videos
SET status = CASE WHEN is_active THEN 'published' ELSE 'draft' END,
    video_url = COALESCE(video_url, embed_url),
    slug = COALESCE(slug, 'video-' || substr(id::text, 1, 8))
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_videos_slug ON public.videos (slug);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos (status);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos (sort_order);

-- Trigger for videos updated_at
DROP TRIGGER IF EXISTS trg_videos_updated_at ON public.videos;
CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

-- Videos RLS Update
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active videos" ON public.videos;
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
CREATE POLICY "Public can view published videos"
  ON public.videos FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
CREATE POLICY "Admins can manage videos"
  ON public.videos FOR ALL
  USING (is_admin());
