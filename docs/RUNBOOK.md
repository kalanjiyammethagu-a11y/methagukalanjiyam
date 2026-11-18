# Operational Runbook: Methagu Kalanjiyam

**Target App:** Methagu Kalanjiyam (`methagukalanjiyam.in`)  
**Architecture:** Next.js 15 App Router + Supabase PostgreSQL + Razorpay + Cloudflare  
**Document Classification:** Production Engineering Runbook

---

## 1. Deployment Procedures

### 1.1 Prerequisites
- Node.js 20+ LTS installed.
- Supabase project reference: `yxghkhizyjsfrevtekbc`.
- Cloudflare DNS proxy enabled (`Proxied` orange cloud).

### 1.2 Environment Variables
Ensure the following environment variables are securely injected into your production hosting platform (e.g., Cloudflare Pages, Vercel, or Docker):

| Variable | Location | Sensitivity | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Public | PostgREST / Auth endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public | Anon PostgREST access (RLS-guarded) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | **High** | Atomic order creation, webhook handling |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client + Server | Public | Checkout JS SDK modal init |
| `RAZORPAY_KEY_ID` | Server-only | Public/Internal | Razorpay REST API auth |
| `RAZORPAY_KEY_SECRET` | Server-only | **High** | Server order creation & signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | Server-only | **High** | HMAC SHA-256 webhook signature validation |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Public | Canonical URLs & OpenGraph tags |

### 1.3 Production Build & Verification
```powershell
# 1. Install dependencies
npm ci

# 2. Typecheck without emitting code
npx tsc --noEmit

# 3. Compile optimized production build
npm run build

# 4. Verify health endpoint
curl https://methagukalanjiyam.in/api/health
```

---

## 2. Secret Rotation Protocol

If any production credential is leaked or scheduled for periodic rotation:

### 2.1 Rotating `SUPABASE_SERVICE_ROLE_KEY`
1. Navigate to **Supabase Dashboard > Project Settings > API**.
2. Click **Generate a new secret** under `service_role`.
3. Update the production environment variable `SUPABASE_SERVICE_ROLE_KEY`.
4. Trigger a rolling deployment of the web application.
5. Invalidate the old key in Supabase.

### 2.2 Rotating `RAZORPAY_KEY_SECRET`
1. Navigate to **Razorpay Dashboard > Settings > API Keys**.
2. Click **Regenerate Key**. Select the option to retain the old key for 24 hours to allow zero-downtime cutover.
3. Update `RAZORPAY_KEY_SECRET` and `RAZORPAY_KEY_ID` in production environment variables.
4. Redeploy Next.js app.
5. Test a ₹1.00 live checkout flow.
6. Once confirmed, revoke the previous key.

### 2.3 Rotating `RAZORPAY_WEBHOOK_SECRET`
1. Navigate to **Razorpay Dashboard > Settings > Webhooks**.
2. Edit the existing webhook URL: `https://methagukalanjiyam.in/api/webhooks/razorpay`.
3. Enter a new high-entropy secret (32+ random characters).
4. Update `RAZORPAY_WEBHOOK_SECRET` in production environment settings simultaneously.

---

## 3. Database Backup & Disaster Recovery

### 3.1 Automated Supabase Backups
- Supabase automatically takes daily WAL (Write-Ahead Log) snapshots and daily logical backups.
- Retention is configured per tier (Point-in-Time Recovery enabled for Pro/Enterprise).

### 3.2 Manual Schema & Data Export
```powershell
# Export schema only
npx supabase db dump -f supabase/backups/schema-$(Get-Date -Format "yyyyMMdd").sql

# Export data only
npx supabase db dump --data-only -f supabase/backups/data-$(Get-Date -Format "yyyyMMdd").sql
```

### 3.3 Restore Procedure
1. Create a clean database instance in the target region.
2. Apply versioned migrations in order:
   ```powershell
   npx supabase migration up
   ```
3. Restore table data:
   ```powershell
   psql -h aws-0-ap-northeast-1.pooler.supabase.com -U postgres.yxghkhizyjsfrevtekbc -d postgres -f supabase/backups/data-backup.sql
   ```
4. Verify table row counts and RLS policies:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

---

## 4. Incident Response & Triage

### 4.1 Payment Gateway Webhook Failure
- **Symptom:** Razorpay dashboard reports non-200 webhook delivery or timeouts.
- **Triage Steps:**
  1. Check Cloudflare WAF logs for blocked POST requests to `/api/webhooks/razorpay`.
  2. Verify that Cloudflare WAF rule allows Razorpay IP ranges (`CLOUDFLARE-SETUP.md`).
  3. Verify `razorpay_events` table in Supabase:
     ```sql
     SELECT event_id, event_type, processed_at FROM razorpay_events ORDER BY created_at DESC LIMIT 20;
     ```
  4. Ensure `RAZORPAY_WEBHOOK_SECRET` matches between Razorpay and production env.

### 4.2 Rate Limiting Triggers (HTTP 429)
- If legitimate customers report HTTP 429 errors:
  1. Check client IP resolution: verify `CF-Connecting-IP` header is correctly forwarded by Cloudflare.
  2. Increase the threshold in `src/middleware.ts` from 30 req/min to 60 req/min if legitimate traffic bursts require it.

### 4.3 Database Connection Exhaustion
- Connect to Supabase via Session Pooler (port `5432` / `6543`) rather than direct connections to prevent connection starvation under high concurrency.

