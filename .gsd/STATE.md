# STATE.md — Project State & Memory

> **Project:** Methagu Kalanjiyam (Platform Rebuild to Next.js 15 + Supabase + Cloudflare)  
> **Updated:** 2026-10-17  
> **Status:** READY FOR PHASE 1 EXECUTION  

---

## Current Position

- **Phase:** 2 (Data Layer) → COMPLETE ✅
- **SPEC Status:** `FINALIZED` (includes Blog with multi-image gallery, keyword taxonomy, Tanglish search, and atomic stock locks)
- **ROADMAP Status:** `FINALIZED` (12 phases, decomposed into actionable waves)
- **Next Phase:** Phase 3 (Auth & Profiles — Supabase Auth actions, login/register UI, profile management)

---

## Completed Phases & Waves

### Phase 2: Data Layer (Completed 2026-10-17)
- **Wave 2.1 (Database Schema & Migrations):**
  - `001_initial_schema.sql`: 12 core tables (`profiles`, `categories`, `books`, `addresses`, `orders`, `order_items`, `cart_items`, `blogs`, `blog_books`, `supporters`, `videos`, `site_settings`).
  - `002_rls_policies.sql`: Complete Row Level Security policy matrix for users and admins with security definer `is_admin()`.
  - `003_functions.sql`: `update_updated_at`, `generate_order_number`, `generate_tracking_url` (India Post, ST Courier, Professional Courier), `decrement_stock_on_order`, `reserve_stock_for_checkout` (atomic row-locking), `search_books` (Tamil/Tanglish), `search_blogs`, `get_related_blogs`, and `monthly_analytics` materialized view.
  - `004_seed_data.sql`: Seed categories, site settings, and initial books.
  - (Commit `bfc90c8`)
- **Wave 2.2 (Client Utilities & TypeScript Types):**
  - `src/types/database.ts`: Complete TypeScript types matching Supabase schema.
  - `src/lib/supabase/`: `client.ts` (browser), `server.ts` (SSR with async cookies), `admin.ts` (service role), `middleware.ts` (session refresh).
  - `src/middleware.ts`: Next.js request routing through Supabase auth.
  - `src/lib/validators/`: Zod schemas for `book.ts`, `order.ts`, `blog.ts`, `auth.ts`.
- **Empirical Validation:**
  - Production build: `npm run build` compiled all routes and middleware with code 0 in 7.8s with strict type-checking passing.

### Phase 1: Foundation (Completed 2026-10-17)
- **Wave 1.1 (Scaffold):** Next.js 15, TypeScript 5.8, Tailwind CSS v4, `@supabase/supabase-js`, `@supabase/ssr`, `sharp`, `zod`, `zustand`, `lucide-react`. (Commit `e0ec580`)
- **Wave 1.2 (Design System):** Tailwind v4 glassmorphic design tokens, `globals.css`, UI primitives (`Button`, `Badge`, `GlassPanel`, `Input`, `Skeleton`, `cn` helper). (Commit `1bf78e8`)
- **Wave 1.3 (Layout Shell):** Responsive glassmorphic `Header`, `MobileNav` drawer, `Footer` with trust badges, Apple Spotlight-style `SearchBar`, root `layout.tsx` with Google Fonts, and `page.tsx` homepage. (Commit `a7ab279`)
- **Empirical Validation:**
  - Production build: `npm run build` compiled 4/4 static pages with 0 errors (First Load JS: 106 KB).
  - Visual verification: Automated browser inspection on `http://localhost:3000` with zero console errors and full glassmorphic rendering.

---

## Architectural Decisions Locked

| Item | Decision | Note |
|------|----------|------|
| Framework | Next.js 15 (App Router, Server Actions, TypeScript) | Modern SSR/RSC |
| Database & Auth | Supabase PostgreSQL + Supabase Auth | Free tier DB, RLS security |
| Image & Hosting | Next.js Static Assets (`/public/images`) + Edge CDN | Self-contained, zero external storage dependencies |
| Image Pipeline | Sharp | Auto-compress to WebP/AVIF (85% quality) |
| CSS | Tailwind CSS v4 | Frosted glassmorphism design tokens |
| Payments | Razorpay | Test mode first, webhook verification, UPI Intent |
| Language | Full bilingual (Tamil + English) | `next-intl` with language toggle |
| Search Engine | PostgreSQL `tsvector` + `pg_trgm` | Full-text + fuzzy Tamil/Tanglish search |
| Publications Engine | Unified articles & news updates | Multi-image gallery + keyword taxonomy + book cross-linking |
| Concurrency Lock | Row-level locking (`SELECT ... FOR UPDATE`) | 10-minute stock reservation to prevent double-selling rare books |

---

## Documents & Specs

- [SPEC.md](file:///m:/Personal/Workspace/Book/.gsd/SPEC.md) — Canonical specification (Schema, RLS, APIs, Feature Specs)
- [ROADMAP.md](file:///m:/Personal/Workspace/Book/.gsd/ROADMAP.md) — 12-Phase roadmap with task breakdown
- [ARCHITECTURE.md](file:///m:/Personal/Workspace/Book/.gsd/ARCHITECTURE.md) — System topology & cognitive neural map
- [JOURNAL.md](file:///m:/Personal/Workspace/Book/.gsd/JOURNAL.md) — Empirical verification records

---

## Immediate Next Steps (Phase 2: Data Layer)

1. Create SQL migration scripts in `supabase/migrations/`:
   - `001_initial_schema.sql` (profiles, categories, books, addresses, orders, order_items, cart_items, blogs, blog_books, supporters, videos, site_settings)
   - `002_rls_policies.sql` (strict Row Level Security for customer privacy and admin access)
   - `003_functions.sql` (search_books with Tanglish support, search_blogs, get_related_blogs, reserve_stock_for_checkout, auto tracking URLs, monthly analytics)
   - `004_seed_data.sql` (import 20+ books from `data/books.json` and default categories)
2. Setup Supabase client utilities:
   - `src/lib/supabase/client.ts` (Browser client)
   - `src/lib/supabase/server.ts` (Server client with cookies)
   - `src/lib/supabase/admin.ts` (Service role client)
   - `src/types/database.ts` (TypeScript types matching schema)
