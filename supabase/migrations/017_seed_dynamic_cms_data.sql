-- ============================================================
-- 017_SEED_DYNAMIC_CMS_DATA.SQL
-- Methagu Kalanjiyam Dynamic CMS Initial Data Seeding
-- Seeds Books, Blog Posts, Supporters, and Videos
-- ============================================================

-- 1. SEED / UPDATE BOOKS

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'கட்டுநாயக்கா தாக்குதல் வெற்றி',
  'katunayake-attack-victory',
  'சாந்தி நேசக்கரம்',
  'கட்டுநாயக்கா சிலருக்கு ஊரின் பெயர், சிலருக்கு சர்வதேச விமான நிலையம் ஒன்றின் பெயர். ஈழத்தமிழருக்கோ இதயம் கனக்கும் நினைவுகளின் அடையாளம். 2001 ஜூலை 24 அன்று 14 கரும்புலிகள் நடத்திய வீரஞ்செறிந்த போரியல் தாக்குதலின் முழு ஆவணப் பதிவு.',
  100,
  10,
  '/images/books/book-20.webp',
  '/images/books/book-20.webp',
  'book-20.webp',
  'published',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'நெஞ்சுரம்',
  'nenjuram',
  'துளசிச்செல்வன் (தேவராஜா ராஜ்மதன்)',
  'போராட்டத்தின் வலிமை போராளிகளின் நெஞ்சுரத்திலிருந்தே பிறக்கிறது. போராளிகளின் நெஞ்சுரம் எதிலிருந்து பிறக்கிறது? இந்த வினாவிற்கான விடையாகவே உள்ளேயுள்ள ஒவ்வொரு வீரரது வரலாறும் அமைகிறது.',
  150,
  8,
  '/images/books/book-16.webp',
  '/images/books/book-16.webp',
  'book-16.webp',
  'published',
  2,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'திசை தவறாக்கணை தளபதிவிநாயகம்',
  'dhisai-thavara-kanai',
  'சாந்தி நேசக்கரம்',
  'தளபதி விநாயகத்தின் வாழ்க்கை வரலாற்று நூல், ஒரு தரமான போர்த் திரைப்படத்தை நேரில் பார்ப்பது போன்ற உயிர்ப்பான அனுபவத்தைத் தருகிறது. போராளிகளின் நகர்வுகள், பின்வாங்கல்கள், பசி, தாகம் மற்றும் சவால்களைப் படிக்கும்போது, அவர்களுடன் நாமும் களத்தில் பயணிப்பது போன்ற உணர்வு ஏற்படுகிறது. பக்கங்கள் நகர நகர, அந்தப் பயணத்தின் களைப்பையும் மனப்பாரத்தையும் நம்மாலும் நேரடியாக உணர முடிகிறது.',
  85,
  15,
  '/images/books/book-13.webp',
  '/images/books/book-13.webp',
  'book-13.webp',
  'published',
  3,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000004',
  'நிறையாப் பெருவெளி',
  'niraiyaa-peruveli',
  'சாந்தி நேசக்கரம்',
  'தாயக விடுதலைப் போரில் மக்களின் பங்களிப்பும், களத்தின் துயரங்களும் வெற்றிகளும் ஆவணப்படுத்தப்பட்ட வரலாற்றுப் பெருநூல்.',
  85,
  12,
  '/images/books/book-12.webp',
  '/images/books/book-12.webp',
  'book-12.webp',
  'published',
  4,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000005',
  'உயிரணை',
  'uyiranai',
  'சாந்தி நேசக்கரம்',
  'களமுனைகளில் எதிரியின் முன்னேற்றத்தை தடுத்து நிறுத்த தங்கள் உயிர்களையே அணையென நிறுத்திய வீரர்களின் மெய்சிலிர்க்க வைக்கும் கள அனுபவங்கள்.',
  125,
  7,
  '/images/books/book-15.webp',
  '/images/books/book-15.webp',
  'book-15.webp',
  'published',
  5,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000006',
  'அமுதுண்ட வாய்கள் மூடிய உதடுகள்',
  'amudhundha-vaaygal',
  'துளசிச்செல்வன்',
  'சொல்லப்படாத தியாகங்களும், வெளிவராத களத்துப் பதிவுகளும் நெகிழ்ச்சியோடு விவரிக்கப்படும் அரிய நினைவுக் குறிப்பு நூல்.',
  90,
  11,
  '/images/books/book-14.webp',
  '/images/books/book-14.webp',
  'book-14.webp',
  'published',
  6,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000007',
  'அறிவரண் தளபதி பொட்டு அம்மான்',
  'arivaran-pottu-amman',
  'சாந்தி நேசக்கரம்',
  'தமிழீழ புலனாய்வுத்துறையின் பொறுப்பாளர் தளபதி பொட்டு அம்மான் அவர்களின் தனித்துவமான ஆளுமை மற்றும் தேசப்பணிகளை விவரிக்கும் வரலாற்று நூல்.',
  70,
  10,
  '/images/books/book-17.webp',
  '/images/books/book-17.webp',
  'book-17.webp',
  'published',
  7,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000008',
  'பேராற்றலோன் குமரன்',
  'peraattralon-kumaran',
  'துளசிச்செல்வன்',
  'களத்தில் ஒப்பற்ற துணிச்சலோடு செயலாற்றிய தளபதி குமரன் அவர்களின் வீர வரலாற்றை விவரிக்கும் சுருக்கமான ஆவண நூல்.',
  50,
  10,
  '/images/books/book-18.webp',
  '/images/books/book-18.webp',
  'book-18.webp',
  'published',
  8,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000009',
  'புறநானூற்று வீரன்',
  'purananooru-veeran',
  'திருமுருகன்காளிலிங்கம்',
  'ஆனையிறவில் புலிக்கொடி பறந்து நானூறு ஆண்டுகள் ஆயிற்று. எத்தனையோ புரட்சியாளர்கள், புரட்சிப்படைகள் மண்ணில் முளைத்த போதும் ஆனையிறவில் புலிக்கொடி பறக்க இயலவில்லை. அத்தகைய ஆனையிறவு சமரின் முழு வரலாற்றுப் பெருநூல்.',
  499,
  10,
  '/images/books/book-07.webp',
  '/images/books/book-07.webp',
  'book-07.webp',
  'published',
  9,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000010',
  'கண்டேன் கண்டேன் தலைவரை கண்டேன்',
  'kanden-kanden',
  'பேரா.அறிவரசன்',
  'பேராசிரியர் அறிவரசன் வன்னிக்கு நேரில் சென்று தேசியத் தலைவர் மேதகு வே. பிரபாகரன் அவர்களை நேரில் சந்தித்து உரையாடிய இனிய அனுபவங்களின் எழுத்தோவியம்.',
  80,
  10,
  '/images/books/book-03.webp',
  '/images/books/book-03.webp',
  'book-03.webp',
  'published',
  10,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000011',
  'வரலாறு எனது வழிகாட்டி',
  'varalaru-enathu-vazhikaatti',
  'மேதகு வே. பிரபாகரன்',
  'வரலாறு எனது வழிகாட்டி என்பது தலைவர் மேதகு வே. பிரபாகரன் அவர்கள் வழங்கிய நேர்காணலைத் தொகுத்து உருவாக்கப்பட்ட நூலாகும். நெறியாளருக்கும் தலைவருக்குமான நேரடி உரையாடலாக அமையும் இந்நூல், அவரின் சிந்தனைகள், பார்வைகள் மற்றும் வரலாற்று நிலைப்பாடுகளை மிகத் தெளிவாக வெளிப்படுத்துகிறது. தலைவரின் எண்ணங்களை அவரின் வார்த்தைகளிலேயே நேரடியாக அறிந்துகொள்ள உதவும் முக்கிய ஆவணமாக இந்நூல் திகழ்கிறது.',
  120,
  10,
  '/images/books/book-08.webp',
  '/images/books/book-08.webp',
  'book-08.webp',
  'published',
  11,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000012',
  'தீலீபனுடன் 12 நாட்கள்',
  'thileepanudan-12-naatkal',
  'கவிஞர் மு.வே.யோ.வாஞ்சிநாதன்',
  '1987 செப்டம்பரில் யாழ் நல்லூர் கந்தசுவாமி கோவில் முன்றலில் தியாக தீபம் திலீபன் நீராகாரமும் இன்றி 12 நாட்கள் நிகழ்த்திய அகிம்சை அறப்போராட்டத்தின் வரலாற்று ஆவணம்.',
  100,
  10,
  '/images/books/book-02.webp',
  '/images/books/book-02.webp',
  'book-02.webp',
  'published',
  12,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000013',
  'தலைவரின் வழிகாட்டலில்',
  'varalatru-thalaivan',
  'சுப்பையா ரவி (எள்ளாளன்)',
  'தலைவர் மேதகு வே. பிரபாகரன் அவர்களின் நேரடிப் பணிப்பில் ''விடுதலைப்புலிகள்'' பத்திரிகையின் ஆசிரியராகவும், கொள்கை விளக்கப் பேச்சாளராகவும் பணியாற்றிய சுப்பையா ரவி (எள்ளாளன்) எழுதிய நூல் இது. தலைவரின் வழிகாட்டலில் அமைந்த பயணத்தையும், தன் நேரடி அனுபவங்களையும் இந்நூலில் அவர் பதிவு செய்துள்ளார்.',
  150,
  10,
  '/images/books/book-06.webp',
  '/images/books/book-06.webp',
  'book-06.webp',
  'published',
  13,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000014',
  'தமிழீழ விடுதலைப் போரும், விடுதலைப் புலிகளும்',
  'tamileelam-viduthalai',
  'மாணவர் ஒருங்கிணைப்புக்குழு',
  'ஈழத்தமிழர் வரலாற்றில் ஆயுதப் போராட்டத்தின் தோற்றமும், விடுதலைப் புலிகள் இயக்கத்தின் பரிணாம வளர்ச்சியும் விரிவாக ஆய்வு செய்யப்படும் வரலாற்று நூல்.',
  150,
  10,
  '/images/books/book-04.webp',
  '/images/books/book-04.webp',
  'book-04.webp',
  'published',
  14,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000015',
  'தோழர் தமிழரசன் மூன்று அறிக்கைகள்',
  'thozhar-tamilarasan',
  'நந்தகுமார்',
  'தோழர் தமிழரசன் அவர்களின் வரலாற்றுப் புகழ்மிக்க மூன்று அரசியல் அறிக்கைகள் மற்றும் தமிழ்நாடு விடுதலைப் படை தொடர்பான ஆவணங்களின் தொகுப்பு.',
  200,
  10,
  '/images/books/book-05.webp',
  '/images/books/book-05.webp',
  'book-05.webp',
  'published',
  15,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000016',
  'மக்கள் துணையோடு மரணத்தை வென்றேன்',
  'makkal-thunaiyodu',
  'புலவர் கு. கலியபெருமாள்',
  'சாவுக்கஞ்சாது பல சாகசங்கள் புரிந்த மாவீரனின் வரலாறு ஒரு புரட்சிகர நெடும்பயணமாகும். தனது வியத்தகு வாழ்வியல் அனுபவங்களை அவர் இந்த நூலில் பதிவு செய்துள்ளார். அவர்பட்ட பாடுகளை, அனுபவித்த துன்பங்களை வரலாற்றின் இரத்த வரிகளாக நாம் காணும்போது நமது விழிகள் கோபத்தால் சிவக்கின்றன. கண்ணீரால் குளமாகின்றன. சில நேரங்களில் இப்படிப்பட்ட வீர வரலாறுகளைப் படிக்கும்போது நம் நெஞ்சம் உணர்ச்சிப் பெருக்கால் விம்முகிறது.',
  150,
  10,
  '/images/books/book-09.webp',
  '/images/books/book-09.webp',
  'book-09.webp',
  'published',
  16,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000017',
  'மாமனிதர் திருவேங்கடம் வேலுப்பிள்ளை',
  'maamanithar-velupillai',
  'பேரா.அறிவரசன்',
  'தேசியத் தலைவர் மேதகு வே. பிரபாகரன் அவர்களின் தந்தையாரான மாமனிதர் திருவேங்கடம் வேலுப்பிள்ளை அவர்களின் நற்குணங்களையும் வாழ்க்கை நெறிகளையும் விவரிக்கும் நூல்.',
  50,
  10,
  '/images/books/book-01.webp',
  '/images/books/book-01.webp',
  'book-01.webp',
  'published',
  17,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000018',
  'தமிழர் படையின் சாதனை சமர்',
  'tamilar-padai-saadhanai',
  'சு.ரவி',
  'தரைப்படை, கடற்புலிகள், வான்படை என முப்படை கட்டமைப்போடு தமிழர் படை களத்தில் நிகழ்த்திய வரலாற்றுச் சிறப்புமிக்க சமர்களின் தொகுப்பு.',
  200,
  10,
  '/images/books/book-11.webp',
  '/images/books/book-11.webp',
  'book-11.webp',
  'published',
  18,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000019',
  'திலீபம்',
  'thileepam',
  'மாணவர் ஒருங்கிணைப்புக்குழு',
  'தியாக தீபம் திலீபன் அவர்கள் முன்வைத்த 5 அம்சக் கோரிக்கைகள் மற்றும் அவரது தியாக மரணம் உலகத் தமிழர்களிடையே ஏற்படுத்திய விழிப்புணர்வை ஆவணப்படுத்தும் நூல்.',
  150,
  10,
  '/images/books/book-19.webp',
  '/images/books/book-19.webp',
  'book-19.webp',
  'published',
  19,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.books (
  id, title, slug, author, description, price, stock,
  cover_front, cover_image_url, cover_image_path, status, sort_order, is_featured
) VALUES (
  'b0000000-0000-0000-0000-000000000020',
  'மேதகு களஞ்சிய ஆவணக் குறிப்புகள்',
  'methagu-kalanjiyam-aavanam',
  'மேதகு களஞ்சியம் ஆசிரியர் குழு',
  'அழிந்துவிடாமல் பாதுகாக்கப்பட வேண்டிய அரிய ஆவணங்கள், வரலாற்றுச் சான்றுகள் மற்றும் தேசிய இலக்கியத் தொகுப்புகளின் சிறப்பு ஆவண நூல்.',
  120,
  10,
  '/images/books/book-10.webp',
  '/images/books/book-10.webp',
  'book-10.webp',
  'published',
  20,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  cover_front = EXCLUDED.cover_front,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

-- 2. SEED BLOG POSTS

INSERT INTO public.blog_posts (
  title, slug, excerpt, body, author, cover_image_url, cover_image_path,
  status, sort_order, published_at, seo_title, seo_description, reading_time_mins
) VALUES (
  'மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்வும் வீரமும்',
  'eelam-liberation',
  'குறி தவறாக்கணை: தமிழீழ விடுதலைப் புலிகளின் மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்க்கை மற்றும் கட்டுநாயக்கா வான்படைத்தளத் தாக்குதல் சாதனை.',
  'குறி தவறாக்கணை: தமிழீழ விடுதலைப் புலிகளின் மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்க்கை மற்றும் கட்டுநாயக்கா வான்படைத்தளத் தாக்குதல் சாதனை.',
  'சாந்தி நேசக்கரம்',
  '/images/blogs/thalapathi-vinayagam-banner.webp',
  'thalapathi-vinayagam-banner.webp',
  'published',
  1,
  '2026-08-06T00:00:00Z',
  'மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்வும் வீரமும் | மேதகு களஞ்சியம்',
  'தமிழீழ விடுதலைப் புலிகளின் மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்க்கை மற்றும் வரலாற்று ஆவணம்.',
  8
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  author = EXCLUDED.author,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

INSERT INTO public.blog_posts (
  title, slug, excerpt, body, author, cover_image_url, cover_image_path,
  status, sort_order, published_at, seo_title, seo_description, reading_time_mins
) VALUES (
  'சாந்தி நேசக்கரம் நூல்கள்: ஈழத்து இலக்கிய ஆவணப்படுத்தலின் முக்கியத்துவம்',
  'movement-structure',
  'ஈழ விடுதலைப் போராட்டத்தின் தியாகங்களையும் வீர வரலாற்றையும் எதிர்கால தலைமுறைக்குக் கடத்தும் ஆவண நூல்களின் முக்கியத்துவம்.',
  'ஈழ விடுதலைப் போராட்டத்தின் தியாகங்களையும் வீர வரலாற்றையும் எதிர்கால தலைமுறைக்குக் கடத்தும் ஆவண நூல்களின் முக்கியத்துவம்.',
  'சாந்தி நேசக்கரம்',
  '/images/blogs/saanthi-nesakaram-banner.webp',
  'saanthi-nesakaram-banner.webp',
  'published',
  2,
  '2026-08-04T00:00:00Z',
  'சாந்தி நேசக்கரம் நூல்கள்: ஈழத்து இலக்கிய ஆவணப்படுத்தல் | மேதகு களஞ்சியம்',
  'ஈழத்து இலக்கிய ஆவணப்படுத்தல் மற்றும் சாந்தி நேசக்கரம் நூல்களின் வரலாற்று ஆய்வு.',
  6
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  author = EXCLUDED.author,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

INSERT INTO public.blog_posts (
  title, slug, excerpt, body, author, cover_image_url, cover_image_path,
  status, sort_order, published_at, seo_title, seo_description, reading_time_mins
) VALUES (
  'தியாக தீபம் லெப். கேணல் திலீபன்: பன்னிரு நாள் அறப்போர்',
  'remembrance-memory',
  'ஐந்து கோரிக்கைகளை முன்வைத்து நீராகாரம் கூட அருந்தாமல் 12 நாட்கள் அஹிம்சை வழியில் உண்ணாநோன்பிருந்து வீரச்சாவடைந்த தியாக தீபத்தின் அறப்போர்.',
  'ஐந்து கோரிக்கைகளை முன்வைத்து நீராகாரம் கூட அருந்தாமல் 12 நாட்கள் அஹிம்சை வழியில் உண்ணாநோன்பிருந்து வீரச்சாவடைந்த தியாக தீபத்தின் அறப்போர்.',
  'மேதகு களஞ்சியம் ஆசிரியர் குழு',
  '/images/blogs/deelipan-hero.webp',
  'deelipan-hero.webp',
  'published',
  3,
  '2026-08-02T00:00:00Z',
  'தியாக தீபம் லெப். கேணல் திலீபன்: பன்னிரு நாள் அறப்போர் | மேதகு களஞ்சியம்',
  'தியாக தீபம் திலீபன் அவர்களின் வரலாற்றுப் புகழ்மிக்க உண்ணாநோன்பு அறப்போர் ஆவணம்.',
  10
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  author = EXCLUDED.author,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

INSERT INTO public.blog_posts (
  title, slug, excerpt, body, author, cover_image_url, cover_image_path,
  status, sort_order, published_at, seo_title, seo_description, reading_time_mins
) VALUES (
  'கண்டேன் கண்டேன் தலைவரைக் கண்டேன்: உன்னதமான நினைவுகள்',
  'archives-overview',
  'தேசியத் தலைவருடனான நேர்மையான நினைவுகளையும், வரலாற்றுச் சம்பவங்களையும் விவரிக்கும் சிறப்பு ஆவண நூல் அறிமுகம்.',
  'தேசியத் தலைவருடனான நேர்மையான நினைவுகளையும், வரலாற்றுச் சம்பவங்களையும் விவரிக்கும் சிறப்பு ஆவண நூல் அறிமுகம்.',
  'மேதகு களஞ்சியம்',
  '/images/blogs/kanden-kanden-banner.webp',
  'kanden-kanden-banner.webp',
  'published',
  4,
  '2026-07-28T00:00:00Z',
  'கண்டேன் கண்டேன் தலைவரைக் கண்டேன் | மேதகு களஞ்சியம்',
  'தேசியத் தலைவருடனான நேரடி நினைவுகள் மற்றும் வரலாற்றுச் சம்பவங்களின் ஆவணம்.',
  7
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  author = EXCLUDED.author,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

INSERT INTO public.blog_posts (
  title, slug, excerpt, body, author, cover_image_url, cover_image_path,
  status, sort_order, published_at, seo_title, seo_description, reading_time_mins
) VALUES (
  'தேசியத் தலைவர் வே. பிரபாகரன்: ஒரு சரித்திர நாயகன்',
  'publishing-mission',
  'பழ. நெடுமாறன் அவர்கள் எழுதிய தேசியத் தலைவர் பிரபாகரன் அவர்களின் முழுமையான வரலாற்றுத் தொகுப்பு மற்றும் ஆவணப் பதிவு.',
  'பழ. நெடுமாறன் அவர்கள் எழுதிய தேசியத் தலைவர் பிரபாகரன் அவர்களின் முழுமையான வரலாற்றுத் தொகுப்பு மற்றும் ஆவணப் பதிவு.',
  'பழ. நெடுமாறன்',
  '/images/blogs/prabakaran-dad-banner.webp',
  'prabakaran-dad-banner.webp',
  'published',
  5,
  '2026-07-20T00:00:00Z',
  'தேசியத் தலைவர் வே. பிரபாகரன்: ஒரு சரித்திர நாயகன் | மேதகு களஞ்சியம்',
  'பழ. நெடுமாறன் எழுதிய வரலாற்று ஆவண நூல் குறித்த விரிவான ஆய்வு.',
  9
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  author = EXCLUDED.author,
  cover_image_url = EXCLUDED.cover_image_url,
  cover_image_path = EXCLUDED.cover_image_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- 3. SEED SUPPORTERS

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000001',
  'தீபக் ஹார்வின் (Deepak Harvin)',
  'நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்',
  'Founder & Principal Director',
  '/images/supporters/harvin.webp',
  'harvin.webp',
  'https://www.instagram.com/harvin_72',
  'published',
  1,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000002',
  'சுபி மதன் (Subi Madhan)',
  'நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்',
  'Founder & Principal Director',
  '/images/supporters/subi.webp',
  'subi.webp',
  'https://www.instagram.com/thilo.subi',
  'published',
  2,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000003',
  'பச்ச முத்து (Pacha Muthu)',
  'திட்ட நெறியாளர்',
  'Project Coordinator',
  '/images/supporters/pachamuthu.webp',
  'pachamuthu.webp',
  'https://www.instagram.com/pachamuthu_2004',
  'published',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000004',
  'ரஞ்சித் (Ranjith)',
  'களஞ்சிய மேலாண்மையாளர்',
  'Archives Manager',
  '/images/supporters/ranjith.webp',
  'ranjith.webp',
  'https://www.instagram.com/ranjith_tamileelam',
  'published',
  4,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000005',
  'மதன் (Madhan)',
  'ஆவணப் பாதுகாப்பாளர்',
  'Archival Custodian',
  '/images/supporters/madhan.webp',
  'madhan.webp',
  '',
  'published',
  5,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000006',
  'தமிழ் (Tamil)',
  'தொழில்நுட்ப ஒருங்கிணைப்பாளர்',
  'Technical Coordinator',
  '/images/supporters/tamil.webp',
  'tamil.webp',
  '',
  'published',
  6,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000007',
  'முத்து (Muthu)',
  'களப் பதிவாளர்',
  'Field Documenter',
  '/images/supporters/muthu.webp',
  'muthu.webp',
  '',
  'published',
  7,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000008',
  'ஜெகா (Jega)',
  'நூலக ஒருங்கிணைப்பாளர்',
  'Library Coordinator',
  '/images/supporters/jega.webp',
  'jega.webp',
  '',
  'published',
  8,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.supporters (
  id, name, role_ta, role_en, logo_or_photo_url, logo_or_photo_path,
  website_url, status, sort_order, is_active
) VALUES (
  's0000000-0000-0000-0000-000000000009',
  'அரவிந்த் (Aravind)',
  'ஆவண ஆய்வாளர்',
  'Archival Researcher',
  '/images/supporters/aravind.webp',
  'aravind.webp',
  '',
  'published',
  9,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role_ta = EXCLUDED.role_ta,
  role_en = EXCLUDED.role_en,
  logo_or_photo_url = EXCLUDED.logo_or_photo_url,
  logo_or_photo_path = EXCLUDED.logo_or_photo_path,
  website_url = EXCLUDED.website_url,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

-- 4. SEED VIDEOS

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000001',
  'video-1',
  'மேதகு களஞ்சியம் — அறிமுகக் காணொளி',
  'அரிய தமிழீழ தேசிய இலக்கியங்கள், வரலாற்று ஆவண நூல்கள் மற்றும் மேதகு களஞ்சியத்தின் நோக்கம் பற்றிய அறிமுகக் காணொளி.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/1.webp',
  '1.webp',
  'published',
  1,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000002',
  'video-2',
  'மேதகு களஞ்சியம் — வலைதள பயன்பாட்டு வழிகாட்டி',
  'வலைதளத்தில் நூல்களைத் தேடுதல், விவரங்களைப் படித்தல் மற்றும் சர்வதேச தபால் மூலம் நூல்களைப் பெறுவதற்கான வழிகாட்டல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fwebsite-2%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fwebsite-2%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/2.webp',
  '2.webp',
  'published',
  2,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000003',
  'video-3',
  'கண்டேன் கண்டேன் தலைவரைக் கண்டேன் — புத்தகக் காணொளி',
  'தேசியத் தலைவருடனான நேர்மையான நினைவுகளையும், வரலாற்றுச் சம்பவங்களையும் விவரிக்கும் சிறப்பு நூலின் அறிமுகக் காட்சிப்பதிவு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/3.webp',
  '3.webp',
  'published',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000004',
  'video-4',
  'தோழர் தமிழரசனின் மூன்று அறிக்கைகள் — புத்தகக் காணொளி',
  'தமிழ்நாடு விடுதலைப் படைத் தலைவர் தோழர் தமிழரசன் அவர்களின் வரலாற்று அறிக்கைகள் மற்றும் அரசியல் சிந்தனைகள் அடங்கிய நூல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FThozhar-Tamilarasan%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FThozhar-Tamilarasan%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/4.webp',
  '4.webp',
  'published',
  4,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000005',
  'video-5',
  'தமிழீழ தேசியத் தலைவர் வே.பிரபாகரன் — வரலாற்று நூல் காட்சிப்படுத்தல்',
  'தேசியத் தலைவரின் சிந்தனைகள், பிரகடனங்கள் மற்றும் வாழ்க்கை வரலாற்றை விவரிக்கும் சிறப்பு நூலின் காட்சிப்படுத்தல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%80%E0%AE%B4-%E0%AE%A4%E0%AF%87%E0%AE%9A%E0%AE%BF%E0%AE%AF%E0%AE%A4%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%B5%E0%AF%87.%E0%AE%AA%E0%AE%BF%E0%AE%B0%E0%AE%AA%E0%AE%BE%E0%AE%95%E0%AE%B0%E0%AE%A9%E0%AF%8D%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%80%E0%AE%B4-%E0%AE%A4%E0%AF%87%E0%AE%9A%E0%AE%BF%E0%AE%AF%E0%AE%A4%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%B5%E0%AF%87.%E0%AE%AA%E0%AE%BF%E0%AE%B0%E0%AE%AA%E0%AE%BE%E0%AE%95%E0%AE%B0%E0%AE%A9%E0%AF%8D%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/5.webp',
  '5.webp',
  'published',
  5,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000006',
  'video-6',
  'மேதகு களஞ்சிய புத்தக விற்பனை நிலையம் — நூல் தொகுப்பு',
  'அரசியல், வரலாறு, ஆயுதப் போராட்டம் மற்றும் தமிழ் தேசியம் சார்ந்த அரிய வெளியீடுகளின் தொகுப்பு காட்சி.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%AE%E0%AF%87%E0%AE%A4%E0%AE%95%E0%AF%81-%E0%AE%95%E0%AE%B3%E0%AE%9E%E0%AF%8D%E0%AE%9A%E0%AE%BF%E0%AE%AF-%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AE%95-%E0%AE%B5%E0%AE%BF%E0%AE%B1%E0%AF%8D%E0%AE%AA%E0%AE%A9%E0%AF%88-%E0%AE%A8%E0%AE%BF%E0%AE%B2%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%AE%E0%AF%87%E0%AE%A4%E0%AE%95%E0%AF%81-%E0%AE%95%E0%AE%B3%E0%AE%9E%E0%AF%8D%E0%AE%9A%E0%AE%BF%E0%AE%AF-%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AE%95-%E0%AE%B5%E0%AE%BF%E0%AE%B1%E0%AF%8D%E0%AE%AA%E0%AE%A9%E0%AF%88-%E0%AE%A8%E0%AE%BF%E0%AE%B2%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/6.webp',
  '6.webp',
  'published',
  6,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000007',
  'video-7',
  'மே 18 — நினைவேந்தல் ஆவணக் காணொளி',
  'தமிழீழ தேசிய நினைவேந்தல் நாள் மற்றும் மாவீரர்கள், பொதுமக்களின் தியாகங்களை நினைவுகூரும் சிறப்பு ஆவணப் பதிவு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMay-18---Memorial-Day%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMay-18---Memorial-Day%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/7.webp',
  '7.webp',
  'published',
  7,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000008',
  'video-8',
  'தலைவர் — காட்சிப்படுத்தும் புத்தகக் காணொளி',
  'தேசியத் தலைவரின் வரலாற்று ஆவண நூல்கள் மற்றும் வாழ்க்கை வரலாற்றுப் புத்தகங்களின் காட்சிப்படுத்தல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FT-H-A-L-A-I-V-A-R%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FT-H-A-L-A-I-V-A-R%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/8.webp',
  '8.webp',
  'published',
  8,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000009',
  'video-9',
  'திலீபம் — புத்தக வரலாற்று ஆவணக் காணொளி',
  'தியாக தீபம் லெப். கேணல் திலீபன் அவர்களின் உண்ணாவிரத அறப்போர் மற்றும் ''திலீபம்'' நூலின் முழு விபரம்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FDhilipam---TEVP-TEVP%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FDhilipam---TEVP-TEVP%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/9.webp',
  '9.webp',
  'published',
  9,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000010',
  'video-10',
  'யூலை 5 — கரும்புலிகள் நாள் சிறப்பு உரை & பதிவு',
  '1987 ஜூலை 5 அன்று நெல்லியடியில் கப்டன் மில்லர் நிகழ்த்திய முதல் கரும்புலித் தாக்குதலின் வரலாற்றுப் பதிவு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/10.webp',
  '10.webp',
  'published',
  10,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000011',
  'video-11',
  'யூலை 5 — கரும்புலிகள் நாள் சிறப்புத் தொகுப்பு',
  'மாவீரர் கப்டன் மில்லர் முதல் தியாக வேள்வி புரிந்த கரும்புலி மாவீரர்களின் வரலாற்று ஆவணத் தொகுப்பு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech-with-Edit%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech-with-Edit%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/11.webp',
  '11.webp',
  'published',
  11,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000012',
  'video-12',
  'கட்டுநாயக்கா தாக்குதல் — கள வரலாற்று ஆவணப் பதிவு',
  '2001 கட்டுநாயக்கா சர்வதேச விமான நிலைய வான்படைத் தளம் மீது 14 கரும்புலிகள் நடத்திய தாக்குதலின் தொகுப்பு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkattanayaka%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkattanayaka%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/12.webp',
  '12.webp',
  'published',
  12,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000013',
  'video-13',
  'குட்டிமணி — தங்கதுரை நினைவு நாள் வரலாற்றுப் பதிவு',
  'வெலிக்கடை சிறைப்படுகொலை மாவீரர்கள் தங்கதுரை, குட்டிமணி ஆகியோரின் இறுதி உரை மற்றும் வீர வரலாறு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkuttimani---thanga-durai%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkuttimani---thanga-durai%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/13.webp',
  '13.webp',
  'published',
  13,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000014',
  'video-14',
  'மீரா — முன்னேற்றப் பதிவு & வரலாற்று நூல்',
  'போராட்ட வரலாற்றின் முக்கிய நிகழ்வுகளையும் நினைவுகளையும் பதிவு செய்யும் ''மீரா'' நூல் பற்றிய அறிமுகம்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMeera%3A8?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMeera%3A8?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/14.webp',
  '14.webp',
  'published',
  14,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000015',
  'video-15',
  'பொன்னிறை — முன்னேற்றப் பதிவு & கள அனுபவம்',
  'களப் போராட்ட அனுபவங்களையும் வீர காவியங்களையும் தொகுக்கும் ''பொன்னிறை'' நூலின் ஆவணக் காட்சி.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPonnirai%3A6?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPonnirai%3A6?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/15.webp',
  '15.webp',
  'published',
  15,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000016',
  'video-16',
  'புறநானூற்று வீரன் — புத்தகக் காணொளி',
  'திருமுருகன்காளிலிங்கம் எழுதிய பெருவிற்பனை வரலாற்று ஆய்வு நூல் ''புறநானூற்று வீரன்'' அறிமுகக் காணொளி.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPurananutru-Veeran%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPurananutru-Veeran%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/16.webp',
  '16.webp',
  'published',
  16,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000017',
  'video-17',
  'வரலாற்றுத் தலைவனின் வழிகாட்டல் — புத்தகக் காணொளி',
  'தேசியத் தலைவர் பிரபாகரன் அவர்களின் போரியல் மற்றும் அரசியல் வழிகாட்டல்களை விளக்கும் ஆவண நூல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVaralaatru-Thalaivanin-valikaatal%3A0?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVaralaatru-Thalaivanin-valikaatal%3A0?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/17.webp',
  '17.webp',
  'published',
  17,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000018',
  'video-18',
  'மேதகு களஞ்சியம் — வலைதள அறிமுகமும் நூல்கள் விநியோகமும்',
  'உலகத் தமிழர்களுக்கு அரிய தேசிய இலக்கியங்களை தபால் வழியாக பாதுகாப்பாக கொண்டு சேர்க்கும் மேதகு களஞ்சியத்தின் சேவை.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FWebsite%3A27?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FWebsite%3A27?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/18.webp',
  '18.webp',
  'published',
  18,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000019',
  'video-19',
  'விநாயகம் மற்றும் பொட்டு அம்மான் — வரலாற்று ஆவணப் புத்தகம்',
  'விடுதலைப் புலிகளின் உளவுத்துறை மற்றும் சிறப்புப் படை நடவடிக்கைகளின் வரலாற்றுப் பதிவுகள் கொண்ட நூல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVinayagam-and-pottu-amman%3A9?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVinayagam-and-pottu-amman%3A9?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/19.webp',
  '19.webp',
  'published',
  19,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000020',
  'video-20',
  'புறநானூறு 2 — புத்தகக் காணொளி',
  'சங்க இலக்கிய வீரமும் சமகால விடுதலைப் போரின் தியாகங்களும் இணைந்த வரலாற்றுத் தொடர் நூல்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fpurananuru-2%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fpurananuru-2%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/20.webp',
  '20.webp',
  'published',
  20,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000021',
  'video-21',
  'நெஞ்சுரம் — வரலாற்று ஆவணப் புத்தகக் காணொளி',
  'துளசிச்செல்வன் எழுதிய கள அனுபவ ஆவணப் புத்தகம் ''நெஞ்சுரம்'' நூலின் சிறப்பு அறிமுகக் காட்சிப்பதிவு.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fnenjuram%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fnenjuram%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/21.webp',
  '21.webp',
  'published',
  21,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000022',
  'video-22',
  'தளபதி விநாயகம் — வரலாற்று ஆவணப் புத்தகம் பகுதி 1',
  'களமுனைகளில் தளபதி விநாயகம் அவர்களின் போர்த்திறன் மற்றும் தியாகங்களை விளக்கும் வரலாற்று ஆவணம்.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/22.webp',
  '22.webp',
  'published',
  22,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.videos (
  id, slug, title, description, embed_url, video_url, poster_url, poster_path,
  status, sort_order, is_active
) VALUES (
  'v0000000-0000-0000-0000-000000000023',
  'video-23',
  'தளபதி விநாயகம் — வரலாற்று ஆவணக் காணொளி பகுதி 2',
  'தளபதி விநாயகம் அவர்களின் இறுதிப் போர் நடவடிக்கைகள் மற்றும் ஈகத்தை ஆவணப்படுத்தும் பகுதி 2.',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam1%3A7?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  'https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam1%3A7?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln',
  '/images/video-posters/23.webp',
  '23.webp',
  'published',
  23,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  embed_url = EXCLUDED.embed_url,
  video_url = EXCLUDED.video_url,
  poster_url = EXCLUDED.poster_url,
  poster_path = EXCLUDED.poster_path,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order;
