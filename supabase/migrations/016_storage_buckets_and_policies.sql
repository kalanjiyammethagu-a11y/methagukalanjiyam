-- ============================================================
-- 016_STORAGE_BUCKETS_AND_POLICIES.SQL
-- Methagu Kalanjiyam Dynamic CMS Supabase Storage Architecture
-- Configures buckets: books, blog, supporters, videos, video-posters
-- Enforces: Public read, Admin/Service-role only write & delete
-- ============================================================

-- 1. Create or Update Storage Buckets in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'books',
    'books',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'blog',
    'blog',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'supporters',
    'supporters',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'videos',
    'videos',
    true,
    524288000, -- 500 MB (Note: Free tier Supabase max is 50MB; Pro plan supports up to 500MB+)
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
  ),
  (
    'video-posters',
    'video-posters',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects Security Policies (storage.objects)
-- Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- A. Public Read Access
DROP POLICY IF EXISTS "Public Read Access on Dynamic CMS Buckets" ON storage.objects;
CREATE POLICY "Public Read Access on Dynamic CMS Buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('books', 'blog', 'supporters', 'videos', 'video-posters'));

-- B. Admin-Only Insertion (Direct client uploads require admin auth)
DROP POLICY IF EXISTS "Admins Can Upload CMS Assets" ON storage.objects;
CREATE POLICY "Admins Can Upload CMS Assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('books', 'blog', 'supporters', 'videos', 'video-posters')
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- C. Admin-Only Update
DROP POLICY IF EXISTS "Admins Can Update CMS Assets" ON storage.objects;
CREATE POLICY "Admins Can Update CMS Assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('books', 'blog', 'supporters', 'videos', 'video-posters')
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- D. Admin-Only Delete
DROP POLICY IF EXISTS "Admins Can Delete CMS Assets" ON storage.objects;
CREATE POLICY "Admins Can Delete CMS Assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('books', 'blog', 'supporters', 'videos', 'video-posters')
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );
