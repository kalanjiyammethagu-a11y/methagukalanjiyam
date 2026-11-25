-- ============================================================================
-- Migration 018: Book Front Cover Primacy & Inside Pages Gallery
-- Status: NEW MIGRATION (NOT EXECUTED IN PRODUCTION)
-- Purpose:
--   1. Add explicit front-cover marker (`cover_is_front`), cover alt text columns
--      (`cover_alt_en`, `cover_alt_ta`), and ordered `gallery_images` JSONB array
--      for inside pages / secondary photos on `public.books`.
--   2. Preserve legacy `cover_front` and `cover_back` columns non-destructively.
--   3. Idempotently promote `cover_front` -> `cover_image_url` when missing,
--      preserve distinct `cover_back` inside `gallery_images`, repair the 19
--      visually verified catalog book covers from storage scramble/swap, and
--      flag `methagu-kalanjiyam-aavanam` (`cover_is_front = false`) for manual
--      admin cover upload because no matching front cover artwork exists in
--      `book-01.webp..book-20.webp` (`book-08.webp` belongs to "மேதகு செயல் மொழி").
--
-- Rollback Notes (manual, if ever required):
--   DROP INDEX IF EXISTS public.idx_books_needs_front_cover;
--   ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_gallery_images_is_array;
--   ALTER TABLE public.books
--     DROP COLUMN IF EXISTS gallery_images,
--     DROP COLUMN IF EXISTS cover_alt_ta,
--     DROP COLUMN IF EXISTS cover_alt_en,
--     DROP COLUMN IF EXISTS cover_is_front;
-- ============================================================================

-- 1. Add schema columns idempotently (non-destructive; keeps cover_front & cover_back intact)
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS cover_is_front BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cover_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_alt_ta TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Enforce JSON array shape on gallery_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'books_gallery_images_is_array'
      AND conrelid = 'public.books'::regclass
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_gallery_images_is_array
      CHECK (jsonb_typeof(gallery_images) = 'array');
  END IF;
END $$;

-- 3. Partial index to quickly list books flagged for manual cover review in Admin
CREATE INDEX IF NOT EXISTS idx_books_needs_front_cover
  ON public.books (id)
  WHERE cover_is_front = false;

-- 4. Backfill cover_image_url from legacy cover_front where cover_image_url is missing
UPDATE public.books
SET
  cover_image_url = cover_front,
  cover_is_front = COALESCE(cover_is_front, true),
  updated_at = NOW()
WHERE cover_image_url IS NULL
  AND cover_front IS NOT NULL
  AND btrim(cover_front) <> '';

-- 5. Preserve distinct legacy cover_back as the first gallery item when gallery_images is empty
UPDATE public.books
SET
  gallery_images = jsonb_build_array(
    jsonb_build_object(
      'url', cover_back,
      'path', NULL,
      'kind', 'back_cover',
      'alt_en', 'Back cover',
      'alt_ta', 'பின் அட்டை'
    )
  ),
  updated_at = NOW()
WHERE gallery_images = '[]'::jsonb
  AND cover_back IS NOT NULL
  AND btrim(cover_back) <> ''
  AND cover_back IS DISTINCT FROM COALESCE(cover_image_url, cover_front);

-- 6. Safe, non-destructive front-cover filename repair for the 19 visually verified books.
--    Only rows still referencing placeholder/seed filenames (`/images/books/...` or
--    `book-\d+\.webp`) are updated; admin-uploaded custom UUID files are never touched.
--    `cover_front` and `cover_back` remain untouched for full reversibility.
WITH verified_covers (slug, cover_filename) AS (
  VALUES
    ('maamanithar-velupillai',      'book-01.webp'),
    ('thileepanudan-12-naatkal',    'book-02.webp'),
    ('kanden-kanden',               'book-03.webp'),
    ('tamileelam-viduthalai',       'book-04.webp'),
    ('thozhar-tamilarasan',         'book-05.webp'),
    ('varalatru-thalaivan',         'book-06.webp'),
    ('purananooru-veeran',          'book-07.webp'),
    ('makkal-thunaiyodu',           'book-09.webp'),
    ('varalaru-enathu-vazhikaatti', 'book-10.webp'),
    ('tamilar-padai-saadhanai',     'book-11.webp'),
    ('niraiyaa-peruveli',           'book-12.webp'),
    ('dhisai-thavara-kanai',        'book-13.webp'),
    ('amudhundha-vaaygal',          'book-14.webp'),
    ('uyiranai',                    'book-15.webp'),
    ('nenjuram',                    'book-16.webp'),
    ('arivaran-pottu-amman',        'book-17.webp'),
    ('peraattralon-kumaran',        'book-18.webp'),
    ('thileepam',                   'book-19.webp'),
    ('katunayake-attack-victory',   'book-20.webp')
),
storage_origin AS (
  SELECT COALESCE(
    (
      SELECT regexp_replace(cover_image_url, '/book-[^/]+$', '')
      FROM public.books
      WHERE cover_image_url ~ '^https?://[^/]+/storage/v1/object/public/books/book-[0-9]+\.webp$'
      LIMIT 1
    ),
    'https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books'
  ) AS base_url
)
UPDATE public.books AS b
SET
  cover_image_path = vc.cover_filename,
  cover_image_url  = so.base_url || '/' || vc.cover_filename,
  cover_is_front   = true,
  updated_at       = NOW()
FROM verified_covers AS vc
CROSS JOIN storage_origin AS so
WHERE b.slug = vc.slug
  AND (
    b.cover_image_url IS NULL
    OR btrim(b.cover_image_url) = ''
    OR b.cover_image_url LIKE '/images/books/%'
    OR b.cover_image_url ~ '/books/book-[0-9]+\.webp$'
    OR COALESCE(b.cover_image_path, '') ~ '^book-[0-9]+\.webp$'
  );

-- 7. Flag book without verified front cover artwork in seed assets so admin reviews/uploads it
--    (Previously pointed to book-10.webp / book-15.webp which belong to other cataloged books.)
UPDATE public.books
SET
  cover_is_front   = false,
  cover_image_path = NULL,
  cover_image_url  = '/images/books/book-placeholder.webp',
  updated_at       = NOW()
WHERE slug = 'methagu-kalanjiyam-aavanam'
  AND (
    cover_image_url IS NULL
    OR btrim(cover_image_url) = ''
    OR cover_image_url LIKE '/images/books/%'
    OR COALESCE(cover_image_path, '') IN ('book-08.webp', 'book-10.webp', 'book-15.webp')
    OR cover_image_url ~ '/(book-08|book-10|book-15)\.webp$'
  );
