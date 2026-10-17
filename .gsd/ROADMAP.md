# ROADMAP.md — Methagu Kalanjiyam Build Roadmap

> **Version:** 1.0
> **Spec Reference:** `.gsd/SPEC.md` (Status: FINALIZED)

---

## Phase Overview

| Phase | Name | Description | Waves | Est. Files |
|-------|------|-------------|-------|-----------|
| **1** | Foundation | Next.js project scaffold, Supabase setup, design system, Tailwind config | 3 | ~25 |
| **2** | Data Layer | Database schema, migrations, RLS policies, Supabase client utilities, types | 2 | ~15 |
| **3** | Auth & Profiles | Supabase Auth integration, login/register pages, middleware, profile management | 2 | ~12 |
| **4** | Storefront Core | Homepage, book catalog, search engine, book detail pages | 3 | ~20 |
| **5** | Cart & Checkout | Cart system, address management, Razorpay payments, order creation | 3 | ~18 |
| **6** | Customer Account | Order history, order detail with tracking widget, address book | 2 | ~10 |
| **7** | Admin Foundation | Admin layout, dashboard, book CRUD, category CRUD, stock toggle | 3 | ~20 |
| **8** | Admin Orders & Tracking | Order management, courier tracking input, status pipeline | 2 | ~10 |
| **9** | Admin Analytics, Blog & Feeds | Monthly analytics, CSV export, Blog CRUD with image gallery & keywords, feed editor | 3 | ~18 |
| **10** | Storefront Blog & Content | Blog catalog with keyword filter, reader with gallery, feeds, videos, supporters, static pages | 3 | ~16 |
| **11** | i18n & Polish | Bilingual Tamil/English, SEO, performance optimization, responsive QA | 2 | ~15 |
| **12** | Migration & Deploy | Firebase data migration, Cloudflare Pages deployment, DNS cutover | 2 | ~8 |

---

## Phase 1: Foundation

**Objective:** Scaffold the Next.js 15 project with Tailwind v4 glassmorphic design system, fonts, and core layout components.

### Wave 1.1 — Project Scaffold
- [ ] Initialize Next.js 15 with App Router, TypeScript, Tailwind CSS v4
- [ ] Configure `tsconfig.json` with strict mode and path aliases (`@/`)
- [ ] Create `.env.example` with all required variables
- [ ] Install core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `sharp`, `zod`, `zustand`
- [ ] Set up `next.config.ts` with image domains, security headers, output config

### Wave 1.2 — Design System
- [ ] Download and self-host fonts (Fraunces, Inter, Noto Sans Tamil) in `public/fonts/`
- [ ] Configure `globals.css` with Tailwind v4 `@theme` block: colors, spacing, glass utilities, animations
- [ ] Build `GlassPanel` component (frosted glass card with configurable blur/opacity)
- [ ] Build `Button` component (primary, secondary, ghost, danger variants + loading state)
- [ ] Build `Input`, `Select`, `Textarea` components with floating labels
- [ ] Build `Badge` component (status badges: in stock, sold out, pending, etc.)
- [ ] Build `Skeleton` loader component (book card, text, image variants)
- [ ] Build `Toast` notification system (success, error, info with auto-dismiss)
- [ ] Build `Modal` component (centered overlay with glass background)

### Wave 1.3 — Layout Shell
- [ ] Build `Header` component (logo, nav links, search trigger, cart icon, auth menu, language toggle)
- [ ] Build `MobileNav` component (slide-out drawer with nav links)
- [ ] Build `Footer` component (links, social, copyright)
- [ ] Build `SearchBar` component (Apple Spotlight-style floating search)
- [ ] Create root `layout.tsx` (fonts, providers, metadata, header/footer)
- [ ] Create `loading.tsx` with skeleton layout

**Verification:** `npm run dev` starts clean on `localhost:3000` with header, footer, glass design tokens visible.

---

## Phase 2: Data Layer

**Objective:** Set up Supabase database schema, migrations, RLS, and TypeScript client utilities.

### Wave 2.1 — Database Setup
- [ ] Create Supabase project and configure locally with `supabase init`
- [ ] Write migration `001_initial_schema.sql` (all tables from SPEC §5.1)
- [ ] Write migration `002_rls_policies.sql` (all RLS policies from SPEC §5.2)
- [ ] Write migration `003_functions.sql` (triggers, search function, materialized view from SPEC §5.3)
- [ ] Write migration `004_seed_data.sql` (initial categories, site settings)
- [ ] Run migrations: `supabase db push`

### Wave 2.2 — Client Utilities & Types
- [ ] Create `lib/supabase/client.ts` (browser Supabase client)
- [ ] Create `lib/supabase/server.ts` (server-side Supabase client with cookies)
- [ ] Create `lib/supabase/admin.ts` (service role client for admin operations)
- [ ] Create `lib/supabase/middleware.ts` (auth refresh middleware)
- [ ] Generate TypeScript types from Supabase schema → `types/database.ts`
- [ ] Create `lib/validators/` Zod schemas for book, order, address, auth

**Verification:** Types generated. `supabase db push` succeeds. Client connects from dev environment.

---

## Phase 3: Auth & Profiles

**Objective:** Complete authentication flow with Supabase Auth, user registration, login, and profile management.

### Wave 3.1 — Auth Backend
- [ ] Create `middleware.ts` (Next.js middleware for auth session refresh)
- [ ] Create `actions/auth.ts` (signUp, signIn, signOut, getSession server actions)
- [ ] Set up Supabase Auth trigger: auto-create profile row on user signup
- [ ] Configure Google OAuth provider in Supabase dashboard

### Wave 3.2 — Auth UI
- [ ] Build `(auth)/layout.tsx` (centered glassmorphic card layout)
- [ ] Build `(auth)/login/page.tsx` (login tab with email/password, Google OAuth button)
- [ ] Add registration tab to login page (name, phone, email, password)
- [ ] Build auth guard for `(account)` and `admin` route groups
- [ ] Build `UserMenu` dropdown in Header (avatar, name, logout, admin link if admin)

**Verification:** Register new user → profile created in DB → login → session persists across refreshes → logout clears session.

---

## Phase 4: Storefront Core

**Objective:** Homepage, book catalog with search, and book detail pages.

### Wave 4.1 — Homepage
- [ ] Build hero section (animated book showcase with CTA buttons)
- [ ] Build featured books carousel (horizontal scroll, staggered animation)
- [ ] Build category grid section (glass cards with Tamil names, book counts)
- [ ] Build "Why Choose Us" section (trust badges, rare books, fast shipping)
- [ ] Wire to `actions/books.ts` (getFeaturedBooks, getCategories)

### Wave 4.2 — Book Catalog & Search
- [ ] Create `actions/books.ts` (searchBooks server action calling `search_books` DB function)
- [ ] Build `BookCard` component (cover image, title, author, price, stock badge, add-to-cart)
- [ ] Build `BookGrid` component (responsive grid with staggered reveal animation)
- [ ] Build `BookFilters` component (category pills, price range, stock toggle)
- [ ] Build `BookSearch` component (search input with debounced as-you-type results)
- [ ] Build `books/page.tsx` (search bar, filters, grid, pagination, URL-synced state)
- [ ] Build empty state and "no results" state with suggestions

### Wave 4.3 — Book Detail
- [ ] Build `books/[slug]/page.tsx` (SSR with ISR revalidation)
- [ ] Build cover image gallery (front/back toggle with zoom)
- [ ] Build book metadata section (price, stock, author, pages, publisher, category)
- [ ] Build "Add to Cart" button with quantity selector
- [ ] Build related books section (same category, random selection)
- [ ] Add structured data (JSON-LD) for Google Rich Results

**Verification:** Homepage renders with real data. Search returns results for Tamil and English queries. Book detail page shows all metadata with working add-to-cart.

---

## Phase 5: Cart & Checkout

**Objective:** Full shopping cart with server sync, address management, and Razorpay payment integration.

### Wave 5.1 — Cart System
- [ ] Create `stores/cart-store.ts` (Zustand store with localStorage for guests)
- [ ] Create `actions/cart.ts` (server-side CRUD for logged-in users)
- [ ] Create `hooks/useCart.ts` (unified cart hook: guest localStorage ↔ server sync)
- [ ] Build `CartDrawer` component (slide-out panel from right)
- [ ] Build `CartItem` component (image, title, quantity +/-, remove, line total)
- [ ] Build `CartSummary` component (subtotal, shipping, total)
- [ ] Build `cart/page.tsx` (full cart page with checkout CTA)
- [ ] Implement cart merge on login (localStorage → server cart)

### Wave 5.2 — Address Management
- [ ] Create `actions/addresses.ts` (CRUD + setDefault)
- [ ] Build `AddressForm` component (glassmorphic form with validation)
- [ ] Build `AddressSelector` component (list of saved addresses, create new inline)
- [ ] Build `account/addresses/page.tsx` (full address book management)

### Wave 5.3 — Checkout & Razorpay
- [ ] Create `lib/razorpay/client.ts` (Razorpay Node SDK instance)
- [ ] Create `lib/razorpay/verify.ts` (signature verification utility)
- [ ] Create `api/razorpay/create-order/route.ts` (create Razorpay order server-side)
- [ ] Create `api/razorpay/verify/route.ts` (verify payment and create DB order)
- [ ] Create `api/razorpay/webhook/route.ts` (async payment confirmation handler)
- [ ] Build `checkout/page.tsx` (multi-step: address → summary → pay)
- [ ] Build `PaymentButton` component (Razorpay Checkout.js integration)
- [ ] Build order confirmation page (success state with order number)
- [ ] Stock re-verification at checkout time

**Verification:** Add items to cart (guest + logged-in). Address CRUD works. Razorpay test payment completes. Order created in DB with correct line items and stock decremented.

---

## Phase 6: Customer Account

**Objective:** Order history, order detail with courier tracking, profile management.

### Wave 6.1 — Orders
- [ ] Create `actions/orders.ts` (getUserOrders, getOrderDetail)
- [ ] Build `OrderCard` component (order number, date, status, total, items preview)
- [ ] Build `OrderTimeline` component (visual status pipeline with timestamps)
- [ ] Build `TrackingWidget` component (courier name, AWB, clickable tracking link)
- [ ] Build `account/orders/page.tsx` (paginated order history)
- [ ] Build `account/orders/[id]/page.tsx` (full order detail with timeline + tracking)

### Wave 6.2 — Profile
- [ ] Build `account/page.tsx` (profile view/edit: name, phone, email, avatar)
- [ ] Build `(account)/layout.tsx` (sidebar navigation: profile, orders, addresses)

**Verification:** Order history shows past orders with correct statuses. Order detail shows timeline and tracking link (if dispatched). Profile edit persists.

---

## Phase 7: Admin Foundation

**Objective:** Admin shell, dashboard, book CRUD, category CRUD, fast stock toggle.

### Wave 7.1 — Admin Layout & Dashboard
- [ ] Build `admin/layout.tsx` (admin guard + sidebar shell)
- [ ] Build `AdminSidebar` component (collapsible sidebar with nav links + icons)
- [ ] Build `admin/page.tsx` (dashboard with KPI cards, recent orders, low stock alerts)
- [ ] Create `actions/analytics.ts` (getDashboardKPIs)
- [ ] Build `AnalyticsCards` component (orders today, revenue, pending dispatches)
- [ ] Build `DataTable` component (sortable, searchable, paginated table primitive)

### Wave 7.2 — Book CRUD
- [ ] Build `admin/books/page.tsx` (data table with search, category filter, inline stock toggle)
- [ ] Build `StockToggle` component (single-click in-stock/sold-out toggle with optimistic UI)
- [ ] Create `api/upload/route.ts` (receive image → Sharp compress to WebP → upload to R2 → return URL)
- [ ] Create `lib/cloudflare/r2.ts` (R2 upload helpers via S3-compatible API)
- [ ] Create `lib/image/compress.ts` (Sharp WebP/AVIF compression pipeline)
- [ ] Build `BookForm` component (title, author, description, price, category dropdown, image upload)
- [ ] Build `admin/books/new/page.tsx` (create book form)
- [ ] Build `admin/books/[id]/edit/page.tsx` (edit book form, pre-filled)
- [ ] Wire to `actions/books.ts` (createBook, updateBook, deleteBook, toggleBookStock)

### Wave 7.3 — Category CRUD
- [ ] Build `CategoryManager` component (inline CRUD table: Tamil name, English slug, sort order)
- [ ] Build `admin/categories/page.tsx` (category management with create/edit/delete)
- [ ] Wire to `actions/categories.ts` (createCategory, updateCategory, deleteCategory)
- [ ] Delete protection: show warning if category has associated books

**Verification:** Admin dashboard shows real KPIs. Books CRUD: create with image upload → image compressed to WebP → displays in catalog. Stock toggle updates instantly. Category CRUD: create → appears in book form dropdown. Delete blocked if books exist.

---

## Phase 8: Admin Orders & Tracking

**Objective:** Full order management with courier tracking input and status updates.

### Wave 8.1 — Order Management
- [ ] Build `admin/orders/page.tsx` (data table with status/date filters, search by order number)
- [ ] Build `OrderStatusPipeline` component (visual status buttons for status transitions)
- [ ] Build batch status update (select multiple orders → change status)
- [ ] Build `admin/orders/[id]/page.tsx` (full detail: items, address, payment info, admin notes)
- [ ] Wire to `actions/orders.ts` (getAllOrders, updateOrderStatus)

### Wave 8.2 — Courier Tracking
- [ ] Build `CourierTrackingInput` component (AWB text field + 3 courier radio buttons)
- [ ] Wire to `actions/orders.ts` (setOrderTracking) — triggers DB tracking_url generation
- [ ] Show tracking URL in admin order detail (clickable link)
- [ ] Dispatch status auto-sets `dispatched_at` timestamp

**Verification:** Admin can view all orders, filter by status. Update order status → reflects in customer view. Enter AWB + select courier → tracking URL auto-generated → customer sees tracking link.

---

## Phase 9: Admin Analytics, Blog & Feeds

**Objective:** Monthly analytics dashboard with CSV export, rich text blog management with multi-image gallery & keyword tag taxonomy, and feed editor.

### Wave 9.1 — Analytics
- [ ] Build `admin/analytics/page.tsx` (monthly summary cards, charts, date picker)
- [ ] Build `RevenueChart` component (line chart: daily orders over 30 days)
- [ ] Build `CsvExportButton` component (download filtered order data as CSV)
- [ ] Create `lib/csv/export.ts` (CSV generation from order data)
- [ ] Create `api/cron/refresh-analytics/route.ts` (refresh materialized view)
- [ ] Wire to `actions/analytics.ts` (getMonthlyAnalytics, exportOrdersCsv, refreshAnalytics)

### Wave 9.2 — Admin Blog Management (Images & Keywords)
- [ ] Build `admin/blog/page.tsx` (data table of articles with status, keywords, cover thumbnails, views)
- [ ] Build `KeywordInput` component (interactive chip/tag input with autocomplete, suggestions, validation)
- [ ] Build `ImageGalleryUploader` component (multi-image dropzone with auto WebP compression, reorder & caption support)
- [ ] Build `admin/blog/new/page.tsx` (create blog: Tiptap rich editor + cover/gallery upload + keyword tags + book picker)
- [ ] Build `admin/blog/[id]/edit/page.tsx` (edit blog, prefilled)
- [ ] Wire to `actions/blog.ts` (createBlog, updateBlog, deleteBlog, toggleBlogPublish)

### Wave 9.3 — Feed Editor
- [ ] Install and configure Tiptap v2 with extensions (heading, bold, italic, image, link, list)
- [ ] Build `FeedEditor` component (Tiptap editor with toolbar)
- [ ] Build `BookPicker` component (searchable dropdown to tag books in a feed)
- [ ] Build `admin/feeds/page.tsx` (feed list with publish/draft toggle)
- [ ] Build `admin/feeds/new/page.tsx` (create feed with editor + book picker)
- [ ] Build `admin/feeds/[id]/edit/page.tsx` (edit feed)
- [ ] Wire to `actions/feeds.ts` (createFeed, updateFeed, deleteFeed)

**Verification:** Analytics shows monthly data with correct totals. CSV export downloads with correct columns. Blog creation: upload multi-images → compress to WebP → input keyword chips → tag books → publish works. Feed editor functions properly.

---

## Phase 10: Storefront Blog & Content Pages

**Objective:** Customer-facing blog catalog with keyword filters, article reader with image gallery and book cards, feeds, videos, and static pages.

### Wave 10.1 — Blog Storefront
- [ ] Create `actions/blog.ts` (getPublishedBlogs, getBlogBySlug, getRelatedBlogs, getAllKeywords)
- [ ] Build `BlogCard` component (cover image, title, reading time, keyword pills, excerpt)
- [ ] Build `BlogGrid` component (responsive grid with staggered reveal animation)
- [ ] Build `KeywordFilter` component (horizontal scrolling keyword chips + tag cloud on desktop)
- [ ] Build `blog/page.tsx` (search input, keyword filter pills, featured article hero, paginated grid)
- [ ] Build `BlogGallery` component (interactive image carousel & full-screen lightbox for article images)
- [ ] Build `RelatedPosts` component (shows related articles scored by keyword overlap)
- [ ] Build `blog/[slug]/page.tsx` (article reader: hero cover, gallery, reading time, keyword tags, related articles, tagged books glass card with "Add to Cart")

### Wave 10.2 — Feeds & Dynamic Media
- [ ] Build `feeds/page.tsx` (published feed listing with cover images, excerpts)
- [ ] Build `feeds/[slug]/page.tsx` (feed article renderer with tagged book cards)
- [ ] Build `videos/page.tsx` (video gallery with lazy-loaded embeds, posters)
- [ ] Build `supporters/page.tsx` (patron showcase grid)

### Wave 10.3 — Static Pages
- [ ] Build `certificate/page.tsx` (organization certificate display)
- [ ] Build `privacy/page.tsx` (privacy policy, MDX or hardcoded)
- [ ] Build `terms/page.tsx` (terms of service)

**Verification:** `/blog` filters instantly when clicking keyword tags. `/blog/[slug]` displays article, image gallery carousel/lightbox, related articles by keyword, and tagged book cards with working add-to-cart. Feeds and media pages render cleanly.

---

## Phase 11: i18n & Polish

**Objective:** Full bilingual support, SEO optimization, performance tuning, responsive QA.

### Wave 11.1 — Internationalization
- [ ] Set up `next-intl` with Tamil (`ta`) and English (`en`) message files
- [ ] Create `messages/ta.json` (all UI strings in Tamil)
- [ ] Create `messages/en.json` (all UI strings in English)
- [ ] Build `LanguageToggle` component (ta/en switch in header)
- [ ] Wrap all UI text in `useTranslations()` / `getTranslations()`
- [ ] Persist locale preference (user profile for auth'd, cookie for guest)

### Wave 11.2 — SEO & Performance
- [ ] Add `metadata` exports to all pages (title, description, OpenGraph, Twitter cards)
- [ ] Create `sitemap.ts` (dynamic sitemap with all book/feed slugs)
- [ ] Create `robots.ts`
- [ ] Add JSON-LD structured data to book detail pages (Product schema)
- [ ] Optimize images: `<Image>` component with `sizes`, `priority` on LCP images
- [ ] Audit with Lighthouse, fix any issues below target thresholds
- [ ] Responsive QA across 375px, 768px, 1024px, 1440px breakpoints

**Verification:** Lighthouse scores: Performance > 90, SEO > 95, Accessibility > 90. Language toggle switches all UI text. Sitemap accessible at `/sitemap.xml`.

---

## Phase 12: Migration & Deploy

**Objective:** Migrate Firebase data, deploy to Cloudflare Pages, DNS cutover.

### Wave 12.1 — Data Migration
- [ ] Write `scripts/migrate-firebase.ts` (Firestore → Supabase migration script)
- [ ] Export and transform `books` collection → SQL INSERT
- [ ] Export and transform `users` → Supabase Auth + profiles
- [ ] Export and transform `orders` → new order schema
- [ ] Migrate images from Firebase Storage → Cloudflare R2

### Wave 12.2 — Deployment
- [ ] Configure Cloudflare Pages project (connect repo, build settings)
- [ ] Set environment variables in Cloudflare Pages
- [ ] Deploy to staging subdomain
- [ ] Run smoke tests on staging (all critical user flows)
- [ ] Switch CNAME to Cloudflare Pages
- [ ] Set up redirect rules (`/book.html?id=X` → `/books/slug`, etc.)
- [ ] Monitor for 48 hours

**Verification:** All data migrated correctly. Staging passes smoke tests. Production accessible at `methagukalanjiyam.in`. Old URLs redirect properly.

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1. Foundation | ⬜ Not Started | | |
| 2. Data Layer | ⬜ Not Started | | |
| 3. Auth & Profiles | ⬜ Not Started | | |
| 4. Storefront Core | ⬜ Not Started | | |
| 5. Cart & Checkout | ⬜ Not Started | | |
| 6. Customer Account | ⬜ Not Started | | |
| 7. Admin Foundation | ⬜ Not Started | | |
| 8. Admin Orders | ⬜ Not Started | | |
| 9. Analytics & Feeds | ⬜ Not Started | | |
| 10. Content Pages | ⬜ Not Started | | |
| 11. i18n & Polish | ⬜ Not Started | | |
| 12. Migration & Deploy | ⬜ Not Started | | |

---

*Roadmap v1.0 — Created 2026-10-17*
