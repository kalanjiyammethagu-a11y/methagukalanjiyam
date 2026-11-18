# Production Deployment Runbook — மேதகு களஞ்சியம் (Methagu Kalanjiyam)

> **Document Version:** 1.0.0  
> **Release Target:** Production (`prod-release`)  
> **Architecture:** Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS + Supabase PostgreSQL (SSR) + Razorpay INR + Resend

---

## 1. Pre-Flight Verification Checklist

Before deploying any build to staging or production, verify all criteria pass locally:

| # | Check | Command / Verification | Pass / Fail |
|---|-------|------------------------|-------------|
| 1 | **TypeScript Compilation** | `npx tsc --noEmit` | PASS (0 errors) |
| 2 | **Production Next.js Build** | `npm run build` | PASS (46/46 routes SSG/SSR) |
| 3 | **Hero Slider Readability** | `node scripts/measure-hero-contrast.mjs` | PASS (WCAG AA & AAA compliant) |
| 4 | **Core Security Test Suite** | `node --env-file=.env.local scripts/test-security.mjs` | PASS (15/15 tests passed) |
| 5 | **Catalog & DB Consistency** | 20 books seeded in Supabase `public.books` with UUIDs | PASS |
| 6 | **Zero Committed Secrets** | Git status clean, `.env.local` strictly ignored | PASS |

---

## 2. Environment Variables Specification

All environment variables must be configured in your hosting provider's dashboard (e.g., Vercel Project Settings > Environment Variables).

| Variable Name | Client / Server | Required | Description / Format |
|---------------|-----------------|----------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | **YES** | HTTPS URL of Supabase project (`https://[project-ref].supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | **YES** | Public anonymous JWT for client-side queries and RLS auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER-ONLY** | **YES** | Privileged service key for atomic database mutations. **Never expose to client.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public (Client + Server) | **YES** | Publishable Razorpay Key ID (`rzp_test_...` or `rzp_live_...`). |
| `RAZORPAY_KEY_ID` | **SERVER-ONLY** | **YES** | Server-side Razorpay Key ID for order creation API. |
| `RAZORPAY_KEY_SECRET` | **SERVER-ONLY** | **YES** | Secret key for authenticating with Razorpay REST APIs. |
| `RAZORPAY_WEBHOOK_SECRET` | **SERVER-ONLY** | **YES** | Secret token for validating Razorpay webhook HMAC SHA-256 signatures. |
| `RESEND_API_KEY` | **SERVER-ONLY** | **YES** | API key (`re_...`) for transactional email and Admin 2FA OTP codes. |
| `RESEND_FROM_EMAIL` | **SERVER-ONLY** | **YES** | Authorized sender address e.g. `"Methagu Kalanjiyam <orders@methagukalanjiyam.in>"`. In testing, use `"onboarding@resend.dev"`. |
| `AUTH_SECRET` | **SERVER-ONLY** | **YES** | 32-byte hex secret for signing pre-auth tokens and admin cookies (`openssl rand -hex 32`). |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Public (Client + Server) | **YES** | Support WhatsApp phone number with country code (e.g., `916384654946`). |
| `NEXT_PUBLIC_SITE_URL` | Public (Client + Server) | Optional | Canonical production origin (`https://methagukalanjiyam.in`). Defaults to host URL. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Public (Client + Server) | Optional | Default storefront locale (`ta`). |

---

## 3. Deployment Targets

### Option A: Vercel (Recommended)

1. **Connect Repository:**
   - Link the GitHub/GitLab repository to Vercel.
   - Select branch: `prod-release` (or `main` upon merge).
2. **Build Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js Version: `20.x` or `22.x`
3. **Environment Configuration:**
   - Paste all 11 environment variables listed in Section 2 into Vercel Project Settings.
4. **Deploy:**
   - Trigger deployment. Inspect build logs to verify 46 static and dynamic routes generate cleanly.

### Option B: VPS / Docker Self-Hosted

1. **Server Prerequisites:**
   - Ubuntu 22.04 / 24.04 LTS with Node.js 22 LTS, PM2, and Nginx.
2. **Clone & Install:**
   ```bash
   git clone -b prod-release https://github.com/your-org/methagu-kalanjiyam.git /var/www/methagu
   cd /var/www/methagu
   npm ci --production=false
   ```
3. **Setup Environment:**
   ```bash
   cp .env.example .env.production.local
   nano .env.production.local # Populate production secrets
   ```
4. **Build & Start with PM2:**
   ```bash
   npm run build
   pm2 start npm --name "methagu-kalanjiyam" -- start -- -p 3000
   pm2 save
   ```
5. **Nginx Reverse Proxy & SSL:**
   Configure Nginx with Certbot Let's Encrypt SSL, proxying `http://127.0.0.1:3000`. Ensure `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` is active.

---

## 4. Database Setup & Seeding

1. **PostgreSQL Schema:**
   - Execute migrations in `supabase/migrations/` using Supabase CLI or SQL Editor:
     - `orders`, `order_items`, `books`, `settings`, `audit_logs`, `otp_codes` tables.
     - `create_order_atomic` function for inventory management.
2. **Catalog Seeding:**
   - Seed all 20 historical volumes into Supabase:
     ```bash
     node --env-file=.env.production.local scripts/seed-catalog.mjs
     ```
3. **Initial Admin Provisioning:**
   - Provision the master administrator:
     ```bash
     npx tsx scripts/create-admin.ts
     ```

---

## 5. Post-Deployment Smoke Tests

Run the following checks immediately after DNS points to the new deployment:

1. **Storefront & Catalog:**
   - Visit `https://methagukalanjiyam.in/` — verify hero slider renders vivid photography and caption text with high contrast.
   - Visit `https://methagukalanjiyam.in/books` — verify all 20 archival titles display with prices and stock status.
2. **Order & Checkout Pipeline:**
   - Add a book to cart, proceed to checkout, enter Tamil Nadu pincode (e.g. `600001` - ₹60 shipping) or Rest of India pincode (`560001` - ₹100 shipping).
   - Test Razorpay modal load or WhatsApp direct order intent.
3. **Security Headers Verification:**
   ```bash
   curl -I https://methagukalanjiyam.in/
   ```
   Confirm presence of:
   - `x-frame-options: DENY`
   - `x-content-type-options: nosniff`
   - `strict-transport-security: max-age=31536000; includeSubDomains; preload`
   - `content-security-policy`
4. **Admin Portal Isolation:**
   - Visit `https://methagukalanjiyam.in/admin` — verify unauthenticated requests redirect to `/admin/login`.
   - Verify `https://methagukalanjiyam.in/robots.txt` disallows `/admin` and `/account`.

---

## 6. Rollback Procedures

If an unexpected production defect occurs:

1. **Instant Rollback (Vercel):**
   - Navigate to Vercel Deployments dashboard.
   - Locate the previous successful deployment and click **Promote to Production**. Instant switch takes under 2 seconds.
2. **VPS Rollback:**
   ```bash
   cd /var/www/methagu
   git checkout HEAD~1
   npm ci
   npm run build
   pm2 reload methagu-kalanjiyam
   ```
3. **Database Rollback:**
   - Database schema changes are non-destructive and backwards compatible. If a migration needs reversal, execute the down-migration SQL script in Supabase SQL editor.
