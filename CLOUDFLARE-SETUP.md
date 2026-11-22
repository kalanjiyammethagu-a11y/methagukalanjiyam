# Cloudflare Setup & Edge Optimization Checklist — methagukalanjiyam.in

Complete step-by-step configuration and operational guide for the Tamil bookstore on Cloudflare.
Follow each section in sequence. Every step includes the exact Cloudflare dashboard navigation path, edge rules, and code configuration.

---

## 1. DNS Records

**Dashboard Path:** Cloudflare Dashboard → Select **methagukalanjiyam.in** → **DNS** → **Records**

- [ ] Click **Add record**:
  - **Type:** `A`
  - **Name:** `@` (or `methagukalanjiyam.in`)
  - **IPv4 address:** `<Your origin server IP address>`
  - **Proxy status:** **Proxied** (orange cloud active)
  - **TTL:** `Auto`
- [ ] Click **Add record**:
  - **Type:** `CNAME`
  - **Name:** `www`
  - **Target:** `methagukalanjiyam.in`
  - **Proxy status:** **Proxied** (orange cloud active)
  - **TTL:** `Auto`
- [ ] Click **Add record** (Image storage / R2 custom domain, if applicable):
  - **Type:** `CNAME`
  - **Name:** `images`
  - **Target:** `<your-bucket-name>.r2.cloudflarestorage.com` (or R2 Custom Domain)
  - **Proxy status:** **Proxied** (orange cloud active)
  - **TTL:** `Auto`
- [ ] Confirm all DNS records intended for web traffic have **Proxy status: Proxied**.

---

## 2. SSL / TLS & HSTS

### 2a. SSL/TLS Encryption Mode

**Dashboard Path:** **SSL/TLS** → **Overview**

- [ ] Select encryption mode: **Full (strict)**
  - Ensures end-to-end encryption between visitor → Cloudflare edge and Cloudflare edge → origin server.
  - Requires a valid SSL/TLS certificate installed at your origin (e.g., Let's Encrypt or Cloudflare Origin CA).
  - ⚠️ *Never* use "Flexible" as it transmits unencrypted HTTP to origin.

### 2b. Edge Certificates & HTTPS Enforcers

**Dashboard Path:** **SSL/TLS** → **Edge Certificates**

- [ ] **Always Use HTTPS:** Toggle **ON**
  - Automatically redirects all `http://` requests to `https://`.
- [ ] **Automatic HTTPS Rewrites:** Toggle **ON**
  - Fixes mixed-content warnings by rewriting insecure URLs.
- [ ] **Minimum TLS Version:** Select **TLS 1.2**
  - Deprecates obsolete TLS 1.0 and 1.1 protocols.
- [ ] **Opportunistic Encryption:** Toggle **ON**
- [ ] **TLS 1.3:** Toggle **ON**

### 2c. HTTP Strict Transport Security (HSTS)

**Dashboard Path:** **SSL/TLS** → **Edge Certificates** → Scroll to **HTTP Strict Transport Security (HSTS)**

- [ ] Click **Enable HSTS** (or **Change HSTS settings**)
- [ ] **Enable HSTS (Strict-Transport-Security):** Check **I understand** and proceed
- [ ] **Max-Age Header:** Set to `12 months (31536000 seconds)`
- [ ] **Apply HSTS policy to subdomains (includeSubDomains):** Toggle **ON**
- [ ] **Preload:** Toggle **ON** (allows submission to https://hstspreload.org)
- [ ] **No-Sniff:** Toggle **ON**
- [ ] Click **Save**

*(Note: HSTS is also configured directly in Next.js response headers via `next.config.ts` and `public/_headers` for defense-in-depth).*

---

## 3. Web Application Firewall (WAF) & Rate Limiting

### 3a. Rate Limiting Rules (Production Defense)

Cloudflare edge rate limiting is the primary defense line protecting your Node/serverless runtime.

**Dashboard Path:** **Security** → **WAF** → **Rate limiting rules** → Click **Create rule**

#### Rule 1: Protect Order & Verification APIs
- [ ] **Rule name:** `API Orders Rate Limit`
- [ ] **If incoming requests match:**
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/api/`
- [ ] **Rate:**
  - Requests: `30`
  - Period: `10 seconds`
- [ ] **Action:**
  - Choose: `Block`
  - Duration: `60 seconds`
  - Custom response:
    - Content type: `application/json`
    - Response code: `429`
    - Response body:
      ```json
      {"error":"Rate limit exceeded","message":"Too many requests to bookstore API. Please wait 60 seconds."}
      ```
- [ ] Click **Deploy**

#### Rule 2: Protect Login & Authentication Endpoints
- [ ] Click **Create rule**
- [ ] **Rule name:** `Login Brute Force Protection`
- [ ] **If incoming requests match:**
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/login`
- [ ] **Rate:**
  - Requests: `10`
  - Period: `60 seconds`
- [ ] **Action:**
  - Choose: `Block`
  - Duration: `120 seconds`
  - Custom response:
    - Content type: `application/json`
    - Response code: `429`
    - Response body:
      ```json
      {"error":"Rate limit exceeded","message":"Too many authentication attempts. Please try again after 2 minutes."}
      ```
- [ ] Click **Deploy**

### 3b. Managed Rulesets (WAF)

**Dashboard Path:** **Security** → **WAF** → **Managed rules**

- [ ] **Cloudflare Managed Ruleset:** Toggle **ON** (Blocks OWASP Top 10, SQLi, XSS, RCE exploits).
- [ ] **Cloudflare OWASP Core Ruleset:** Toggle **ON** (Set Paranoia Level: 1 or 2).

### 3c. Custom Firewall Rules

**Dashboard Path:** **Security** → **WAF** → **Custom rules** → Click **Create rule**

- [ ] **Rule name:** `Block Malicious Automated Scanners`
- [ ] **Expression Preview:**
  ```text
  (http.user_agent contains "sqlmap") or
  (http.user_agent contains "nikto") or
  (http.user_agent contains "masscan") or
  (http.user_agent contains "gobuster") or
  (http.user_agent eq "")
  ```
- [ ] **Action:** `Block`
- [ ] Click **Deploy**

---

## 4. Bot Protection & Integrity Checks

### 4a. Bot Fight Mode

**Dashboard Path:** **Security** → **Bots**

- [ ] **Bot Fight Mode:** Toggle **ON**
  - Automatically identifies and mitigates automated bot traffic, bad scrapers, and crawler abuse.

### 4b. Browser Integrity Check (BIC)

**Dashboard Path:** **Security** → **Settings**

- [ ] **Browser Integrity Check:** Toggle **ON**
  - Inspects request headers commonly used by spammers and anomalous user agents.
- [ ] **Security Level:** Set to **Medium** (Standard e-commerce setting).
- [ ] **Challenge Passage:** Set to **30 minutes**.

---

## 5. Cloudflare Turnstile CAPTCHA Setup

Turnstile provides non-intrusive CAPTCHA protection for `/login`, `/signup`, and checkout.

### 5a. Generate Site Key and Secret Key

**Dashboard Path:** Cloudflare Dashboard (Global sidebar) → **Turnstile** → Click **Add widget**

- [ ] **Widget name:** `Methagu Kalanjiyam Login & Order`
- [ ] **Domains:** `methagukalanjiyam.in`, `www.methagukalanjiyam.in`, `localhost` (for local development testing)
- [ ] **Widget Mode:** **Managed** (Cloudflare analyzes visitor signals and only challenges suspicious traffic)
- [ ] Click **Create**
- [ ] Copy the generated:
  - **Site Key** (`0x4AAAAAA...`)
  - **Secret Key** (`0x4AAAAAA...`)

### 5b. Configure Environment Variables

- [ ] Add the credentials to your production deployment environment (and local `.env.local`):
  ```env
  # Cloudflare Turnstile Configuration
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
  CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...
  ```
- [ ] Verify `CLOUDFLARE_TURNSTILE_SECRET_KEY` is kept private (never prefixed with `NEXT_PUBLIC_`).

### 5c. Server-Side Verification Code & Client Component

The verification helper is available at `src/lib/cloudflare.ts`:
```ts
import { verifyTurnstileToken, getClientIp } from "@/lib/cloudflare";

// Example inside an API route or Server Action:
const clientIp = getClientIp(request);
const verification = await verifyTurnstileToken(turnstileToken, clientIp);

if (!verification.success) {
  return NextResponse.json({ error: "Turnstile challenge failed" }, { status: 403 });
}
```

Client-side widget component is available at `src/components/ui/Turnstile.tsx`:
```tsx
import { Turnstile } from "@/components/ui/Turnstile";

<Turnstile
  action="login"
  onVerify={(token) => setTurnstileToken(token)}
  onExpire={() => setTurnstileToken(null)}
/>
```

---

## 6. Caching Rules (Page Rules & Cache Rules)

Configure edge caching to accelerate static assets and protect dynamic API transactions.

**Dashboard Path:** **Caching** → **Cache Rules** → Click **Create rule**

### Rule 1: Long-term Image Caching
- [ ] **Rule name:** `Cache Book Images & Covers`
- [ ] **If incoming requests match:**
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/images/`
- [ ] **Cache eligibility:** **Eligible for cache**
- [ ] **Edge TTL:** `Override origin` → `7 days` (604800 seconds)
- [ ] **Browser TTL:** `Override origin` → `1 day` (86400 seconds)
- [ ] Click **Deploy**

### Rule 2: Cache Next.js Static Chunks
- [ ] Click **Create rule**
- [ ] **Rule name:** `Cache Next Static Build Chunks`
- [ ] **If incoming requests match:**
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/_next/static/`
- [ ] **Cache eligibility:** **Eligible for cache**
- [ ] **Edge TTL:** `Override origin` → `1 month`
- [ ] **Browser TTL:** `Override origin` → `1 year`
- [ ] Click **Deploy**

### Rule 3: Bypass Cache for API & Private Sessions
- [ ] Click **Create rule**
- [ ] **Rule name:** `Bypass Cache for Private Endpoints`
- [ ] **If incoming requests match:**
  - Expression:
    ```text
    (starts_with(http.request.uri.path, "/api/")) or
    (starts_with(http.request.uri.path, "/admin/")) or
    (starts_with(http.request.uri.path, "/account/")) or
    (starts_with(http.request.uri.path, "/cart/")) or
    (starts_with(http.request.uri.path, "/login")) or
    (starts_with(http.request.uri.path, "/signup"))
    ```
- [ ] **Cache eligibility:** **Bypass cache**
- [ ] Click **Deploy**

### 6b. Tiered Cache
**Dashboard Path:** **Caching** → **Tiered Cache**
- [ ] Enable **Tiered Cache** → Choose **Smart Tiered Caching Topology**.

---

## 7. Cloudflare Native Edge Files (`_headers` & `_routes.json`)

The application includes two pre-configured native files in `public/`:

1. **`public/_headers`**:
   - Instructs Cloudflare Edge to apply immutable caching (`max-age=31536000, immutable`) to `/_next/static/*` and `*.woff2`.
   - Applies `CDN-Cache-Control` and `Cloudflare-CDN-Cache-Control` edge TTLs to `/images/*`.
   - Enforces `no-store` directly at the edge for `/api/*`, `/admin/*`, `/account/*`, `/cart/*`, `/login/*`.
   - Provides global security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, HSTS preload).

2. **`public/_routes.json`**:
   - Defines static asset routing for Cloudflare Pages.
   - Bypasses Worker function execution for `/_next/static/*`, `/images/*`, `/favicon.ico`, `/sitemap.xml`, and `/robots.txt`.
   - Guarantees 0ms worker invocation cost and instantaneous edge delivery for all static content.

---

## 8. Cloudflare Workers / Pages Configuration (`wrangler.jsonc` & `wrangler.toml`)

The repository includes both `wrangler.jsonc` and `wrangler.toml`:
- **Compatibility Date:** `2026-11-20`
- **Compatibility Flags:** `["nodejs_compat"]` (enables full Node.js standard library support on V8 isolates)
- **Smart Placement:** `{"mode": "smart"}` (Cloudflare automatically executes worker logic close to upstream databases like Supabase Mumbai `ap-south-1`)
- **Pages Build Output:** `.next`

---

## 9. Performance & Network Optimization

**Dashboard Path:** **Speed** → **Optimization**

- [ ] **Brotli Compression:** Toggle **ON**
- [ ] **Early Hints (HTTP 103):** Toggle **ON** (preloads critical font & CSS assets)
- [ ] **Auto Minify:** Check **JavaScript**, **CSS**, and **HTML**

**Dashboard Path:** **Network**

- [ ] **HTTP/2:** Toggle **ON**
- [ ] **HTTP/3 (with QUIC):** Toggle **ON** (high performance on mobile networks across India and diaspora)
- [ ] **0-RTT Connection Resumption:** Toggle **ON**
- [ ] **WebSockets:** Toggle **ON** (required for Supabase Realtime connections)
- [ ] **gRPC:** Toggle **ON** (optional)

---

## 10. Scrape Shield & Security

**Dashboard Path:** **Scrape Shield**

- [ ] **Email Address Obfuscation:** Toggle **ON** (hides support emails from mail harvesters)
- [ ] **Hotlink Protection:** Toggle **ON** (prevents external websites from hotlinking your book images)

---

## 11. Post-Launch Verification & Testing

Execute these tests to confirm readiness:

- [ ] **SSL Labs Test:**
  Visit [Qualys SSL Server Test](https://www.ssllabs.com/ssltest/analyze.html?d=methagukalanjiyam.in) → Expect **A+** grade.
- [ ] **Security Headers Test:**
  Visit [SecurityHeaders.com](https://securityheaders.com/?q=https%3A%2F%2Fmethagukalanjiyam.in) → Expect **A+** grade (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
- [ ] **CSP Console Check:**
  Open browser DevTools on `https://methagukalanjiyam.in`:
  - Check Console tab for any `Content Security Policy` violation reports.
  - Test Razorpay modal opening (`checkout.razorpay.com`).
  - Test Supabase auth / session token refresh (`*.supabase.co`).
  - Test Google Fonts rendering (`fonts.googleapis.com` / `fonts.gstatic.com`).
  - Test Video in-feed playback (`odysee.com`).
- [ ] **Rate Limiting Verification:**
  - Send 35 rapid requests to `/api/orders/create` using curl or Postman:
    ```bash
    for i in {1..35}; do curl -s -o /dev/null -w "%{http_code}\n" https://methagukalanjiyam.in/api/orders/create; done
    ```
  - Verify responses transition from `200`/`400` to `429 Too Many Requests`.
- [ ] **HSTS Preload Submission:**
  Submit `methagukalanjiyam.in` to [hstspreload.org](https://hstspreload.org/) for browser preload inclusion.
