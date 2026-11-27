-- ============================================================================
-- Migration 026: Editable Recent Announcements Table & Seed Data
-- ============================================================================
-- Replaces the static hardcoded `announcements` array in BlogCatalogClient
-- with a bilingual, reorderable, RLS-protected `public.announcements` table
-- managed through Admin (`/admin/articles`).

CREATE TABLE IF NOT EXISTS public.announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label     TEXT NOT NULL DEFAULT '',
  date_label_en  TEXT,
  date_label_ta  TEXT,
  title_en       TEXT NOT NULL DEFAULT '',
  title_ta       TEXT NOT NULL DEFAULT '',
  desc_en        TEXT NOT NULL DEFAULT '',
  desc_ta        TEXT NOT NULL DEFAULT '',
  link_url       TEXT,
  sort_order     INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active_sort
  ON public.announcements (is_active, sort_order ASC, created_at DESC);

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
CREATE POLICY "Public can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING ((SELECT public.is_admin()));

GRANT SELECT ON public.announcements TO anon, authenticated, service_role;
GRANT ALL ON public.announcements TO service_role;

INSERT INTO public.announcements (
  id,
  date_label,
  date_label_en,
  date_label_ta,
  title_en,
  title_ta,
  desc_en,
  desc_ta,
  sort_order,
  is_active
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    '07 ஆகஸ்ட் 2026',
    '07 August 2026',
    '07 ஆகஸ்ட் 2026',
    'New Book Release: Katunayake Attack Victory',
    'புதிய நூல் வெளியீடு: கட்டுநாயக்கா தாக்குதல் வெற்றி',
    'Special archival monograph detailing the landmark 2001 Katunayake military airbase operation is now available.',
    'ஜூலை 24, 2001 அன்று நடந்த வான்படைத்தளத் தாக்குதல் பற்றிய ஆவண நூல் தற்போது கையிருப்பில் உள்ளது.',
    1,
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    '05 ஆகஸ்ட் 2026',
    '05 August 2026',
    '05 ஆகஸ்ட் 2026',
    'Reprint: Lt. Col. Thileepan Commemorative Volumes',
    'தியாக தீபம் திலீபன் நூல்கள் மறுபதிப்பு',
    'Rare photographic and documentary archival volumes on the historic fast-unto-death in Jaffna.',
    'நல்லூர் வீதியில் நிகழ்ந்த வரலாற்று உன்னத தியாகத்தின் அரிய புகைப்படங்கள் அடங்கிய தொகுப்பு.',
    2,
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    '28 ஜூலை 2026',
    '28 July 2026',
    '28 ஜூலை 2026',
    'Worldwide Courier Dispatch Active',
    'அஞ்சல் வழியே அரிய ஆவணங்கள் பெறலாம்',
    'Speed Post dispatch available to all 19,100+ PIN codes across India and worldwide destinations.',
    'இந்தியா மற்றும் வெளிநாடுகளுக்கு விரைவு அஞ்சல் மூலம் நூல்கள் அனுப்பி வைக்கப்படுகின்றன.',
    3,
    true
  )
ON CONFLICT (id) DO NOTHING;
