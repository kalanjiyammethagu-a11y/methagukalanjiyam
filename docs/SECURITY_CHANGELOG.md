# Production Security Hardening Changelog

**Target Application:** Methagu Kalanjiyam (`methagukalanjiyam.in`)  
**Repository Working Directory:** `M:\Personal\Workspace\Book`  
**Execution Date:** November 14, 2026  
**Status:** Completed & Empirically Verified

---

## Mapped Security Fixes to Audit Findings

| Audit Finding ID | Severity | File(s) Touched | Action Taken | Rationale & Protection Achieved |
| :--- | :--- | :--- | :--- | :--- |
| **Finding 1** | **P0** | `supabase/migrations/006_security_hardening.sql`, `public.profiles` | 1. Altered RLS policy `Users can update own profile` with strict `WITH CHECK` restricting `role`.<br>2. Deployed PostgreSQL trigger `trg_prevent_role_escalation` on `profiles.role`. | Eliminates vertical privilege escalation. Standard customer accounts can no longer modify their own role column to `'admin'` using the public PostgREST anon key. |
| **Finding 2** | **P0** | `src/lib/supabase/middleware.ts` | 1. Removed `isDemoMode` unauthenticated bypass for admin routes.<br>2. Implemented strict server-side RBAC check verifying `profile.role === 'admin'`. | Ensures non-admin accounts or unauthenticated visitors are immediately redirected to `/` with 403 Forbidden. |
| **Finding 3** | **P0** | `supabase/migrations/006_security_hardening.sql`, `public.orders`, `public.order_items` | Revoked public/anon INSERT policies on `orders` and `order_items` (`WITH CHECK (public.is_admin())`). | Closes payment bypass vulnerability. All orders and order items must now be created server-side via the atomic `create_order_atomic` RPC or service role. |
| **Finding 4** | **P0** | `src/app/login/page.tsx` | Replaced simulated 1000ms `setTimeout` with live Supabase Auth SSR (`signInWithPassword`, `signUp`, and `signInWithOtp`). | Establishes genuine cryptographic session cookies (`sb-*-auth-token`) with `httpOnly`, `Secure`, and `SameSite=Lax`. |
| **Finding 5** | **P1** | `src/lib/validators/order.ts`, `src/app/api/orders/verify/route.ts` | Created `verifyPaymentSchema` using Zod enforcing strict string length and regex patterns on order/payment/signature IDs. | Rejects malformed, oversized, or forged payment verification requests at the network boundary. |
| **Finding 6** | **P1** | `supabase/migrations/006_security_hardening.sql`, `src/app/api/orders/create/route.ts` | Created atomic PostgreSQL RPC `create_order_atomic` utilizing `SELECT stock FROM books WHERE id = ... FOR UPDATE` row-level locks. | Prevents overselling race conditions and ensures atomic all-or-nothing rollback if order item creation fails. |
| **Finding 7** | **P1** | `supabase/migrations/006_security_hardening.sql`, `public.is_admin()` | Re-declared `is_admin()` with explicit `SET search_path = public, pg_temp;`. | Mitigates PostgreSQL search path hijacking in `SECURITY DEFINER` functions. |
| **Finding 8** | **P1** | `src/lib/validators/order.ts` | Added `.strict()` and constrained array bounds (`items.min(1).max(50)`) across all order schemas. | Mitigates memory exhaustion vulnerabilities (GHSA-mrhx-c7xc-m3w5) while validating nested structures. |
| **Finding 9** | **P2** | `src/lib/rate-limit.ts`, `src/middleware.ts` | Added structured IP rate limit tracking, sliding window purging, and Cloudflare connecting IP precedence. | Multi-tier rate limiting protection against brute force and DDoS. |
| **Finding 10** | **P2** | `src/lib/sanitize.ts`, `src/app/blog/[slug]/page.tsx` | Implemented `sanitizeHtml` filtering `<script>`, `<iframe>`, `javascript:`, and inline `on*` event handlers. | Defends against stored or reflected XSS when rendering dynamic blog content. |
| **Finding 11** | **P2** | `src/lib/sanitize.ts`, `src/app/layout.tsx`, `src/app/books/[slug]/page.tsx` | Implemented `safeJsonLdStringify` escaping `<`, `>`, and `&` in `<script type="application/ld+json">`. | Eliminates script tag breakout injection attacks in JSON-LD structured metadata. |

---

## New System Infrastructure Added

1. **`public.audit_logs` Table:** Deployed on Supabase for persistent tracking of order creations, payment confirmations, and authorization failures.
2. **`src/lib/env.ts`:** Validates critical runtime environment variables at startup.
3. **`src/lib/logger.ts`:** Structured JSON logger with automatic PII and credential redaction.
4. **`src/app/api/health/route.ts`:** Sanitized production health check endpoint reporting uptime and service availability without leaking secrets.
5. **`docs/RUNBOOK.md`:** Complete operations guide covering deployment, secret rotation, and disaster recovery.
6. **`scripts/test-security.mjs`:** 15-test automated verification suite covering validation, HMAC verification, rate limiting, and XSS sanitization.

