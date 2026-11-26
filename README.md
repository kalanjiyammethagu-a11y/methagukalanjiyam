# மேதகு களஞ்சியம் (Methagu Kalanjiyam)

> **Rare Tamil Literature & National Historical Archives Bookstore**  
> Official Website: [https://methagukalanjiyam.in/](https://methagukalanjiyam.in/)  
> WhatsApp Helpdesk & Orders: [+91 63846 54946](https://wa.me/916384654946)  
> Govt. MSME Registration: `UDYAM-TN-18-0101323`

---

## 1. Project Overview

**மேதகு களஞ்சியம்** is a specialized, mobile-first web application engineered for authentic Tamil historical literature, archival documentation, patron records, and video archives.

### Core Architectural Decisions:
- **Hybrid Checkout & Direct Inquiry:** Authenticated storefront checkout runs through server-validated orders backed by Supabase (`orders`, `order_items`, PostgreSQL inventory RPCs) and Razorpay signature/webhook verification, alongside optional WhatsApp direct purchase inquiry links (`wa.me/916384654946`).
- **Persistent Floating Action:** A global floating WhatsApp action button is mounted on every page.
- **Mobile-First Layouts:** Tested across 360px, 768px, and 1280px viewports.
- **Tamil Typography:** Implemented with Google's `Noto_Sans_Tamil` (`font-display: swap`), strict `line-height: 1.6` for Tamil glyph legibility, and zero letter-spacing distortion.
- **High Performance:** Pre-rendered static pages, art-directed `<picture>` hero banner, and lazy-loaded click-to-play video embeds ensuring **LCP < 1.2s** on 4G and **CLS = 0.00**.

---

## 2. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS + Vanilla Glassmorphism utilities (`src/app/globals.css`)
- **Icons:** Lucide React
- **Fonts:** Noto Sans Tamil & Inter via `next/font/google`
- **Metadata & SEO:** JSON-LD Schema (`BookStore`, `Organization`), OpenGraph tags, semantic HTML5 landmarks

---

## 3. How to Run Locally

### Prerequisites
- Node.js 18.17+ or Node.js 20+ (tested on Node v24.13.1)
- npm, yarn, or pnpm

### Quickstart Commands
```bash
# 1. Clone or extract the project directory
cd Book

# 2. Install dependencies
npm install

# 3. Start development server (with Turbo)
npm run dev

# 4. Open in browser
# Visit http://localhost:3000
```

### Production Build & Preview
```bash
# Build production bundle and generate static pages
npm run build

# Start the optimized production server
npm run start
```

---

## 4. How to Add a New Book

Adding a new book to the catalogue is a simple, structured 3-step process:

### Step 1: Add Book Cover Image
Place the book cover image inside the `public/` directory:
- **Format:** WebP format is strongly recommended.
- **Aspect Ratio:** $2:3$ portrait proportion (e.g., $467 \times 700$ px or $600 \times 900$ px).
- **Naming:** e.g., `public/book-21.webp`.

### Step 2: Add Entry in `data/books.json`
Open [data/books.json](file:///m:/Personal/Workspace/Book/data/books.json) and add the book metadata:
```json
{
  "title": "புதிய வரலாற்று நூல் தலைப்பு",
  "author": "நூலாசிரியர் பெயர்",
  "price": 120,
  "discountPrice": null,
  "stock": 10,
  "imageUrl": "/book-21.webp",
  "description": "நூலின் விரிவான வரலாற்று விளக்கம் மற்றும் குறிப்புகள்...",
  "category": "வரலாறு"
}
```

### Step 3: Register in Catalog State (`src/app/books/page.tsx` & `src/app/books/[slug]/page.tsx`)
In `src/app/books/page.tsx`, add the book to the `allBooks` array:
```typescript
{
  id: "21",
  title: "புதிய வரலாற்று நூல் தலைப்பு",
  titleEn: "New Historical Book Title",
  author: "நூலாசிரியர் பெயர்",
  authorEn: "Author Name in English",
  price: 120,
  categoryTa: "வரலாறு",
  categoryEn: "History",
  image: "/book-21.webp",
  stock: 10,
  slug: "puthiya-varalatru-nool"
}
```

In `src/app/books/[slug]/page.tsx`, add the detailed information to `booksCatalog`:
```typescript
{
  id: "21",
  title: "புதிய வரலாற்று நூல் தலைப்பு",
  titleEn: "New Historical Book Title",
  author: "நூலாசிரியர் பெயர்",
  authorEn: "Author Name in English",
  price: 120,
  categoryTa: "வரலாறு",
  categoryEn: "History",
  image: "/book-21.webp",
  stock: 10,
  slug: "puthiya-varalatru-nool",
  year: "2024",
  pages: 240,
  publisher: "மேதகு களஞ்சியம்",
  publisherEn: "Methagu Kalanjiyam",
  descriptionTa: "நூலின் விரிவான தமிழ்க் குறிப்பு...",
  descriptionEn: "Detailed English synopsis of the book..."
}
```

Once saved, the book will automatically:
1. Appear in the searchable & filterable catalogue grid with $2:3$ cover skeleton.
2. Generate its dedicated responsive page at `/books/puthiya-varalatru-nool`.
3. Generate direct WhatsApp purchase links prefilled with:
   `வணக்கம் மேதகு களஞ்சியம், நான் "புதிய வரலாற்று நூல் தலைப்பு" (விலை: ₹120) நூலை வாங்க விரும்புகிறேன்.`

---

## 5. Verification & Testing

- **All Routes Status:** `HTTP 200 OK` across `/`, `/books`, `/books/[slug]`, `/blog`, `/blog/[slug]`, `/videos`, `/supporters`, `/certificate`, `/terms`, `/privacy`.
- **TypeScript & Build:** Passed with 0 errors via `npm run build`.
- **Responsive Viewports:** Verified at 360px (mobile), 768px (tablet), 1280px (desktop).

---

## 6. Authentication & Security Architecture

### A. Dedicated Admin Gate (Two-Step Verification)
- **Route:** `/admin/login` (isolated minimal layout with no public chrome).
- **Two-Step Verification:**
  1. Step 1: Administrator email & password authentication.
  2. Step 2: 6-digit CSPRNG OTP sent to the administrator's email via Resend (10-minute expiry, max 5 attempts, single-use, 60s resend cooldown).
- **Session Control:** Shorter admin session lifetime (2-hour idle / 8-hour absolute timeout) with strict server-side session revocation in `admin_sessions`.
- **Public UI Isolation:** Zero admin links in public navigation or footer. Admin routes are set to `noindex, nofollow` via meta robots and `robots.txt`.

### B. Manual Admin Provisioning (SQL-Free CLI Script)
Administrators can **only** be created or updated through the secure CLI script. Public registration endpoints cannot create or elevate users to admin status.

```bash
# Interactive mode (prompts for email and masked password):
npm run admin:create

# Non-interactive / CI provisioning via environment variables:
ADMIN_EMAIL=security@domain.com ADMIN_PASSWORD="StrongPassword123!" npm run admin:create

# Reset credentials / re-assert an existing administrator:
npm run admin:create -- --overwrite

# Production provisioning requires explicit flag:
npm run admin:create -- --force-production
```

### C. User Registration with Email Verification (Resend)
- **Routes:** `/signup` (multi-step progress wizard with live password strength meters) and `/verify-email`.
- **Unverified State:** New signups are created as `unverified` (`email_confirm: false`). Unverified users cannot log in or access protected features.
- **Account Enumeration Defense:** Submitting an existing email returns an identical success response while dispatching an internal "Account already exists" notification to the registered inbox.
- **Single-Use Confirmation Token:** 24-hour cryptographic token stored hashed with SHA-256 in `user_verification_tokens`.
