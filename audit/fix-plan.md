# Audit Remediation Fix Plan (Phase 0: Verification)

**Date:** November 22, 2026  
**Scope:** Verification of all Critical and High findings across `REPORT.md`, `backend-agent.md`, `frontend-agent.md`, `database-agent.md`, and `feature-qa-matrix.md`.

---

## 1. Resolution of Contradiction: WhatsApp vs. Razorpay In-Site Checkout

**The Contradiction:**
The executive audit report (`audit/REPORT.md`) asserts that the platform uses a "WhatsApp-only checkout model" with "no payment gateway" and only a "mock payment route." Conversely, the backend audit and codebase contain active Razorpay payment integration, webhooks, and verification endpoints.

**Actual Codebase Truth (Verified):**
1. **Domestic In-Site E-Commerce (LIVE & ACTIVE):**
   - **Shopping Cart & Checkout UI:** [src/app/cart/page.tsx#L893-L935](file:///m:/Personal/Workspace/Book/src/app/cart/page.tsx#L893-L935). For all domestic orders (Tamil Nadu & Other Indian States), the storefront mounts the interactive [RazorpayCheckout](file:///m:/Personal/Workspace/Book/src/components/checkout/RazorpayCheckout.tsx) component. Customers pay directly on-site using UPI (GPay/PhonePe), Credit/Debit Cards, and Net Banking.
   - **Atomic Order Creation:** `POST /api/orders/create` ([src/app/api/orders/create/route.ts](file:///m:/Personal/Workspace/Book/src/app/api/orders/create/route.ts)) generates orders in Supabase PostgreSQL and creates a Razorpay gateway order via `@/lib/razorpay`.
   - **Payment Verification:** `POST /api/orders/verify` ([src/app/api/orders/verify/route.ts](file:///m:/Personal/Workspace/Book/src/app/api/orders/verify/route.ts)) cryptographically validates the HMAC-SHA256 signature and confirms the order.
   - **Asynchronous Webhook Fulfillment:** `POST /api/webhooks/razorpay` ([src/app/api/webhooks/razorpay/route.ts](file:///m:/Personal/Workspace/Book/src/app/api/webhooks/razorpay/route.ts)) receives `payment.captured` events from Razorpay and logs idempotency in `razorpay_events`.
2. **Overseas / Diaspora Inquiries (WhatsApp Only):**
   - **International Ordering UI:** [src/app/cart/page.tsx#L860-L892](file:///m:/Personal/Workspace/Book/src/app/cart/page.tsx#L860-L892). WhatsApp inquiry is strictly reserved for international diaspora orders (`shippingRegion === "diaspora"`) to negotiate variable international courier rates (DHL / India Post).
3. **Verdict:**
   - The claim that the platform is "WhatsApp-only" is **PROVABLY INVALID**. Real on-site checkout via Razorpay is the primary live purchase flow. All payment gateway security and idempotency fixes are active and prioritized.

---

## 2. Master Verification Matrix: Critical & High Findings

| ID | Domain | Severity | Claimed Finding | Verified Status | Confirmed Location (File & Line) | Technical Evidence / Rationale |
|:---|:---|:---:|:---|:---:|:---|:---|
| **SEC-02** | Security | 🔴 Critical | Live Razorpay & ERP API secrets in `.env.local` | **VERIFIED** | [.env.local#L7-L20](file:///m:/Personal/Workspace/Book/.env.local#L7-L20) | Active API keys and credentials exist in local environment. Confirmed via `git ls-files` that `.env.local` was never committed to git, but secrets must be removed, `.env.example` audited, and server startup checks enforced. |
| **BE-3** | Backend | 🔴 Critical | Admin session checks validity but does not verify `profiles.role === 'admin'` | **VERIFIED** | [src/lib/auth-service.ts#L284-L326](file:///m:/Personal/Workspace/Book/src/lib/auth-service.ts#L284-L326), [src/app/api/admin/books/route.ts#L7-L14](file:///m:/Personal/Workspace/Book/src/app/api/admin/books/route.ts#L7-L14) | `validateAdminSession` verifies session token presence in `admin_sessions` table but never queries `profiles` for `role = 'admin'`. Any user with a session record can access admin endpoints. |
| **BE-8** | Backend | 🔴 Critical | Payment verification lacks atomic idempotency on order update | **VERIFIED** | [src/app/api/orders/verify/route.ts#L106-L135](file:///m:/Personal/Workspace/Book/src/app/api/orders/verify/route.ts#L106-L135) | While duplicate `razorpay_payment_id` is caught, the DB update statement does not enforce atomic `WHERE payment_status != 'paid'`, leaving a concurrency race condition for simultaneous verification submissions. |
| **DB-CRITICAL-01** | Database | 🔴 Critical | Double inventory deduction trigger crashing payment webhook | **ALREADY FIXED** | [supabase/migrations/011_fix_triggers_and_security.sql#L12-L15](file:///m:/Personal/Workspace/Book/supabase/migrations/011_fix_triggers_and_security.sql#L12-L15) | Trigger `trg_decrement_stock` was dropped in migration 011 and disabled live in Postgres database via `ALTER TABLE public.orders DISABLE TRIGGER trg_decrement_stock`. |
| **DB-CRITICAL-02** | Database | 🔴 Critical | Public execution rights on `SECURITY DEFINER` RPC `create_order_atomic` | **ALREADY FIXED** | [supabase/migrations/011_fix_triggers_and_security.sql#L62-L70](file:///m:/Personal/Workspace/Book/supabase/migrations/011_fix_triggers_and_security.sql#L62-L70) | Public/anon/authenticated execute rights revoked; execution strictly granted to `service_role`. |
| **UI-4** | UI / A11y | 🟠 High | Focus ring & accent contrast missing on white theme | **VERIFIED** | [src/app/globals.css#L93-L103](file:///m:/Personal/Workspace/Book/src/app/globals.css#L93-L103) | `html[data-theme="white"]` defines canvas and surface variables but omits `--color-accent` and `--color-ink-*`, leaving focus rings reliant on fallback styles. |
| **FE-8** | Frontend | 🟠 High | `LanguageContext` unmemoized provider value causes whole-app re-renders | **VERIFIED** | [src/context/LanguageContext.tsx#L293-L319](file:///m:/Personal/Workspace/Book/src/context/LanguageContext.tsx#L293-L319) | Provider passes raw object literal to `value` prop without `useMemo`, recreating context reference on every state transition and triggering re-renders across all consumer components. |
| **UI-8** | Frontend / UX | 🟠 High | WhatsApp URL builder omits address when `fullName` is missing | **VERIFIED** | [src/lib/whatsapp.ts#L24-L34](file:///m:/Personal/Workspace/Book/src/lib/whatsapp.ts#L24-L34) | `else if (address && typeof address === "object" && address.fullName)` skips appending street, city, or pincode if `fullName` is empty or undefined. |
| **SEC-01** | Security | 🟠 High | Missing CSRF Origin/Host check on state-changing `/api/admin/*` routes | **VERIFIED** | [src/middleware.ts#L159-L162](file:///m:/Personal/Workspace/Book/src/middleware.ts#L159-L162) | Middleware checks CSRF on `pathname.startsWith("/api/orders") || pathname.startsWith("/api/auth")`, but omits `/api/admin` state-changing mutations (`POST`, `PUT`, `DELETE`, `PATCH`). |
| **BE-1** | Backend | 🟠 High | Inconsistent input validation across admin routes (missing Zod schemas) | **VERIFIED** | [src/app/api/admin/supporters/route.ts#L66-L84](file:///m:/Personal/Workspace/Book/src/app/api/admin/supporters/route.ts#L66-L84), [src/app/api/admin/categories/route.ts#L50-L75](file:///m:/Personal/Workspace/Book/src/app/api/admin/categories/route.ts#L50-L75) | Admin API routes perform ad-hoc `if` checks on input parameters rather than structured Zod schema parsing. |
| **BE-4** | Backend | 🟠 High | Per-process in-memory rate limiter in serverless / multi-instance | **VERIFIED** (Architectural) | [src/lib/rate-limit.ts#L10-L40](file:///m:/Personal/Workspace/Book/src/lib/rate-limit.ts#L10-L40), [src/middleware.ts#L45-L96](file:///m:/Personal/Workspace/Book/src/middleware.ts#L45-L96) | In-memory `Map` provides per-instance defense-in-depth; Cloudflare WAF handles distributed edge rate-limiting as documented in `CLOUDFLARE-SETUP.md`. |
| **DB-HIGH-01** | Database | 🟠 High | `orders.user_id` ON DELETE SET NULL persists orders as unlinked | **INVALID** | [supabase/migrations/001_initial_schema.sql#L145](file:///m:/Personal/Workspace/Book/supabase/migrations/001_initial_schema.sql#L145) | SET NULL on `user_id` is an intentional accounting standard; financial transactions and order records must survive user account deletions for legal and fiscal auditing. |
| **DB-HIGH-02** | Database | 🟠 High | `cart_items.book_id` ON DELETE CASCADE removes cart items if book deleted | **INVALID** | [supabase/migrations/001_initial_schema.sql#L199](file:///m:/Personal/Workspace/Book/supabase/migrations/001_initial_schema.sql#L199) | Deleting a catalog product should cascade-remove it from pending shopping carts to prevent checkout errors on non-existent items. |
| **DB-HIGH-03** | Database | 🟠 High | Inventory restore trigger firing on non-transition status updates | **ALREADY FIXED** | [supabase/migrations/011_fix_triggers_and_security.sql#L45-L59](file:///m:/Personal/Workspace/Book/supabase/migrations/011_fix_triggers_and_security.sql#L45-L59) | Function `trg_restore_stock_on_cancel()` strictly verifies `OLD.status NOT IN ('cancelled', 'returned') AND NEW.status IN ('cancelled', 'returned')`. |
| **FE-17** | Frontend | 🟠 High | CLS risks in HeroSlider image layout shifts | **INVALID** | [src/components/home/HeroSlider.tsx#L180-L240](file:///m:/Personal/Workspace/Book/src/components/home/HeroSlider.tsx#L180-L240) | HeroSlider wraps images in explicit fixed/min-height containers with `object-cover`. Confirmed in `REPORT.md` line 24 that measured CLS is `0`. |
| **FE-18** | Frontend | 🟠 High | VideoCard iframe CLS/LCP risks | **ALREADY FIXED** | [src/components/videos/VideoCard.tsx](file:///m:/Personal/Workspace/Book/src/components/videos/VideoCard.tsx) | VideoCard uses fixed aspect-ratio container `aspect-video` and lazy-renders iframe only upon user play click. |

---

## 3. Remediation Execution Plan (Phase 1 & Phase 2)

### Phase 1 Priority Fixes:
1. **SECRETS (Critical):**
   - Clean `.env.local` to use placeholder references for Razorpay and ERP credentials.
   - Audit `.env.example` to ensure full parity of environment variable keys with safe placeholders.
   - Enforce fail-loud startup validation for server-side secret access.
   - Verify no secrets have `NEXT_PUBLIC_` prefixes or are bundled into client components.
2. **ADMIN SESSION VALIDATION (Critical):**
   - Create centralized `requireAdmin(req: NextRequest)` in `@/lib/auth-service`.
   - Validate session token integrity AND execute a server-side query verifying `profiles.role === 'admin'`.
   - Fail closed: 401 for missing/invalid session, 403 for non-admin role.
   - Update all admin routes (`src/app/api/admin/*`) to call this centralized validator.
3. **FOCUS RING THEME SUPPORT (High):**
   - In `src/app/globals.css`, declare `--color-accent: #0D5C3A` and contrast-compliant tokens for `html[data-theme="white"]`.
   - Calculate and document WCAG AA contrast ratio (8.21:1 on white).
4. **LANGUAGECONTEXT RE-RENDERS (High):**
   - Wrap `LanguageContext.Provider` value with `React.useMemo`.
   - Wrap state mutation methods with `React.useCallback`.
5. **WHATSAPP URL BUILDER (High):**
   - Update `getWhatsAppOrderUrl` in `src/lib/whatsapp.ts` to include postal address whenever any address field is present, independent of `fullName`.
   - Add unit test suite in `tests/whatsapp.test.ts` covering name-only, address-only, both, neither, special characters, and long strings.
6. **PAYMENT VERIFICATION IDEMPOTENCY (Critical):**
   - Update `src/app/api/orders/verify/route.ts` with an atomic database condition (`UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = :id AND payment_status != 'paid'`).
   - Create new migration file `supabase/migrations/013_unique_payment_id.sql` adding a unique constraint on `orders(razorpay_payment_id)`.
   - Add unit test suite in `tests/payment-verify.test.ts`.

### Phase 2 Remaining Remediations:
1. **CSRF Protection (SEC-01):** Add `pathname.startsWith("/api/admin")` to CSRF origin verification in `src/middleware.ts`.
2. **Zod Validation Standardization (BE-1):** Add Zod schemas in `src/lib/validators/` for admin supporter, category, and image upload endpoints.
3. **Database Integrity Migration (014_hardening_constraints.sql):** Add check constraint `discount_price <= price` and foreign key documentation.
