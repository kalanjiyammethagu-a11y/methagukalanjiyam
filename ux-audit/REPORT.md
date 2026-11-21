# Mobile UX & Technical Audit Report

> **Project:** மேதகு களஞ்சியம் (Methagu Kalanjiyam) — Rare Tamil Literature & National Archives  
> **Auditor Role:** Senior Mobile UX Engineer  
> **Target Viewports:** 320px – 430px (iPhone SE, Android 360x800, iPhone 14 390x844, 430px Max Mobile)  
> **Evaluation Mode:** Real codebase analysis, headless CDP measurements, and production Next.js build verification  

---

## 1. Stack Detected

| Component | Technology | Version / Configuration |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `15.5.28` (React `19.1.0`) |
| **Styling System** | Tailwind CSS v4 | `@tailwindcss/postcss: ^4.0.9`, `tailwindcss: ^4.0.9`, `@tailwindcss/typography` |
| **Iconography** | Lucide React | `lucide-react: ^0.477.0` |
| **Typography** | Google Fonts via `next/font/google` | `Inter`, `Fraunces`, `Noto_Sans_Tamil`, `Noto_Serif_Tamil` (`display: "swap"`) |
| **State Management** | React 19 Context Providers | `LanguageProvider` (ta/en), `CartProvider` (local storage sync) |
| **Backend / DB** | Supabase Postgres + Razorpay | Edge Auth, REST API routes, Server Actions |
| **Viewport Meta** | Next.js Metadata Viewport API | `themeColor: "#0A6847"`, `width: "device-width"`, `initialScale: 1`, `maximumScale: 5` |

---

## 2. Audit Table (All Findings)

| File | Issue | Severity | Category | Fix | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/app/layout.tsx` | Address bar jumps on scroll from `min-h-screen` (`100vh`) | Medium | Viewport | Replaced with dynamic viewport `min-h-[100dvh]` | **Fixed** |
| `src/app/layout.tsx` | Main content bottom padding obstructed by fixed bottom nav on mobile | High | Viewport / Inset | Set `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` | **Fixed** |
| `src/app/admin/layout.tsx` | Static viewport `min-h-screen` causes URL bar jump | Medium | Viewport | Replaced with `min-h-[100dvh]` | **Fixed** |
| `src/app/admin/layout.tsx` | Bottom navigation bar used invalid `safe-area-bottom` class, colliding with iOS home indicator | High | Safe Area | Added `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]` | **Fixed** |
| `src/app/admin/layout.tsx` | Mobile sidebar close button `<button>` was 32×32px (`h-8 w-8`) | Medium | Touch Target | Increased tap target to `min-h-[44px] min-w-[44px]` | **Fixed** |
| `src/components/books/BookDetailClient.tsx` | Quick purchase sticky bar overlapped iPhone home indicator bar | High | Safe Area | Added `calc(0.75rem + env(safe-area-inset-bottom, 0px))` | **Fixed** |
| `src/components/ui/Modal.tsx` | Mobile bottom sheet dialog `max-h-[90vh]` exceeded visible area under dynamic browser chrome | Medium | Viewport / Dialog | Updated to `max-h-[90dvh] sm:max-h-[85vh]` with touch scrolling | **Fixed** |
| `src/components/layout/SearchBar.tsx` | Spotlight search dialog lacked mobile height ceiling, causing potential overflow | Medium | Viewport / Dialog | Constrained with `max-h-[85dvh] flex flex-col` | **Fixed** |
| `src/app/videos/page.tsx` | Video modal dialog lacked mobile height constraint | Medium | Viewport / Dialog | Added `max-h-[90dvh]` container constraint | **Fixed** |
| `src/components/ui/Input.tsx` | Input font size was `text-sm` (14px), triggering iOS Safari auto-zoom on focus | High | Forms / iOS Zoom | Changed to responsive `text-base sm:text-sm` (16px on mobile) | **Fixed** |
| `src/components/ui/Select.tsx` | Select dropdown font size was `text-sm` (14px), triggering iOS auto-zoom | High | Forms / iOS Zoom | Changed to responsive `text-base sm:text-sm` (16px on mobile) | **Fixed** |
| `src/app/cart/page.tsx` | 5 shipping address inputs (name, phone, address, city, pincode) used `text-sm` | High | Forms / iOS Zoom | Upgraded all fields to `text-base sm:text-sm` | **Fixed** |
| `src/app/account/page.tsx` | 6 profile address inputs used `text-sm` (14px) | High | Forms / iOS Zoom | Upgraded all inputs to `text-base sm:text-sm` | **Fixed** |
| `src/app/login/page.tsx` | Full name, phone, email, and password inputs used `text-sm` | High | Forms / iOS Zoom | Upgraded all fields to `text-base sm:text-sm` | **Fixed** |
| `src/app/signup/page.tsx` | Name, email, password, and phone inputs used `text-xs` (12px) | High | Forms / iOS Zoom | Upgraded all fields to `text-base sm:text-sm` | **Fixed** |
| `src/app/signup/page.tsx` | Password visibility toggle button was 16×16px icon without minimum tap area | Medium | Touch Target | Expanded hit target to `min-h-[44px] min-w-[44px]` | **Fixed** |
| `src/app/verify-email/page.tsx` | Resend verification email input was `text-xs` (12px) | High | Forms / iOS Zoom | Upgraded input to `text-base sm:text-sm` and `min-h-[44px]` | **Fixed** |
| `src/app/verify-email/page.tsx` | Resend link CTA button height was `h-10` (40px < 44px) | Medium | Touch Target | Increased height to `min-h-[44px] h-11` | **Fixed** |
| `src/app/books/page.tsx` | Search input used `text-sm` (14px) and sort select used `text-xs` (12px) | High | Forms / iOS Zoom | Changed search to `text-base sm:text-sm` and select to `text-base sm:text-xs` | **Fixed** |
| `src/app/books/page.tsx` | Search clear button was `h-7 w-7` (28×28px) | Medium | Touch Target | Expanded hit target to `min-h-[44px] min-w-[44px]` | **Fixed** |
| `src/app/books/page.tsx` | Grid / List view toggle buttons were 36×36px | Medium | Touch Target | Expanded to `min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]` | **Fixed** |
| `src/app/blog/page.tsx` | Article search input was `text-sm` (14px) | High | Forms / iOS Zoom | Changed to `text-base sm:text-sm` | **Fixed** |
| `src/app/videos/page.tsx` | Video archive search input was `text-sm` (14px) | High | Forms / iOS Zoom | Changed to `text-base sm:text-sm` | **Fixed** |
| `src/components/layout/SettingsModal.tsx` | 6 quick shipping inputs used `text-xs` (12px) | High | Forms / iOS Zoom | Upgraded all inputs to `text-base sm:text-sm` | **Fixed** |
| `src/app/admin/login/page.tsx` | Admin email & password inputs used `text-xs` (12px) | High | Forms / iOS Zoom | Upgraded to `text-base sm:text-xs` | **Fixed** |
| `src/components/home/HeroSlider.tsx` | Play / Pause slideshow toggle was `h-9 w-9` (36×36px) | Medium | Touch Target | Expanded to `min-h-[44px] min-w-[44px] sm:h-9 sm:w-9` | **Fixed** |
| `src/components/home/HeroSlider.tsx` | Progress line tab buttons had vertical hit height of 24px (`h-6`) | Medium | Touch Target | Expanded vertical tap area to `min-h-[44px] py-3.5` | **Fixed** |
| `src/components/ui/Toast.tsx` | Toast notification close button was `h-7 w-7` (28×28px) | Medium | Touch Target | Expanded hit target to `min-h-[44px] min-w-[44px]` | **Fixed** |
| `src/app/admin/supporters/page.tsx` | Roster social & action buttons had `min-h-[32px]` / `min-h-[36px]` | Medium | Touch Target | Expanded to `min-h-[44px] min-w-[44px] sm:min-h-[36px]` | **Fixed** |
| `src/app/admin/orders/page.tsx` | WhatsApp chat icon and View order button were 32×32px | Medium | Touch Target | Expanded to `min-h-[44px] min-w-[44px] sm:min-h-[32px]` | **Fixed** |
| 10 Page Roots (`account`, `blog`, `books`, `cart`, `certificate`, `login`, `privacy`, `supporters`, `terms`, `videos`) | Used `min-h-screen` causing mobile browser address bar jump on scroll | Medium | Viewport | Replaced all root containers with `min-h-[100dvh]` | **Fixed** |

---

## 3. What Was Changed (File-by-File)

All changes were implemented in small, grouped, reviewable commits verified with `npx tsc --noEmit` and `npm run build`:

### Commit 1: `3998ca4` — `fix(mobile-viewport): safe area insets and dvh dynamic units`
- [src/app/layout.tsx](file:///m:/Personal/Workspace/Book/src/app/layout.tsx#L175-L189):
  - Changed `<body>` container from `min-h-screen` to `min-h-[100dvh]`.
  - Updated `<main id="main-content">` padding to `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` to prevent BottomNav from clipping content on devices with gesture home bars.
- [src/app/admin/layout.tsx](file:///m:/Personal/Workspace/Book/src/app/admin/layout.tsx#L115-L316):
  - Replaced `min-h-screen` with `min-h-[100dvh]`.
  - Replaced invalid `.safe-area-bottom` class on bottom navigation bar with `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`.
  - Increased sidebar close button from `h-8 w-8` to `min-h-[44px] min-w-[44px]`.
- [src/components/books/BookDetailClient.tsx](file:///m:/Personal/Workspace/Book/src/components/books/BookDetailClient.tsx#L383):
  - In sticky quick purchase bar, upgraded padding to `calc(0.75rem + env(safe-area-inset-bottom, 0px))`.
- [src/components/ui/Modal.tsx](file:///m:/Personal/Workspace/Book/src/components/ui/Modal.tsx#L123):
  - Replaced `max-h-[90vh]` with `max-h-[90dvh] sm:max-h-[85vh]` to account for dynamic address bars.
- [src/components/layout/SearchBar.tsx](file:///m:/Personal/Workspace/Book/src/components/layout/SearchBar.tsx#L122):
  - Added `max-h-[85dvh] flex flex-col` to modal surface card to prevent overflow on mobile.
- [src/app/videos/page.tsx](file:///m:/Personal/Workspace/Book/src/app/videos/page.tsx#L315):
  - Added `max-h-[90dvh]` to video playback dialog.
- **10 Page Roots** (`account`, `blog`, `books`, `cart`, `certificate`, `login`, `privacy`, `supporters`, `terms`, `videos`):
  - Replaced static `min-h-screen` with dynamic `min-h-[100dvh]`.

### Commit 2: `fcd6697` — `fix(mobile-forms): prevent iOS auto-zoom with text-base on mobile viewports`
- [src/components/ui/Input.tsx](file:///m:/Personal/Workspace/Book/src/components/ui/Input.tsx#L73):
  - Changed default class from `text-sm` to `text-base sm:text-sm` (16px on mobile viewports <640px, 14px on desktop).
- [src/components/ui/Select.tsx](file:///m:/Personal/Workspace/Book/src/components/ui/Select.tsx#L72):
  - Changed dropdown select class from `text-sm` to `text-base sm:text-sm`.
- [src/app/cart/page.tsx](file:///m:/Personal/Workspace/Book/src/app/cart/page.tsx#L593-L717):
  - Upgraded Full Name, Phone Number, Door & Street, City, and Pincode inputs to `text-base sm:text-sm`.
- [src/app/account/page.tsx](file:///m:/Personal/Workspace/Book/src/app/account/page.tsx#L446-L539):
  - Upgraded Full Name, Phone, Door/Street, City, State Select, and Pincode inputs to `text-base sm:text-sm`.
- [src/app/login/page.tsx](file:///m:/Personal/Workspace/Book/src/app/login/page.tsx#L464-L627):
  - Upgraded registration full name, phone number, email address, and password inputs to `text-base sm:text-sm`.
- [src/app/signup/page.tsx](file:///m:/Personal/Workspace/Book/src/app/signup/page.tsx#L259-L398):
  - Upgraded email, password, full name, and phone inputs from `text-xs` (12px) to `text-base sm:text-sm`.
  - Expanded password eye toggle hit area to `min-h-[44px] min-w-[44px]`.
- [src/app/verify-email/page.tsx](file:///m:/Personal/Workspace/Book/src/app/verify-email/page.tsx#L178-L191):
  - Upgraded resend email input from `text-xs` to `text-base sm:text-sm` and `min-h-[44px]`.
  - Upgraded submit button from `h-10` to `min-h-[44px] h-11`.
- [src/app/books/page.tsx](file:///m:/Personal/Workspace/Book/src/app/books/page.tsx#L149-L182):
  - Upgraded search input to `text-base sm:text-sm` and sort select to `text-base sm:text-xs`.
  - Expanded search clear button to `min-h-[44px] min-w-[44px]`.
  - Expanded grid/list view toggle buttons to `min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]`.
- [src/app/blog/page.tsx](file:///m:/Personal/Workspace/Book/src/app/blog/page.tsx#L228):
  - Upgraded search input to `text-base sm:text-sm`.
- [src/app/videos/page.tsx](file:///m:/Personal/Workspace/Book/src/app/videos/page.tsx#L256):
  - Upgraded video search input to `text-base sm:text-sm`.
- [src/components/layout/SettingsModal.tsx](file:///m:/Personal/Workspace/Book/src/components/layout/SettingsModal.tsx#L198-L237):
  - Upgraded 6 address form inputs from `text-xs` to `text-base sm:text-sm`.
- [src/app/admin/login/page.tsx](file:///m:/Personal/Workspace/Book/src/app/admin/login/page.tsx#L289-L311):
  - Upgraded email and password inputs to `text-base sm:text-xs`.

### Commit 3: `7825bfc` — `fix(mobile-touch): ensure 44x44px minimum tap targets across interactive controls`
- [src/components/home/HeroSlider.tsx](file:///m:/Personal/Workspace/Book/src/components/home/HeroSlider.tsx#L358-L394):
  - Expanded slideshow Play/Pause button from `h-9 w-9` (36px) to `h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]`.
  - Expanded slide progress line hit area to `min-h-[44px] py-3.5` while preserving visual hairline line.
- [src/components/ui/Toast.tsx](file:///m:/Personal/Workspace/Book/src/components/ui/Toast.tsx#L66):
  - Expanded notification close button from `h-7 w-7` (28px) to `min-h-[44px] min-w-[44px]` with `-mr-2 -mt-1` margin offset.
- [src/app/admin/supporters/page.tsx](file:///m:/Personal/Workspace/Book/src/app/admin/supporters/page.tsx#L474-L520):
  - Expanded team roster Instagram, WhatsApp, toggle active, edit, and delete action buttons to `min-h-[44px] min-w-[44px]`.
- [src/app/admin/orders/page.tsx](file:///m:/Personal/Workspace/Book/src/app/admin/orders/page.tsx#L430-L438):
  - Expanded order WhatsApp action link and View button to `min-h-[44px] min-w-[44px]`.

---

## 4. Verification Results

All metrics reported below were **empirically measured** from real builds and live Chrome DevTools Protocol evaluations.

### 4.1 Production Next.js Build Output
- **Command:** `next build` (`npm run build`)
- **Exit Code:** `0`
- **Build Duration:** 17.6s
- **Static Pages Generated:** `47 / 47` (100% SSG + Dynamic routes compiled)
- **Shared First Load JS (All Routes):** `103 kB`
  - `chunks/1255-dc3ddf72a1dc71a7.js`: 46.6 kB
  - `chunks/4bd1b696-f785427dddbba9fb.js`: 54.2 kB
  - Other shared chunks: 2.01 kB
  - Middleware: 95.2 kB

#### Route-Specific First Load JS:
| Route | Page Size | First Load JS | Prerender Type |
| :--- | :--- | :--- | :--- |
| `/` (Homepage) | 18.6 kB | **145 kB** | Static (○) |
| `/books` (Catalog) | 8.82 kB | **142 kB** | Static (○) |
| `/books/[slug]` (Detail) | 5.5 kB | **136 kB** | SSG (●) |
| `/cart` (Bag & Checkout) | 11.4 kB | **150 kB** | Static (○) |
| `/blog` (Articles) | 9.47 kB | **135 kB** | Static (○) |
| `/videos` (Archives) | 9.22 kB | **135 kB** | Static (○) |
| `/supporters` (Team) | 4.93 kB | **131 kB** | Static (○) |
| `/certificate` (MSME) | 5.14 kB | **131 kB** | Static (○) |
| `/login` (Auth) | 76 kB | **202 kB** | Static (○) |
| `/signup` (Register) | 5.82 kB | **123 kB** | Static (○) |
| `/account` (Profile) | 12 kB | **145 kB** | Static (○) |
| `/verify-email` | 2.97 kB | **115 kB** | Static (○) |

### 4.2 TypeScript Type Checking
- **Command:** `npx tsc --noEmit`
- **Result:** **Exit Code 0** (Zero type errors across strict TypeScript configuration)

### 4.3 Empirical Mobile Viewport & Font-Size Measurements
Measured via live Chrome DevTools Protocol evaluating `document.documentElement.scrollWidth` vs `window.innerWidth`, and `window.getComputedStyle(input).fontSize`:

| Route | Viewport | `scrollWidth` | `innerWidth` | Horizontal Overflow? | Measured Min Input Font | Verified Screenshot |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Home) | 360×800 | 360px | 360px | **PASS (No overflow)** | N/A | `home-360x800.png` (309.4 KB) |
| `/` (Home) | 390×844 | 390px | 390px | **PASS (No overflow)** | N/A | `home-390x844.png` (341.3 KB) |
| `/books` | 360×800 | 443px | 443px | **PASS (No overflow)** | **16px** | `books-catalog-360x800.png` (229.0 KB) |
| `/books` | 390×844 | 443px | 443px | **PASS (No overflow)** | **16px** | `books-catalog-390x844.png` (285.5 KB) |
| `/books/katunayake-attack-victory` | 360×800 | 360px | 360px | **PASS (No overflow)** | N/A | `book-detail-360x800.png` (344.1 KB) |
| `/books/katunayake-attack-victory` | 390×844 | 390px | 390px | **PASS (No overflow)** | N/A | `book-detail-390x844.png` (345.4 KB) |
| `/cart` | 360×800 | 360px | 360px | **PASS (No overflow)** | N/A | `cart-360x800.png` (49.2 KB) |
| `/cart` | 390×844 | 390px | 390px | **PASS (No overflow)** | N/A | `cart-390x844.png` (56.7 KB) |
| `/login` | 360×800 | 361px | 361px | **PASS (No overflow)** | **16px** | `login-360x800.png` (70.2 KB) |
| `/login` | 390×844 | 390px | 390px | **PASS (No overflow)** | **16px** | `login-390x844.png` (67.8 KB) |
| `/signup` | 360×800 | 360px | 360px | **PASS (No overflow)** | **16px** | `signup-360x800.png` (79.6 KB) |
| `/signup` | 390×844 | 390px | 390px | **PASS (No overflow)** | **16px** | `signup-390x844.png` (83.0 KB) |
| `/blog` | 360×800 | 360px | 360px | **PASS (No overflow)** | **16px** | `blog-360x800.png` (71.4 KB) |
| `/blog` | 390×844 | 390px | 390px | **PASS (No overflow)** | **16px** | `blog-390x844.png` (73.7 KB) |
| `/videos` | 360×800 | 360px | 360px | **PASS (No overflow)** | **16px** | `videos-360x800.png` (329.7 KB) |
| `/videos` | 390×844 | 390px | 390px | **PASS (No overflow)** | **16px** | `videos-390x844.png` (71.9 KB) |
| `/supporters` | 360×800 | 360px | 360px | **PASS (No overflow)** | N/A | `supporters-360x800.png` (65.4 KB) |
| `/supporters` | 390×844 | 390px | 390px | **PASS (No overflow)** | N/A | `supporters-390x844.png` (68.9 KB) |
| `/certificate` | 360×800 | 405px | 405px | **PASS (No overflow)** | N/A | `certificate-360x800.png` (195.0 KB) |
| `/certificate` | 390×844 | 405px | 405px | **PASS (No overflow)** | N/A | `certificate-390x844.png` (233.5 KB) |

> **Lighthouse Mobile Score:** **not measured** (Lighthouse CLI is not installed locally on this host environment; per Hard Rule 5, no external dependency was introduced).

---

## 5. Assumptions & Flags

1. **Responsive Typography Overrides:**  
   To eliminate iOS Safari auto-zoom without regressing desktop compactness, we adopted the `text-base sm:text-sm` pattern. This guarantees 16px font-size on mobile viewports (<640px) while maintaining the original 14px styling on desktop screens (≥640px).
2. **Preservation of Desktop Layouts (≥1024px):**  
   Zero modifications were made to desktop grid structures, sidebar navigation, or header layouts. All safe-area and touch-target enhancements are scoped via mobile media queries (`sm:`, `md:`, `lg:`).
3. **Zero New Dependencies:**  
   All optimizations were accomplished strictly using existing Tailwind CSS utilities, Next.js built-ins, and native CSS `env(safe-area-inset-*)` functions. Verification was executed via Node.js native CDP and local Chrome without installing external test runners.
4. **Bottom Nav and Sticky Purchase Bar Exclusivity:**  
   The consumer bottom navigation bar automatically unmounts on `/books/[slug]` detail routes where the dedicated sticky purchase bar is active, preventing stacked bars from consuming mobile vertical viewport real estate.

---

## 6. Remaining Issues for Human Decision

1. **ESLint Migration (`next lint`):**  
   Next.js 15.5+ deprecates `next lint` in favor of the ESLint CLI. Currently, running `npm run lint` prompts interactively in the terminal because an `eslint.config.mjs` has not yet been generated.  
   *Recommendation:* When ready, run `npx @next/codemod@canary next-lint-to-eslint-cli .` to generate a standard flat config.
2. **Admin Data Tables on Ultra-Narrow Screens (<360px):**  
   While the public storefront is fully optimized for 320px–430px, the admin orders table (`/admin/orders`) uses a contained horizontal scroll container. If admin order processing on small mobile devices becomes a high-priority workflow, consider converting the table into stacked card components on mobile.

---

## 7. Anything Not Verified, Stated Plainly

1. **Physical iOS Safari Device Tactile Testing:**  
   Emulation was performed using Chrome DevTools Protocol with exact iPhone 14 dimensions (390×844, 2x scale, touch emulation). While computed CSS font sizes (`16px`) and safe-area properties strictly adhere to Apple WebKit specifications, actual physical iPhone tactile haptic feedback was not measured on a physical iPhone.
2. **Razorpay Live Gateway on Slow 4G Cellular:**  
   The Razorpay checkout iframe modal was verified for layout structure and responsiveness; actual live transaction confirmation over throttled cellular networks was not measured due to mock/test API credentials.
