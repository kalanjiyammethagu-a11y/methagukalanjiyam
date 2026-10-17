-- ============================================================
-- 004_SEED_DATA.SQL
-- Methagu Kalanjiyam Seed Data (Categories, Settings & Initial Books)
-- ============================================================

-- Seed Categories
INSERT INTO categories (id, name_ta, name_en, slug, sort_order, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'வரலாறு', 'History', 'history', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'ஆவணத் தொகுப்பு', 'Documentary Archives', 'archives', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'ஆவண நூல்', 'National Records', 'records', 3, true),
  ('a0000000-0000-0000-0000-000000000004', 'போராட்ட நினைவுகள்', 'Memoirs', 'memoirs', 4, true),
  ('a0000000-0000-0000-0000-000000000005', 'தலைவர்கள் வரலாறு', 'Biographies', 'biographies', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Site Settings
INSERT INTO site_settings (key, value) VALUES
  ('general', '{"site_name": "மெதகு களஞ்சியம்", "site_tagline": "Rare Tamil Literature & National Archives", "contact_phone": "+918248654946", "whatsapp_number": "918248654946", "support_email": "contact@methagukalanjiyam.in"}'::jsonb),
  ('shipping', '{"standard_shipping_fee": 40.00, "free_shipping_threshold": 500.00, "default_courier": "st_courier"}'::jsonb),
  ('payment', '{"razorpay_enabled": true, "cod_enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Initial Books
INSERT INTO books (
  id, title, slug, author, description, price, stock, category_id,
  cover_front, transliteration_keywords, is_featured, sort_order
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'கட்டுநாயக்கா தாக்குதல் வெற்றி',
  'katunayake-attack-victory',
  'சாந்தி நேசக்கரம்',
  'கட்டுநாயக்கா சிலருக்கு ஊரின் பெயர், சிலருக்கு விமான நிலையம் ஒன்றின் பெயர். ஈழத்தமிழருக்கோ இதயம் கனக்கும் நினைவுகளின் அடையாளம். வீரத்திற்கும் தியாகத்திற்கும் உச்சமான அர்த்தம் கொடுத்து மடிந்துபோன வீரர்களின் நினைவிடம்.',
  100.00,
  10,
  'a0000000-0000-0000-0000-000000000002',
  '/book 20.webp',
  ARRAY['katunayake', 'kattunayaka', 'attack', 'thakkuthal', 'shanthi', 'nesakaram'],
  true,
  1
),
(
  'b0000000-0000-0000-0000-000000000002',
  'நெஞ்சுரம்',
  'nenjuram',
  'துளசிச்செல்வன் (தேவராஜா ராஜ்மதன்)',
  'தமிழீழத் தேசியத் தலைவர் அவர்கள் தனது சிந்தனைகளிலொன்றில் எமது போராட்டத்தின் வலிமை போராளிகளின் நெஞ்சுரத்திலிருந்தே பிறக்கிறது என்று கூறியிருப்பார். அவரின் சிந்தனையிலிருந்தே பிறக்குகிறது இந்தத் தொகுப்பின் பெயரும்.',
  150.00,
  10,
  'a0000000-0000-0000-0000-000000000001',
  '/book 16.webp',
  ARRAY['nenjuram', 'thulasichelvan', 'thulasi', 'devaraja', 'rajmathan'],
  true,
  2
),
(
  'b0000000-0000-0000-0000-000000000003',
  'திசை தவறாக்கணை தளபதிவிநாயகம்',
  'dhisai-thavara-kanai',
  'சாந்தி நேசக்கரம்',
  'போராளிகளின் நகர்வுகளும் பின்வாங்கல்களும், தப்பிப்புகளும், எதிர்கொண்ட சவால்களும் விவரிக்கப்படும் விதம், ஒரு தரமான போர்த் திரைப்படத்தை நேரில் பார்த்துக் கொண்டிருப்பது போன்ற உணர்வை ஏற்படுத்துகின்றது.',
  85.00,
  10,
  'a0000000-0000-0000-0000-000000000003',
  '/book 13.webp',
  ARRAY['dhisai', 'thavara', 'kanai', 'vinayagam', 'thalapathi', 'shanthi'],
  true,
  3
),
(
  'b0000000-0000-0000-0000-000000000004',
  'நிறையாப் பெருவெளி',
  'niraiyaa-peruveli',
  'சாந்தி நேசக்கரம்',
  'சாந்தி நேசக்கரம் என அனைவராலும் அறியப்படும் சாந்தியை முதலில் நான் சந்தித்தது விடுதலைப் போராட்டத்தின் நெருக்கடியான சூழ்நிலையொன்றில்தான். 2000 வது ஆண்டு தொடக்கத்தில் ஊடகங்கள் ஊடாக இவரது குரல் இவர் செய்த பணிகள் மிகப்பெரியது.',
  85.00,
  10,
  'a0000000-0000-0000-0000-000000000001',
  '/book 12.webp',
  ARRAY['niraiya', 'peruveli', 'shanthi', 'nesakaram'],
  true,
  4
),
(
  'b0000000-0000-0000-0000-000000000005',
  'உயிரணை',
  'uyiranai',
  'சாந்தி நேசக்கரம்',
  'அவனது கடைசி ஆசை பற்றி அவனது கடைசிக் கனவு பற்றி எதையுமே கேட்சுவோ நிறைவேற்றவோ அவகாசமில்லை. குப்பியையும் 2 கைண்டுகளையும் கம்பனுக்குக் கொடுத்தான் ஆதித்தன்.',
  125.00,
  10,
  'a0000000-0000-0000-0000-000000000001',
  '/book 15.webp',
  ARRAY['uyiranai', 'kamban', 'aadithan', 'shanthi'],
  false,
  5
)
ON CONFLICT (slug) DO NOTHING;
