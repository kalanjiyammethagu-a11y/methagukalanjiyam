# SPEC.md — Methagu Kalanjiyam Platform Rebuild

> **Status: FINALIZED**
> **Version:** 1.0
> **Date:** 2026-10-17
> **Project:** methagukalanjiyam.in → Next.js + Supabase + Cloudflare

---

## 1. Executive Summary

Transform the existing static HTML/Firebase bookstore into a modern, enterprise-grade e-commerce platform for rare Tamil national literature. The rebuild targets sub-second page loads, Apple-inspired glassmorphic aesthetics, bilingual Tamil/English UI, advanced full-text book search, an enterprise admin panel, Razorpay payments, and multi-courier tracking.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | SSR, SSG, Server Actions, RSC |
| **Language** | TypeScript 5.x | Type safety across the entire stack |
| **Database** | Supabase (PostgreSQL 15) | Relational data, RLS, Realtime |
| **Auth** | Supabase Auth | Email/password, phone OTP, Google OAuth |
| **Storage** | Cloudflare R2 | Book cover images, feed media |
| **Image Pipeline** | Sharp (server-side) | Auto-compress uploads to WebP/AVIF |
| **Hosting** | Cloudflare Pages | Edge deployment, global CDN |
| **CSS** | Tailwind CSS v4 | Glassmorphic design system |
| **Payments** | Razorpay (test mode → live) | INR payments, webhooks |
| **Search** | PostgreSQL `tsvector` + `pg_trgm` | Full-text + fuzzy Tamil/English search |
| **i18n** | next-intl | Bilingual Tamil (ta) / English (en) |
| **Rich Text** | Tiptap v2 | Admin feed editor with book picker |
| **Email** | Supabase Edge Functions + Resend | Order confirmations, dispatch alerts |
| **Analytics** | PostgreSQL materialized views | Monthly revenue, order trends |
| **Courier APIs** | India Post / ST Courier / Professional Courier | Tracking URLs + status polling |

### Supabase Plan Constraints (Free Tier)
- Database: 500 MB
- Storage: 1 GB (overflow to Cloudflare R2)
- Edge Functions: 500K invocations/month
- Realtime: 200 concurrent connections
- Strategy: Store images on Cloudflare R2 to preserve Supabase storage for DB

---

## 3. Design Philosophy

### 3.1 Visual Language
- **Inspiration:** Apple.com product pages × Kinokuniya × Fully Booked Manila
- **Core aesthetic:** Glassmorphism — frosted glass panels, layered depth, subtle transparency
- **Color system:**
  ```
  --glass:        rgba(255, 255, 255, 0.08)
  --glass-border: rgba(255, 255, 255, 0.12)
  --glass-blur:   saturate(180%) blur(20px)
  --surface:      #FAFAF9       (warm off-white)
  --surface-alt:  #F5F3EF       (parchment tint)
  --ink:          #1A1A1A       (near-black)
  --ink-muted:    #6B6B6B       (secondary text)
  --accent:       #0A6847       (deep Tamil green)
  --accent-light: #E8F5E9       (green tint)
  --gold:         #B8860B       (price/rating accent)
  --error:        #D32F2F
  --success:      #2E7D32
  ```
- **Typography:**
  - Display/Headings: `"Fraunces"` (serif, variable weight)
  - Body/UI: `"Inter"` (sans-serif, variable)
  - Tamil: `"Noto Sans Tamil"` (fallback for Tamil script rendering)
- **Motion:** 60fps spring transitions, parallax book covers, staggered grid reveals
- **Dark mode:** Full dark mode with inverted glass effects (phase 2)

### 3.2 UX Principles
1. **3-tap purchase:** Browse → Add to Cart → Checkout (logged-in users)
2. **Search-first:** Prominent search bar on every page; results as-you-type
3. **Mobile-first:** 70%+ traffic is mobile; design for 375px first, scale up
4. **Tamil-native:** All user-facing strings available in Tamil with one-tap toggle
5. **Zero dead ends:** Every empty state has a CTA (empty cart → "Browse Books")

---

## 4. Information Architecture

### 4.1 Public Pages (Customer-Facing)

```
/                           → Homepage (hero, featured, categories, testimonials)
/books                      → Book catalog (search, filter, sort, paginated grid)
/books/[slug]               → Book detail (covers, description, reviews, related)
/cart                       → Shopping cart (quantity controls, price summary)
/checkout                   → Multi-step checkout (address, payment, confirmation)
/account                    → Account hub (profile, addresses)
/account/orders             → Order history with tracking
/account/orders/[id]        → Order detail with courier tracking widget
/account/addresses          → Saved addresses CRUD
/blog                       → Blog archive (search, keyword/tag filter, featured)
/blog/[slug]                → Blog article reader (gallery, keywords, related books)
/feeds                      → News & documentary feed listing
/feeds/[slug]               → Individual feed article reader
/videos                     → Video archive gallery
/supporters                 → Patrons showcase
/certificate                → Organization certificate
/privacy                    → Privacy policy
/terms                      → Terms and conditions
/login                      → Auth page (login + register tabs)
```

### 4.2 Admin Pages (Protected)

```
/admin                      → Dashboard (KPIs, recent orders, quick actions)
/admin/books                → Book management (table, search, bulk actions)
/admin/books/new            → Create book form
/admin/books/[id]/edit      → Edit book form
/admin/categories           → Category CRUD (Tamil name, English slug)
/admin/orders               → Order management (status, tracking, filters)
/admin/orders/[id]          → Order detail (items, address, tracking, notes)
/admin/blog                 → Blog post management (status, keywords, views)
/admin/blog/new             → Create blog (Tiptap + image gallery + keywords + book picker)
/admin/blog/[id]/edit       → Edit blog post
/admin/feeds                → Feed management with rich text editor
/admin/feeds/new            → Create feed (Tiptap editor + book picker)
/admin/feeds/[id]/edit      → Edit feed
/admin/analytics            → Monthly reports, revenue charts, CSV export
/admin/users                → Customer list, order history per user
/admin/settings             → Site settings, courier preferences, Razorpay config
```

---

## 5. Database Schema (Supabase PostgreSQL)

### 5.1 Core Tables

```sql
-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url    TEXT,
  locale        TEXT NOT NULL DEFAULT 'ta' CHECK (locale IN ('ta', 'en')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CATEGORIES (dynamic admin-managed)
-- ============================================================
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ta       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  book_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  author        TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10,2) CHECK (discount_price IS NULL OR discount_price >= 0),
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_in_stock   BOOLEAN GENERATED ALWAYS AS (stock > 0) STORED,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  cover_front   TEXT,
  cover_back    TEXT,
  isbn          TEXT,
  pages         INT,
  publisher     TEXT,
  published_year INT,
  weight_grams  INT,
  tags          TEXT[] DEFAULT '{}',
  transliteration_keywords TEXT[] DEFAULT '{}',    -- Tanglish / Latin transliterations (e.g., ['Velupillai', 'Varalaru'])
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(transliteration_keywords, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED,
  sort_order    INT NOT NULL DEFAULT 0,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  view_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_search ON books USING GIN (search_vector);
CREATE INDEX idx_books_category ON books (category_id);
CREATE INDEX idx_books_slug ON books (slug);
CREATE INDEX idx_books_featured ON books (is_featured) WHERE is_featured = true;
CREATE INDEX idx_books_translit ON books USING GIN (transliteration_keywords);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);
CREATE INDEX idx_books_author_trgm ON books USING GIN (author gin_trgm_ops);

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home',
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  house_name    TEXT NOT NULL,
  street        TEXT,
  landmark      TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  pincode       TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'India',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned'
);
CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'failed', 'refunded'
);
CREATE TYPE courier_provider AS ENUM (
  'india_post', 'st_courier', 'professional_courier'
);

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT NOT NULL UNIQUE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for guest checkouts
  is_guest_checkout BOOLEAN NOT NULL DEFAULT false,
  guest_phone     TEXT,
  guest_email     TEXT,
  stock_reserved_until TIMESTAMPTZ,                -- Concurrency hold during payment
  subtotal        NUMERIC(10,2) NOT NULL,
  shipping_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  status          order_status NOT NULL DEFAULT 'pending',
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  shipping_address JSONB NOT NULL,
  courier         courier_provider,
  tracking_number TEXT,
  tracking_url    TEXT,
  dispatched_at   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  customer_notes  TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);
CREATE INDEX idx_orders_number ON orders (order_number);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  line_total    NUMERIC(10,2) NOT NULL,
  cover_url     TEXT
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ============================================================
-- CART (server-side, per-user)
-- ============================================================
CREATE TABLE cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX idx_cart_user ON cart_items (user_id);

-- ============================================================
-- UNIFIED PUBLICATIONS (Articles & News/Feed Updates)
-- ============================================================
CREATE TABLE blogs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type         TEXT NOT NULL DEFAULT 'article' CHECK (post_type IN ('article', 'feed_update')),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  excerpt           TEXT,
  content           JSONB NOT NULL,                   -- Tiptap rich text JSON document
  cover_image       TEXT NOT NULL,                    -- Cloudflare R2 URL (auto WebP)
  gallery_images    TEXT[] DEFAULT '{}',              -- Cloudflare R2 URLs (multi-image support)
  keywords          TEXT[] DEFAULT '{}',              -- Keyword tags (e.g., ['வரலாறு', 'ஈழம்', 'நாவல்'])
  transliteration_keywords TEXT[] DEFAULT '{}',       -- Tanglish keywords for search
  author_id         UUID REFERENCES profiles(id),
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  reading_time_mins INT NOT NULL DEFAULT 5,
  view_count        INT NOT NULL DEFAULT 0,
  meta_title        TEXT,
  meta_description  TEXT,
  
  -- Search vector for full-text search
  search_vector     TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(keywords, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(transliteration_keywords, ' '), '')), 'B')
  ) STORED,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blogs_published ON blogs (is_published, published_at DESC);
CREATE INDEX idx_blogs_post_type ON blogs (post_type);
CREATE INDEX idx_blogs_slug ON blogs (slug);
CREATE INDEX idx_blogs_keywords ON blogs USING GIN (keywords);
CREATE INDEX idx_blogs_search ON blogs USING GIN (search_vector);
CREATE INDEX idx_blogs_title_trgm ON blogs USING GIN (title gin_trgm_ops);

-- ============================================================
-- BLOG ↔ BOOK tags (promote store books inside blog posts)
-- ============================================================
CREATE TABLE blog_books (
  blog_id       UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, book_id)
);

CREATE INDEX idx_blog_books_blog ON blog_books (blog_id);
CREATE INDEX idx_blog_books_book ON blog_books (book_id);

-- ============================================================
-- SUPPORTERS
-- ============================================================
CREATE TABLE supporters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TABLE videos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  embed_url     TEXT NOT NULL,
  poster_url    TEXT,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SITE SETTINGS (key-value config)
-- ============================================================
CREATE TABLE site_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.2 Row Level Security (RLS)

```sql
-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Books: public read; admin write
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Admin write books" ON books FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: user reads own; admin reads all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User creates own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manages orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cart: user manages own
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Categories: public read; admin write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Addresses: user manages own
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Blogs: public read published; admin manage all
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published blogs" ON blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Admin manage blogs" ON blogs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Blog Books: public read; admin manage
ALTER TABLE blog_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blog_books" ON blog_books FOR SELECT USING (true);
CREATE POLICY "Admin manage blog_books" ON blog_books FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 5.3 Database Functions & Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate order_number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'MK-' || upper(substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-generate tracking URL from courier + tracking_number
CREATE OR REPLACE FUNCTION generate_tracking_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NOT NULL AND NEW.courier IS NOT NULL THEN
    CASE NEW.courier
      WHEN 'india_post' THEN
        NEW.tracking_url = 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ConsignmentNo=' || NEW.tracking_number;
      WHEN 'st_courier' THEN
        NEW.tracking_url = 'https://www.stcourier.com/track-your-shipment?awb=' || NEW.tracking_number;
      WHEN 'professional_courier' THEN
        NEW.tracking_url = 'https://www.tpcindia.com/track-consignment-detail.aspx?id=' || NEW.tracking_number;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracking_url BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_url();

-- Decrement stock on order confirmation
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE books SET stock = stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND books.id = oi.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();

-- Atomic Stock Reservation with Row Locking (Prevents Concurrency Over-Selling)
CREATE OR REPLACE FUNCTION reserve_stock_for_checkout(
  order_book_items JSONB, -- Array of objects: [{"book_id": "...", "quantity": 1}]
  hold_duration_minutes INT DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  current_stock INT;
  book_title TEXT;
BEGIN
  -- Lock the book rows atomically in deterministic order to prevent deadlocks
  FOR item IN 
    SELECT * FROM jsonb_to_recordset(order_book_items) AS x(book_id UUID, quantity INT)
    ORDER BY book_id
  LOOP
    SELECT stock, title INTO current_stock, book_title
    FROM books
    WHERE id = item.book_id
    FOR UPDATE;

    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'BOOK_NOT_FOUND: Book ID % does not exist', item.book_id;
    END IF;

    IF current_stock < item.quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: "%" has only % copies left (requested %)', book_title, current_stock, item.quantity;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'reserved_until', now() + (hold_duration_minutes || ' minutes')::interval
  );
END;
$$ LANGUAGE plpgsql;

-- Update category book_count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE categories SET book_count = (
      SELECT count(*) FROM books WHERE category_id = NEW.category_id
    ) WHERE id = NEW.category_id;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE categories SET book_count = (
      SELECT count(*) FROM books WHERE category_id = OLD.category_id
    ) WHERE id = OLD.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_category_count AFTER INSERT OR UPDATE OR DELETE ON books
  FOR EACH ROW EXECUTE FUNCTION update_category_count();

-- Book search function (full-text + fuzzy + ranking)
CREATE OR REPLACE FUNCTION search_books(
  search_query TEXT,
  category_slug TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT false,
  sort_by TEXT DEFAULT 'relevance',
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, author TEXT, price NUMERIC,
  discount_price NUMERIC, stock INT, is_in_stock BOOLEAN,
  cover_front TEXT, category_name TEXT, relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id, b.title, b.slug, b.author, b.price,
    b.discount_price, b.stock, b.is_in_stock,
    b.cover_front,
    c.name_ta AS category_name,
    CASE
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        ts_rank(b.search_vector, websearch_to_tsquery('simple', search_query)) +
        similarity(b.title, search_query) * 0.5
      ELSE 1.0
    END::REAL AS relevance
  FROM books b
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE
    (search_query IS NULL OR search_query = '' OR
      b.search_vector @@ websearch_to_tsquery('simple', search_query) OR
      similarity(b.title, search_query) > 0.15 OR
      similarity(b.author, search_query) > 0.15)
    AND (category_slug IS NULL OR c.slug = category_slug)
    AND (min_price IS NULL OR b.price >= min_price)
    AND (max_price IS NULL OR b.price <= max_price)
    AND (NOT in_stock_only OR b.stock > 0)
  ORDER BY
    CASE sort_by
      WHEN 'relevance' THEN NULL
      WHEN 'price_asc' THEN b.price
      WHEN 'newest' THEN NULL
    END ASC NULLS LAST,
    CASE sort_by
      WHEN 'price_desc' THEN b.price
    END DESC NULLS LAST,
    CASE sort_by
      WHEN 'newest' THEN b.created_at
    END DESC NULLS LAST,
    relevance DESC,
    b.sort_order ASC
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Analytics: Monthly summary materialized view
CREATE MATERIALIZED VIEW monthly_analytics AS
SELECT
  date_trunc('month', o.created_at) AS month,
  count(*) AS total_orders,
  count(*) FILTER (WHERE o.status = 'pending') AS pending_orders,
  count(*) FILTER (WHERE o.status = 'dispatched' OR o.status = 'in_transit') AS in_transit_orders,
  count(*) FILTER (WHERE o.status = 'delivered') AS delivered_orders,
  count(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
  sum(o.total_amount) FILTER (WHERE o.payment_status = 'paid') AS total_revenue,
  sum(o.total_amount) FILTER (WHERE o.payment_status = 'pending') AS pending_revenue,
  count(DISTINCT o.user_id) AS unique_customers
FROM orders o
GROUP BY date_trunc('month', o.created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX idx_monthly_analytics ON monthly_analytics (month);

-- Blog search function with query and keyword filtering
CREATE OR REPLACE FUNCTION search_blogs(
  search_query TEXT DEFAULT NULL,
  filter_keyword TEXT DEFAULT NULL,
  page_size INT DEFAULT 12,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, excerpt TEXT, cover_image TEXT,
  gallery_images TEXT[], keywords TEXT[], reading_time_mins INT,
  published_at TIMESTAMPTZ, view_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id, b.title, b.slug, b.excerpt, b.cover_image,
    b.gallery_images, b.keywords, b.reading_time_mins,
    b.published_at, b.view_count
  FROM blogs b
  WHERE b.is_published = true
    AND (filter_keyword IS NULL OR filter_keyword = ANY(b.keywords))
    AND (search_query IS NULL OR search_query = '' OR
         b.search_vector @@ websearch_to_tsquery('simple', search_query) OR
         similarity(b.title, search_query) > 0.15)
  ORDER BY b.published_at DESC NULLS LAST
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Get related blogs based on overlapping keywords
CREATE OR REPLACE FUNCTION get_related_blogs(
  current_blog_id UUID,
  post_keywords TEXT[],
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, cover_image TEXT,
  keywords TEXT[], published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.cover_image, b.keywords, b.published_at
  FROM blogs b
  WHERE b.id != current_blog_id
    AND b.is_published = true
    AND b.keywords && post_keywords
  ORDER BY cardinality(ARRAY(SELECT unnest(b.keywords) INTERSECT SELECT unnest(post_keywords))) DESC,
           b.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. API Design

### 6.1 Next.js Server Actions (App Router)

```
// Books
actions/books.ts
  → searchBooks(query, filters, pagination)
  → getBookBySlug(slug)
  → getFeaturedBooks()
  → getBooksByCategory(categorySlug)
  → createBook(formData)        [admin]
  → updateBook(id, formData)    [admin]
  → toggleBookStock(id)         [admin]
  → deleteBook(id)              [admin]

// Cart
actions/cart.ts
  → getCart()
  → addToCart(bookId, quantity)
  → updateCartQuantity(itemId, quantity)
  → removeFromCart(itemId)
  → clearCart()

// Orders
actions/orders.ts
  → createOrder(addressId, notes)
  → getUserOrders(pagination)
  → getOrderDetail(orderId)
  → updateOrderStatus(orderId, status)       [admin]
  → setOrderTracking(orderId, courier, awb)  [admin]
  → getAllOrders(filters, pagination)         [admin]
  → exportOrdersCsv(month, year)             [admin]

// Categories
actions/categories.ts
  → getCategories()
  → createCategory(nameTa, nameEn, slug)     [admin]
  → updateCategory(id, data)                 [admin]
  → deleteCategory(id)                       [admin]

// Addresses
actions/addresses.ts
  → getUserAddresses()
  → createAddress(data)
  → updateAddress(id, data)
  → deleteAddress(id)
  → setDefaultAddress(id)

// Auth
actions/auth.ts
  → signUp(email, password, name, phone)
  → signIn(email, password)
  → signOut()
  → getSession()

// Feeds
actions/feeds.ts
  → getPublishedFeeds(pagination)
  → getFeedBySlug(slug)
  → createFeed(data)                         [admin]
  → updateFeed(id, data)                     [admin]
  → deleteFeed(id)                           [admin]

// Blogs (with Images & Keywords)
actions/blog.ts
  → getPublishedBlogs(query, keyword, pagination)
  → getBlogBySlug(slug)
  → getRelatedBlogs(id, keywords)
  → getAllKeywords()
  → createBlog(formData)                     [admin]
  → updateBlog(id, formData)                 [admin]
  → deleteBlog(id)                           [admin]
  → toggleBlogPublish(id)                    [admin]

// Analytics
actions/analytics.ts
  → getMonthlyAnalytics(month?, year?)       [admin]
  → getDashboardKPIs()                       [admin]
  → refreshAnalytics()                       [admin]
```

### 6.2 API Routes (for webhooks & external integrations)

```
app/api/razorpay/create-order/route.ts    → Create Razorpay order
app/api/razorpay/verify/route.ts          → Verify payment signature
app/api/razorpay/webhook/route.ts         → Handle Razorpay webhooks
app/api/upload/route.ts                   → Upload images to Cloudflare R2
app/api/cron/refresh-analytics/route.ts   → Scheduled analytics refresh
```

---

## 7. Feature Specifications

### 7.1 Book Search Engine

**Requirements:**
1. Instant search: results appear as user types (debounced 250ms)
2. Multi-field: search across title, author, description simultaneously
3. Weighted ranking: title matches rank highest, then author, then description
4. Tamil support: PostgreSQL `simple` dictionary handles Tamil Unicode correctly
5. Fuzzy matching: `pg_trgm` catches typos and partial matches (similarity > 0.15)
6. Faceted filters: Category, price range, stock availability
7. Sort options: Relevance, Price (low→high), Price (high→low), Newest
8. URL-synced: all search/filter state reflected in URL query params for shareability

**Search UX:**
- Floating search bar (Apple Spotlight-style) on desktop, full-screen on mobile
- Category pills as quick filters below the search input
- Skeleton loading states during search
- "No results" state with related suggestions

### 7.2 Shopping Cart

**Architecture:**
- **Logged-in users:** Server-side cart in `cart_items` table (survives device switches)
- **Guest users:** `localStorage` cart, merged on login
- **Optimistic UI:** Cart updates instantly, syncs to server in background
- **Stock validation:** Re-verify stock on checkout, show warnings for out-of-stock items

### 7.3 Checkout & Payments (Razorpay)

**Flow:**
1. User reviews cart → clicks "Proceed to Checkout"
2. Login gate (if not authenticated)
3. Address selection (or create new)
4. Order summary with stock/price re-verification
5. Razorpay payment modal opens
6. On success: verify signature server-side → create order → decrement stock
7. Confirmation page with order number
8. WhatsApp order notification sent to admin

**Razorpay Integration:**
- Server-side order creation via `razorpay` Node SDK
- Client-side Checkout.js for payment modal
- Webhook handler for async payment confirmations
- Test mode keys during development, switchable via env vars

### 7.4 Courier Tracking

**Supported Couriers:**

| Courier | Tracking URL Template | Status Polling |
|---------|----------------------|----------------|
| India Post | `indiapost.gov.in/...?ConsignmentNo={AWB}` | Manual check link |
| ST Courier | `stcourier.com/track-your-shipment?awb={AWB}` | Manual check link |
| Professional Courier | `tpcindia.com/track-consignment-detail.aspx?id={AWB}` | Manual check link |

**Admin Workflow:**
1. Order dispatched → Admin enters AWB number
2. Selects courier via 3 radio buttons
3. `tracking_url` auto-generated by database trigger
4. Customer sees tracking link on "My Orders" page
5. WhatsApp dispatch alert includes direct tracking link

### 7.5 Admin Dashboard

**Dashboard KPIs (real-time via Supabase Realtime):**
- Total orders (today / this month)
- Revenue (today / this month)
- Pending dispatches count (highlighted if > 0)
- Low stock alerts (books with stock < 3)
- New customers this week

**Book Management:**
- Sortable/searchable data table with inline actions
- **Fast Stock Toggle:** Single-click `[In Stock ✓]` / `[Sold Out ✗]` toggle
- Image upload: drag-and-drop or file picker → auto-compress to WebP via Sharp → upload to R2
- Category dropdown dynamically populated from `categories` table

**Category Management:**
- Full CRUD: Create (Tamil name + English slug), Edit, Delete
- Delete protection: cannot delete categories with associated books
- Sort order via drag-and-drop reordering

**Order Management:**
- Status pipeline: Pending → Confirmed → Dispatched → In Transit → Delivered
- Inline tracking input: AWB field + courier radio buttons
- Batch status updates (select multiple → change status)
- Order detail: full item list, address, payment info, admin notes

**Feed Editor:**
- Tiptap v2 rich text editor (headings, bold, italic, images, links, lists)
- **Book picker dropdown:** Tag relevant books in a feed article
- Image upload within editor → R2
- Preview mode before publishing
- Draft/Published toggle

**Analytics & Reporting:**
- Monthly summary cards: orders, revenue, pending dispatches
- Line chart: daily order volume over 30 days
- Month/date range picker for historical data
- **Export to CSV:** Single-click download of filtered order data
- Top-selling books table

### 7.6 Blog System with Multi-Image Gallery & Keyword Taxonomy Engine

**Architecture & Features:**
1. **Multi-Image Support:**
   - Primary cover hero image + supplementary gallery images (array of URLs).
   - In-editor inline image insertion + thumbnail carousel/lightbox reader.
   - Upload pipeline: Sharp compresses files to WebP (85% quality, strip metadata) before streaming to Cloudflare R2.
2. **Keyword & Tag Taxonomy:**
   - Stored as PostgreSQL `TEXT[]` with GIN indexing for fast array containment (`@>`) and overlap (`&&`) operations.
   - Admin UI: interactive tag-chips input with autocomplete, suggestions, and duplicate prevention.
   - Customer UI: clickable keyword pills on blog cards; tag cloud on `/blog` page; click any keyword to filter articles instantly.
   - **Related Articles Engine:** Database function `get_related_blogs` scores related posts by calculating the intersection cardinality of the keywords array.
3. **Product Cross-Selling:**
   - Tag related bookstore books directly inside the blog post via `blog_books`.
   - Reader renders a frosted glass "Featured Books in this Article" card with direct single-click "Add to Cart".
4. **SEO & Social Optimization:**
   - Dynamic meta tags, OpenGraph images, and JSON-LD `Article` structured data including `keywords` list.
   - Reading time estimation (auto-calculated from word count: ~200 wpm).

### 7.7 Internationalization (i18n)

**Implementation:** `next-intl` with JSON message files

```
messages/
  ta.json        → Tamil translations
  en.json        → English translations
```

**Scope:**
- All UI chrome (buttons, labels, navigation, toasts, error messages)
- Book content stays in original language (Tamil)
- Language toggle persisted in user profile (logged in) or cookie (guest)
- Default: Tamil (`ta`)

---

## 8. Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 1.2s | SSR hero, responsive `<Image>`, preload critical assets |
| FID | < 50ms | Server Components, minimal client JS |
| CLS | < 0.05 | Fixed image dimensions, skeleton loaders |
| TTFB | < 200ms | Cloudflare edge, ISR with 60s revalidation |
| Bundle | < 150KB gzipped | Code splitting, dynamic imports, tree shaking |
| Images | WebP/AVIF, responsive srcset | Sharp pipeline, Cloudflare image transforms |

---

## 9. Security Requirements

1. **Authentication:** Supabase Auth with email confirmation, rate limiting
2. **Authorization:** Row Level Security on all tables; admin checks via `profiles.role`
3. **Input Sanitization:** DOMPurify for rich text, Zod validation for all forms
4. **CSRF:** Next.js built-in CSRF protection for Server Actions
5. **Payment Security:** Razorpay signature verification server-side; no amount on client
6. **Image Upload:** File type validation, max size 5MB, virus scan via Cloudflare
7. **Rate Limiting:** API routes protected with token bucket (Cloudflare Workers)
8. **Secrets:** All API keys in environment variables, never client-exposed
9. **Headers:** Strict CSP, HSTS, X-Frame-Options via `next.config.js`

---

## 10. Migration Plan (Firebase → Supabase)

### 10.1 Data Migration
1. Export Firestore `books` collection → JSON → transform → SQL INSERT
2. Export Firestore `users` → create Supabase Auth users + profiles
3. Export Firestore `orders` → transform to new schema → SQL INSERT
4. Migrate images from Firebase Storage → Cloudflare R2

### 10.2 DNS Cutover
1. Build and test on `staging.methagukalanjiyam.in`
2. Run both old and new in parallel for 48 hours
3. Switch CNAME to Cloudflare Pages
4. Redirect old paths (`/book.html?id=X` → `/books/slug`)

---

## 11. Project Directory Structure

```
methagu-kalanjiyam/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   ├── favicon.png
│   ├── logo.webp
│   ├── og-image.webp
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── (store)/
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx          # Blog catalog with keyword filters & search
│   │   │   │   └── [slug]/page.tsx   # Blog post with gallery & related books
│   │   │   ├── feeds/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── videos/page.tsx
│   │   │   ├── supporters/page.tsx
│   │   │   ├── certificate/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (account)/
│   │   │   ├── layout.tsx
│   │   │   └── account/
│   │   │       ├── page.tsx
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── addresses/page.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx          # Blog post table (status, keywords, views)
│   │   │   │   ├── new/page.tsx      # Create blog (gallery upload + keyword tags)
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── feeds/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/
│   │       ├── razorpay/
│   │       │   ├── create-order/route.ts
│   │       │   ├── verify/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── upload/route.ts
│   │       └── cron/refresh-analytics/route.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── books/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── admin/
│   │   └── i18n/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── razorpay/
│   │   ├── cloudflare/
│   │   ├── image/
│   │   ├── search/
│   │   ├── tracking/
│   │   ├── csv/
│   │   ├── validators/
│   │   └── utils.ts
│   │
│   ├── actions/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   └── messages/
│       ├── ta.json
│       └── en.json
│
├── supabase/
│   ├── migrations/
│   └── config.toml
│
└── scripts/
    ├── migrate-firebase.ts
    ├── seed-books.ts
    └── generate-types.ts
```

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=methagu-images
R2_PUBLIC_URL=https://images.methagukalanjiyam.in

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx

# App
NEXT_PUBLIC_SITE_URL=https://methagukalanjiyam.in
NEXT_PUBLIC_DEFAULT_LOCALE=ta

# WhatsApp
WHATSAPP_ADMIN_NUMBER=918248654946
```

---

## 13. Acceptance Criteria

### Must-Have (MVP)
- [ ] Homepage with hero, featured books, categories, search
- [ ] Book catalog with full-text + fuzzy search
- [ ] Book detail page with cover gallery, description, add-to-cart
- [ ] Shopping cart with quantity controls and server sync
- [ ] User auth (email/password + Google OAuth)
- [ ] Checkout with address selection and Razorpay payment
- [ ] Customer order history with tracking links
- [ ] Admin: Book CRUD with image upload + WebP compression
- [ ] Admin: Category CRUD (Tamil name + English slug)
- [ ] Admin: Fast stock toggle
- [ ] Admin: Order management with courier tracking (3 couriers + AWB)
- [ ] Admin: Monthly analytics with CSV export
- [ ] Blog system with multi-image gallery & keyword tag filter
- [ ] Admin: Blog CRUD with image upload (WebP) & keyword manager
- [ ] Bilingual Tamil/English UI toggle
- [ ] Responsive glassmorphic design (mobile-first)
- [ ] SEO: Meta tags, Open Graph, structured data, sitemap

### Should-Have (Post-MVP)
- [ ] Admin: Feed editor with Tiptap + book picker
- [ ] Videos page with lazy-loaded embeds
- [ ] Supporters showcase
- [ ] WhatsApp dispatch notifications
- [ ] Dark mode
- [ ] Book reviews/ratings
- [ ] Wishlist functionality

### Nice-to-Have (Future)
- [ ] PWA with offline catalog browsing
- [ ] Push notifications for order updates
- [ ] AI-powered book recommendations
- [ ] Multi-language search (Tamil + English simultaneously)
- [ ] Inventory alerts via email/WhatsApp

---

*SPEC v1.0 — Finalized 2026-10-17*
