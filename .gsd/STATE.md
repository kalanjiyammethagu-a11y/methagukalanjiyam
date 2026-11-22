# STATE.md — Project State & Memory

> **Project:** Methagu Kalanjiyam (Platform Rebuild to Next.js 15 + Supabase + Cloudflare)  
> **Updated:** 2026-11-22  
> **Status:** PRODUCTION READY & HARDENED

---

## Current Position

- **Phase:** 1-12 COMPLETE ✅
- **Latest Hardening Waves Completed:**
  - **Mobile UI/UX Hardening**: 320px–430px touch optimization, 44px+ tap targets, zero iOS zoom (`text-base sm:text-sm`), safe-area insets, hero slider auto-advance and contrast calibration, video in-feed autoplay with viewport intersection detection.
  - **Cloudflare Edge Optimization**: Security headers (CSP, HSTS, X-Content-Type-Options), Turnstile bot protection, Cloudflare image pipeline & edge caching (`stale-while-revalidate`), Turnstile on login/signup forms.
  - **Backend & Database Hardening**: Full CRUD modules for categories, addresses, and books; stock restoration database triggers (`trg_restore_stock_on_cancel`), atomic server-side price recalculation (`calculateOrderSummary`).
  - **Storefront Purchasing Protocol**: Domestic orders strictly via on-site cart checkout (Razorpay UPI, Debit/Credit Cards, NetBanking); zero guest ordering; WhatsApp reserved exclusively for overseas diaspora postal inquiries.
  - **Auth Streamlining**: Removed mobile phone login from `/login` (pure email + password); instant auto sign-in on account creation (`/signup` and register tab); Resend email verification activation (`sendVerificationEmail`); Two-Factor Authentication activated for administrators (`ADMIN_2FA_ENABLED=true` via Resend OTP).
- **TypeScript Status:** `npx tsc --noEmit` — 0 errors.
- **Build Status:** `npm run build` — 47/47 routes static/dynamic compiled successfully.
- **Test Pass Rate:** 100% on all verification suites (`test-auth-rework.mjs`, `verify-backend-fixes.mjs`, `test-security.mjs`).

---

## Recent Commits

- `67b7508`: `feat(auth): remove phone login, implement auto sign-in on signup, activate Resend verification, and enable admin 2FA`
- `472d8fb`: `feat(storefront): promote in-site purchase exclusively and reserve WhatsApp for overseas orders`
- `fef226d`: `feat(backend): complete database hardening, full CRUD builder, atomic server pricing and verify zero backdoors`
- `09c693a`: `feat(cloudflare): complete edge optimization, security headers, turnstile bot defense and image caching`
- `bc27e36`: `feat(videos): optimize video player in feed with intersection observer and custom playback controls`

---

## Next Steps

1. **Deploy to Hosting / Production**: Push commits to GitHub `main` branch.
2. **Environment Variables**: Configure `RESEND_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel or Cloudflare Pages project settings.
3. **Domain & DNS**: Verify custom domain `methagukalanjiyam.in` and SSL termination.

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
