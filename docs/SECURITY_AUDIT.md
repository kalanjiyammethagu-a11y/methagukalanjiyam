# Production Backend & Application Security Audit

**Target Application:** Methagu Kalanjiyam (`methagukalanjiyam.in`)  
**Repository Working Directory:** `M:\Personal\Workspace\Book`  
**Date of Audit:** November 14, 2026  
**Auditor:** Principal Backend & Application Security Engineer  
**Status:** Audit Complete — **CRITICAL (P0) FINDINGS DETECTED. IMPLEMENTATION HALTED FOR REVIEW.**

---

## 1. System Architecture & Context Confirmation

Empirically verified against `package.json`, configuration files, and codebase:

| Component | Detected Implementation | Verification Evidence |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.2.1 (App Router), React 19.0.0, TypeScript 5.8.2 | `package.json:17, 20, 31` |
| **Database** | PostgreSQL 17 on Supabase (Project ID: `yxghkhizyjsfrevtekbc`) | `supabase/migrations/*`, `src/lib/supabase/` |
| **Authentication** | `@supabase/ssr` (v0.5.2) + `@supabase/supabase-js` (v2.49.1) | `package.json:12-13`; Frontend login (`src/app/login/page.tsx:99-103`) is currently mock-only |
| **Payments** | Razorpay REST / SDK (v2.9.8) with server-side orders & webhooks | `src/app/api/orders/*`, `src/app/api/webhooks/razorpay/*` |
| **Edge / Proxy** | Cloudflare WAF, Turnstile, CF-Connecting-IP, strict CSP | `next.config.ts:18-94`, `src/middleware.ts:9-28` |

---

## 2. API Routes & Server Actions Inventory

There are currently **zero** `'use server'` Server Actions in the repository. All server-side backend operations are exposed via Route Handlers under `src/app/api/`:

| Endpoint | Method | Authentication Required | Authorization Checked | Input Validation | CSRF Protection | Rate Limited |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/orders/create` | `POST` | ❌ No (Guest allowed) | ❌ None | ⚠️ Partial (Zod without `.strict()`, unbounded arrays) | ❌ None | ✅ Yes (30 req/min in-memory) |
| `/api/orders/verify` | `POST` | ❌ No | ❌ None (No session/order ownership check) | ❌ None (Manual cast, no Zod schema) | ❌ None | ✅ Yes (30 req/min in-memory) |
| `/api/webhooks/razorpay` | `POST` | ✅ Yes (HMAC SHA-256 header) | ✅ Webhook Secret verified | ❌ None (Raw `JSON.parse` with `any` cast) | N/A (Signature) | ✅ Yes (60 req/min in-memory) |
| `/admin/*` (UI Routes) | `GET` | ⚠️ Bypassed in demo mode; weak check in prod | ❌ No role check (any logged-in customer passes) | N/A | N/A | ❌ No |
| `/account` (UI Route) | `GET` | ⚠️ Bypassed in demo mode; redirects if not user | ❌ Client-only state | N/A | N/A | ❌ No |

---

## 3. Prioritized Security Findings (P0 / P1 / P2)

### Severity Classification
- **P0 (Critical):** Immediate exploitability leading to full account takeover, privilege escalation, unauthorized database writes, or financial/payment bypass. **Requires immediate stop & review.**
- **P1 (High):** Significant security flaw, data integrity issue, race condition, missing transaction, or injection vulnerability.
- **P2 (Medium):** Hardening deficit, unbounded memory allocation, missing client rate-limit durability, or missing audit tracking.

---

### [P0 - CRITICAL] Finding 1: Privilege Escalation via Unchecked Self-Update on `profiles.role`

- **File Path:** `supabase/migrations/002_rls_policies.sql:39-42`
- **Code Reference:**
  ```sql
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
  ```
- **What is Wrong:**
  The `FOR UPDATE` RLS policy on the `profiles` table allows any authenticated user to update their own row without restricting which columns may be modified. There is no `WITH CHECK` clause or trigger restricting the `role` column.
- **Theoretical Exploitation:**
  Any user who registers as a standard customer can use their browser console or `curl` with the public Supabase Anon key and their JWT token to execute:
  ```javascript
  await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
  ```
  This immediately sets their role to `'admin'`. Because `is_admin()` evaluates `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`, the user immediately gains full administrative access to all tables, customer addresses, orders, and settings.
- **Proposed Fix:**
  Add a `WITH CHECK` clause to the policy enforcing that `role` cannot be altered by non-admins, or preferably use a PostgreSQL BEFORE UPDATE trigger that prevents non-service-role changes to `role`:
  ```sql
  CREATE POLICY "Users can update own profile non-sensitive fields"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id AND 
      (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()) OR is_admin())
    );
  ```

---

### [P0 - CRITICAL] Finding 2: Missing Admin Role Authorization Gate in Next.js Middleware

- **File Path:** `src/lib/supabase/middleware.ts:41-60`
- **Code Reference:**
  ```typescript
  // If Supabase is placeholder (prepared backend / demo showcase mode),
  // allow showcasing /admin and /account directly with rich mock data as requested.
  const isDemoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isDemoMode) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection for /admin in production mode
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }
  ```
- **What is Wrong:**
  1. If `isDemoMode` evaluates to `true` (e.g. during misconfigured env rollout), anyone on the public internet can load `/admin` without any authentication.
  2. In production mode, the check is strictly `if (!user)` — it verifies only that the requester has a valid session, but **never checks whether the user has the `admin` role**. Any standard customer account is permitted into `/admin`.
- **Theoretical Exploitation:**
  An attacker creates a normal customer account, logs in, and browses directly to `/admin`, `/admin/orders`, `/admin/settings`, or `/admin/analytics`. They are granted entry because `user` is non-null.
- **Proposed Fix:**
  1. Remove `isDemoMode` bypass from production middleware.
  2. Query user profile role or extract custom app metadata claims from the user JWT in middleware. If `profile.role !== 'admin'`, return HTTP 403 Forbidden or redirect to `/`.

---

### [P0 - CRITICAL] Finding 3: Direct Client-Side Order Injection & Tampering via Permissive RLS

- **File Path:** `supabase/migrations/002_rls_policies.sql:91-94, 115-118`
- **Code Reference:**
  ```sql
  CREATE POLICY "Users and guests can insert orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR is_admin());

  CREATE POLICY "Users can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (true);
  ```
- **What is Wrong:**
  1. `order_items` allows ANY user (including unauthenticated anonymous clients) to insert arbitrary records (`WITH CHECK (true)`).
  2. `orders` allows unauthenticated clients (`user_id IS NULL`) to directly insert records without validation. An attacker can set `payment_status = 'paid'`, `status = 'confirmed'`, `total_amount = 0.00`, and `shipping_fee = 0.00`.
- **Theoretical Exploitation:**
  An attacker sends a direct REST request to Supabase PostgREST using `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  ```http
  POST https://yxghkhizyjsfrevtekbc.supabase.co/rest/v1/orders
  apikey: <anon_key>
  Content-Type: application/json
  
  {
    "order_number": "MK-EXPLOIT-01",
    "is_guest_checkout": true,
    "payment_status": "paid",
    "status": "confirmed",
    "total_amount": 0,
    "shipping_address": { "full_name": "Attacker", "phone": "9999999999", "state": "Tamil Nadu" }
  }
  ```
  The order is saved with `payment_status = 'paid'` without ever passing through Razorpay or `/api/orders/create`.
- **Proposed Fix:**
  Revoke direct client INSERT access to `orders` and `order_items` for `anon` and `authenticated` roles. All order creation and status modifications must go through server-side API endpoints (`/api/orders/create` and `/api/orders/verify`) using `service_role` or a dedicated database RPC function.
  ```sql
  -- Remove public INSERT policies
  DROP POLICY IF EXISTS "Users and guests can insert orders" ON orders;
  DROP POLICY IF EXISTS "Users can insert order items" ON order_items;

  -- Only allow service_role and admin to insert/modify orders
  CREATE POLICY "Service role and admin full access to orders"
    ON orders FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  ```

---

### [P0 - CRITICAL] Finding 4: Client Login Flow Does Not Authenticate Against Backend

- **File Path:** `src/app/login/page.tsx:99-105`
- **Code Reference:**
  ```typescript
  setSubmitted(true);
  // Direct reader to their library and delivery profile
  setTimeout(() => {
    router.push("/account");
  }, 1000);
  ```
- **What is Wrong:**
  The login page contains complete UI forms for phone, email, and password, but `handleSubmit` does not call `supabase.auth.signInWithPassword()` or any server endpoint. It simulates authentication via a 1000ms client-side timer and redirects to `/account`.
- **Theoretical Exploitation:**
  Users entering credentials have no session established with Supabase Auth (`sb-*-auth-token` cookies are never issued). Any protected route relying on `supabase.auth.getUser()` fails or treats the user as unauthenticated, while the frontend gives the user the impression they are logged in.
- **Proposed Fix:**
  Implement real authentication using Supabase Auth SSR:
  1. For email/password: `await supabase.auth.signInWithPassword({ email, password })`.
  2. For phone OTP / passwordless: `await supabase.auth.signInWithOtp({ phone })`.
  3. Ensure cookies are set with `httpOnly`, `Secure`, and `SameSite=Lax`.

---

### [P1 - HIGH] Finding 5: Missing Input Schema Validation on `/api/orders/verify`

- **File Path:** `src/app/api/orders/verify/route.ts:8-20`
- **What is Wrong:**
  The endpoint uses `const body = (await req.json()) as Partial<VerifyPaymentApiRequest>;` without validating parameters using Zod. No maximum length or format restrictions exist on `razorpay_payment_id`, `razorpay_order_id`, or `razorpay_signature`.
- **Threat:** Malformed payloads, memory amplification, or injection of unexpected properties into downstream operations.
- **Proposed Fix:** Create and apply `verifyPaymentSchema` using Zod enforcing strict string length and alphanumeric patterns (`/^order_[a-zA-Z0-9]+$/`, `/^pay_[a-zA-Z0-9]+$/`).

---

### [P1 - HIGH] Finding 6: Non-Transactional Order Insertion and Stock Management

- **File Path:** `src/app/api/orders/create/route.ts:110-162`
- **What is Wrong:**
  Order creation performs two separate database queries:
  1. `adminSupabase.from("orders").insert(...)`
  2. `adminSupabase.from("order_items").insert(...)`
  If the second query fails (e.g. database constraint error or network timeout), the first query is not rolled back. The database is left with a phantom order with zero items. Furthermore, book inventory is neither checked with `SELECT FOR UPDATE` nor reserved in Postgres.
- **Threat:** Race conditions leading to negative stock (overselling) during flash sales or high-traffic launches, and orphaned database records.
- **Proposed Fix:**
  Wrap order creation and inventory decrement into a single atomic PostgreSQL RPC function (e.g. `create_order_atomic`) executed within a transaction with row-level locks on `books`.

---

### [P1 - HIGH] Finding 7: Missing `search_path` on `SECURITY DEFINER` Function `is_admin()`

- **File Path:** `supabase/migrations/002_rls_policies.sql:21-29`
- **Code Reference:**
  ```sql
  CREATE OR REPLACE FUNCTION is_admin()
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- **What is Wrong:**
  PostgreSQL functions marked `SECURITY DEFINER` execute with the privileges of the owner (postgres/superuser). Without an explicit `SET search_path = public, pg_temp`, the function is vulnerable to search path hijacking if an attacker creates objects in a schema evaluated earlier in the search path.
- **Proposed Fix:**
  Add `SET search_path = public, pg_temp` to the function definition.

---

### [P1 - HIGH] Finding 8: High Severity Vulnerabilities in Installed Dependencies

- **Verification Tool:** `npm audit` (real execution output)
- **Results:** 4 vulnerabilities (3 High, 1 Moderate):
  1. `postcss <=8.5.22` (High): Arbitrary file read & information disclosure via `sourceMappingURL` (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849).
  2. `sharp <=0.35.5-rc.1` (High): Inherited buffer overflow / integer overflow vulnerabilities in `libvips`, `libheif`, and `librsvg` (CVE-2026-33327, CVE-2026-33328, GHSA-rgj7-g3m4-5g8c).
  3. `zod <4.6.6` (High): Memory exhaustion DoS while validating oversized constrained collections (GHSA-mrhx-c7xc-m3w5).
- **Proposed Fix:**
  - Update direct dependency `sharp` to latest secure release (`^0.33.5` or patch).
  - Update `postcss` to `^8.5.3` / latest patched version.
  - Constrain Zod array input lengths explicitly (`z.array(...).max(50)`) to mitigate memory exhaustion.

---

### [P2 - MEDIUM] Finding 9: In-Memory Sliding Window Rate Limiter Resets Across Serverless Instances

- **File Path:** `src/lib/rate-limit.ts:28-30`
- **What is Wrong:**
  The rate limiter uses an in-memory `Map<string, RateLimitEntry>` stored in Node.js process memory. In serverless environments (Vercel, AWS Lambda, Cloudflare Workers), each lambda container maintains an isolated memory store.
- **Threat:** An attacker can bypass the 10/min or 30/min limit by distributing requests across parallel cold lambda instances.
- **Proposed Fix:**
  In addition to Cloudflare WAF edge rate limiting (configured in `CLOUDFLARE-SETUP.md`), implement an atomic Redis or Supabase table/KV rate limit store for mission-critical endpoints.

---

### [P2 - MEDIUM] Finding 10: XSS Risk via Unsanitized `dangerouslySetInnerHTML` on Blog Content

- **File Path:** `src/app/blog/[slug]/page.tsx:392`
- **Code Reference:**
  ```tsx
  <div dangerouslySetInnerHTML={{ __html: content }} />
  ```
- **What is Wrong:**
  `content` is passed directly to `dangerouslySetInnerHTML`. While currently referencing static string records, when blog content is loaded from Supabase `blogs.content` or CMS inputs, any `<script>` or event handler attributes (`onload`, `onerror`) will execute in reader browsers.
- **Proposed Fix:**
  Sanitize HTML content using `sanitize-html` or `isomorphic-dompurify` with a strict tag and attribute allowlist before rendering.

---

### [P2 - MEDIUM] Finding 11: Currency Stored as `NUMERIC(10,2)` Instead of Integer Minor Units (Paise)

- **File Path:** `supabase/migrations/001_initial_schema.sql:80, 152-155, 187`
- **What is Wrong:**
  Prices and totals in PostgreSQL are defined as `NUMERIC(10,2)` (Rupees with two decimal places). Razorpay and Indian banking payment gateways operate strictly in integer minor units (Paise). Converting between float/numeric and integer paise introduces precision risks.
- **Proposed Fix:**
  Maintain database monetary columns as `BIGINT` (paise) with explicit CHECK constraints (`amount >= 0`).

---

## 4. Webhook & Secret Management Verification

- **Committed `.env` Files:** Verified with `git log --all --full-history -- ".env*"`. Only `.env.example` has ever been committed. No production secrets exist in git history.
- **Hardcoded Credentials:** None detected in `src/`.
- **Client vs. Server Key Isolation:**
  - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Exposed to client (standard).
  - `SUPABASE_SERVICE_ROLE_KEY`: Strictly server-side in `src/lib/supabase/admin.ts`.
  - `RAZORPAY_KEY_SECRET` & `RAZORPAY_WEBHOOK_SECRET`: Strictly server-side in `src/lib/razorpay.ts`.
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Client-side key for checkout modal (standard).
- **Webhook Signature Verification:** Verified in `src/app/api/webhooks/razorpay/route.ts:33`. Uses `crypto.timingSafeEqual` with HMAC SHA-256 against raw body text.
- **Webhook Idempotency:** Implemented via `razorpay_events` table deduplication (`event_id`).

---

## 5. Audit Review Gate & Stop Condition

> **PHASE 1 AUDIT RULE:** *"Stop and wait for review if the audit has any P0 findings."*

Four (4) **P0 (Critical)** vulnerabilities have been verified in the codebase:
1. **Finding 1 (P0):** Privilege escalation via unrestricted self-update on `profiles.role`.
2. **Finding 2 (P0):** Missing admin role check in Next.js middleware.
3. **Finding 3 (P0):** Permissive RLS enabling arbitrary direct client order injection and status tampering.
4. **Finding 4 (P0):** Client login flow lacks real backend session authentication.

**Status:** Awaiting review and approval from product owner/lead engineer before initiating Phase 2 (Database hardening & migration fixes) and Phase 3 (Auth and authorization implementation).

