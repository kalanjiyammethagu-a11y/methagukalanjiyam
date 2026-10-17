-- ============================================================
-- 001_INITIAL_SCHEMA.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- PostgreSQL 15 / Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'paid', 'failed', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE courier_provider AS ENUM (
    'india_post', 'st_courier', 'professional_courier'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 1. PROFILES (Extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
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
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
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
-- 3. BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
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
  transliteration_keywords TEXT[] DEFAULT '{}',
  
  -- Search vector with weighted fields
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

CREATE INDEX IF NOT EXISTS idx_books_search ON books USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_books_category ON books (category_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books (slug);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_books_translit ON books USING GIN (transliteration_keywords);
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING GIN (author gin_trgm_ops);

-- ============================================================
-- 4. ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
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

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses (user_id);

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT NOT NULL UNIQUE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_guest_checkout BOOLEAN NOT NULL DEFAULT false,
  guest_phone     TEXT,
  guest_email     TEXT,
  stock_reserved_until TIMESTAMPTZ,
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

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders (order_number);

-- ============================================================
-- 6. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  line_total    NUMERIC(10,2) NOT NULL,
  cover_url     TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- ============================================================
-- 7. CART ITEMS (Server-side persistent cart)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items (user_id);

-- ============================================================
-- 8. UNIFIED PUBLICATIONS (Blogs & Feed Updates)
-- ============================================================
CREATE TABLE IF NOT EXISTS blogs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type         TEXT NOT NULL DEFAULT 'article' CHECK (post_type IN ('article', 'feed_update')),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  excerpt           TEXT,
  content           JSONB NOT NULL,
  cover_image       TEXT NOT NULL,
  gallery_images    TEXT[] DEFAULT '{}',
  keywords          TEXT[] DEFAULT '{}',
  transliteration_keywords TEXT[] DEFAULT '{}',
  author_id         UUID REFERENCES profiles(id),
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  reading_time_mins INT NOT NULL DEFAULT 5,
  view_count        INT NOT NULL DEFAULT 0,
  meta_title        TEXT,
  meta_description  TEXT,
  
  search_vector     TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(keywords, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(transliteration_keywords, ' '), '')), 'B')
  ) STORED,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_post_type ON blogs (post_type);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug);
CREATE INDEX IF NOT EXISTS idx_blogs_keywords ON blogs USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_blogs_search ON blogs USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_blogs_title_trgm ON blogs USING GIN (title gin_trgm_ops);

-- ============================================================
-- 9. BLOG ↔ BOOK TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_books (
  blog_id       UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_books_blog ON blog_books (blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_books_book ON blog_books (book_id);

-- ============================================================
-- 10. SUPPORTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS supporters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
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
-- 12. SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
