-- ============================================================================
-- Migration 025: Remediate Seeded Odysee Video URLs & Categories
-- ============================================================================
-- Migration 015 & seed 017 previously copied Odysee HTML embed URLs into
-- `video_url`, causing the storefront video player to mount `<video src="https://odysee.com/...">`
-- instead of `<iframe>`, and left `category_en`/`category_ta` unpopulated.
-- This migration cleanly separates embed URLs from direct storage video uploads.

UPDATE public.videos
SET
  embed_url = COALESCE(NULLIF(embed_url, ''), video_url),
  video_url = NULL,
  updated_at = NOW()
WHERE video_path IS NULL
  AND video_url IS NOT NULL
  AND (
    video_url ILIKE '%odysee.com%'
    OR video_url ILIKE '%youtube.com%'
    OR video_url ILIKE '%youtu.be%'
    OR video_url ILIKE '%youtube-nocookie.com%'
    OR video_url ILIKE '%vimeo.com%'
    OR video_url ILIKE '%/$/embed/%'
    OR video_url ILIKE '%/%24/embed/%'
  );

UPDATE public.videos
SET
  poster_path = COALESCE(NULLIF(poster_path, ''), regexp_replace(poster_url, '^/images/video-posters/', '')),
  updated_at = NOW()
WHERE poster_url LIKE '/images/video-posters/%'
  AND (poster_path IS NULL OR poster_path = '');

UPDATE public.videos
SET
  category_ta = COALESCE(category_ta, CASE
    WHEN slug IN ('video-1', 'video-2', 'video-18') THEN 'அறிமுகம்'
    WHEN slug IN ('video-7', 'video-13') THEN 'நினைவேந்தல்'
    WHEN slug IN ('video-10', 'video-11') THEN 'வரலாற்று ஆவணம்'
    WHEN slug IN ('video-12', 'video-19', 'video-22', 'video-23') THEN 'கள ஆவணம்'
    ELSE 'புத்தகக் காணொளி'
  END),
  category_en = COALESCE(category_en, CASE
    WHEN slug IN ('video-1', 'video-2', 'video-18') THEN 'Overview'
    WHEN slug IN ('video-7', 'video-13') THEN 'Memorials'
    WHEN slug IN ('video-10', 'video-11') THEN 'History'
    WHEN slug IN ('video-12', 'video-19', 'video-22', 'video-23') THEN 'Tactical'
    ELSE 'Book Showcase'
  END),
  updated_at = NOW()
WHERE category_en IS NULL OR category_ta IS NULL;
