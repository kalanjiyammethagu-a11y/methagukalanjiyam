# Proposed Database Schema (Suggestion Only)

> **Important:** This document is an architectural suggestion for future Supabase/PostgreSQL schema configuration. It has not been applied to any live database.

```sql
-- 1. Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  author TEXT NOT NULL,
  author_en TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10, 2) CHECK (discount_price >= 0),
  category_ta TEXT NOT NULL,
  category_en TEXT NOT NULL,
  category_slug TEXT NOT NULL CHECK (category_slug IN ('history', 'memoirs', 'archives', 'biographies', 'political')),
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  year TEXT,
  pages INTEGER,
  publisher TEXT DEFAULT 'மேதகு களஞ்சியம்',
  publisher_en TEXT DEFAULT 'Methagu Kalanjiyam',
  description_ta TEXT NOT NULL,
  description_en TEXT NOT NULL,
  quote_ta TEXT,
  quote_en TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for instant slug lookup and category filtering
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books (slug);
CREATE INDEX IF NOT EXISTS idx_books_category_slug ON public.books (category_slug);

-- 2. Articles / Blogs Table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ta TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_ta TEXT,
  subtitle_en TEXT,
  cover_image TEXT NOT NULL,
  category_ta TEXT NOT NULL,
  category_en TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL DEFAULT 5,
  author_ta TEXT NOT NULL DEFAULT 'சாந்தி நேசக்கரம்',
  author_en TEXT NOT NULL DEFAULT 'Saanthi Nesakaram',
  html_content_ta TEXT NOT NULL,
  html_content_en TEXT,
  related_book_slugs JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles (slug);
```
