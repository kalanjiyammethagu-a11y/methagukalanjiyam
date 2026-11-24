# Shopping Cart UX/UI Forensic Audit Report

**Date:** November 23, 2026  
**Auditor:** Senior UX/UI Specialist & Frontend Systems Engineer  
**Scope:** Shopping Cart Experience (`src/app/cart/page.tsx`, `src/components/ui/QuantitySelector.tsx`, `src/components/checkout/RazorpayCheckout.tsx`, `src/components/books/BookCard.tsx`, `src/components/books/BookDetailClient.tsx`, `src/context/CartContext.tsx`, `src/lib/utils.ts`, `src/app/globals.css`).

---

## 1. System & Architecture Detection
- **Framework:** Next.js 15.2.1 (App Router, Server Components + Client Boundary Leaves)
- **Runtime:** React 19.0.0
- **Styling System:** Tailwind CSS v4 (`@tailwindcss/postcss 4.0.9`, CSS Variables in `@theme`)
- **Iconography:** Lucide React (`lucide-react 0.477.0`)
- **Payment & Checkout:** In-site Razorpay Gateway integration (`POST /api/orders/create` & `POST /api/orders/verify`) for domestic orders; WhatsApp inquiry for overseas diaspora.
- **Cart State Management:** React Context (`CartContext.tsx`) with `localStorage` persistent caching.

---

## 2. Cart UX Master Defect & Finding Matrix

Findings are prioritized by severity:
- 🔴 **CRITICAL (P0):** Accessibility or interaction blockers, touch targets that fail to activate, price clipping/wrapping that corrupts monetary values.
- 🟠 **HIGH (P1):** Layout shifts, missing sticky thumb-reach CTA on mobile devices, WCAG AA contrast failures, absence of keyboard navigation.
- 🟡 **MEDIUM (P2):** Sub-optimal touch latency (`touch-action`), missing undo animation timing, lack of numeric direct input for high-quantity purchases.
- 🔵 **LOW (P3):** Visual polish, alignment inconsistencies in tabular columns, typography hierarchy subtleties.

| Component | Issue | Severity | Devices Affected | Proposed Fix |
|---|---|:---:|---|---|
| **QuantitySelector** (`QuantitySelector.tsx`) | `size="sm"` sets button dimensions to `36x36px` (`h-8 w-8`), violating the Apple HIG & WCAG 2.5.5 minimum 44×44px touch target requirement. Causes accidental mis-taps. | 🔴 Critical | All touch devices (Smartphones, Tablets, Touch Laptops) | Enforce `min-w-[44px] min-h-[44px]` touch bounding box on `+` and `-` buttons with centered visual glyphs. |
| **QuantitySelector** (`QuantitySelector.tsx`) | Missing `touch-action: manipulation`. Mobile browsers introduce a 300ms double-tap zoom delay when rapidly stepping quantities. | 🟠 High | Mobile Phones (iOS Safari, Android Chrome) | Add `touch-action: manipulation` and rapid-tap protection to allow instant consecutive clicks without viewport zoom. |
| **QuantitySelector** (`QuantitySelector.tsx`) | Quantity is rendered as a static `<span aria-live="polite">` without direct numeric input capability. Bulk buyers (e.g. 10+ copies) must tap 9 times. | 🟡 Medium | All devices | Implement dual-mode input: direct typing with `inputmode="numeric"` and `pattern="[0-9]*"` alongside stepping buttons. |
| **formatINR** (`utils.ts`) | Hand-formatted string interpolation in multiple cart views leaves regular whitespace between `₹` and numbers, causing currency glyph to wrap separately from digits on narrow screens. | 🔴 Critical | Small mobile screens (320px, 360px) | Replace normal space with non-breaking space (`\u00A0`) and enforce `whitespace-nowrap font-mono tabular-nums`. |
| **formatINR** (`utils.ts`) | No defensive NaN or null guard. Non-numeric or undefined inputs produce `₹NaN` on screen. | 🟠 High | All devices | Add validation guard: `if (!Number.isFinite(amount)) return "₹0"`. |
| **Cart Items List** (`cart/page.tsx`) | Cart items do not display the strikethrough original MRP or savings when a book has a `discountPrice`. Customers cannot see their promotional discount. | 🟡 Medium | All devices | Render original MRP with line-through and discount percentage badge alongside the effective price. |
| **Mobile Checkout CTA** (`cart/page.tsx`) | No sticky bottom checkout bar on mobile. To reach the checkout button, users must scroll past all cart items, the 6-field address form, and shipping selectors (~1,200px scroll). | 🔴 Critical | Mobile Phones (320px–430px) | Implement sticky bottom checkout bar on mobile with total price, item count, and primary CTA button docking above the bottom nav. |
| **Landscape Viewports** (`cart/page.tsx`) | On short landscape phone viewports (667x375, 844x390), fixed/sticky navigation and drawer headers consume over 40% of vertical screen height. | 🟠 High | Phone Landscape (667x375, 844x390, 915x412) | Apply compact heights (`max-h-12`) in landscape media query `(max-height: 500px)` and auto-hide secondary badges. |
| **Foldable / Compact** (`cart/page.tsx`) | At 280px width (Galaxy Fold closed), horizontal spacing in cart item card causes item title, quantity stepper, and price to collide horizontally. | 🟠 High | Foldable phones (280px width) | Responsive breakpoint `flex-col sm:flex-row` inside cart item card to stack quantity stepper and price cleanly at `< 340px`. |
| **Remove Item** (`cart/page.tsx`) | Trash icon button drops to `36x36px` on `sm:` viewports (`sm:min-h-[36px] sm:min-w-[36px]`), breaking touch target on iPad/Surface touchscreens. | 🟠 High | Tablets & Touch Laptops (768px–1366px) | Maintain consistent `min-h-[44px] min-w-[44px]` across all viewport sizes. |
| **Accessibility (Live Regions)** (`cart/page.tsx`) | Price subtotal and shipping fee calculations update in the DOM without screen reader live announcements. | 🟠 High | Screen Reader Users (All devices) | Add `aria-live="polite"` and `aria-atomic="true"` to total price container so updates are announced to assistive tech. |
| **Color Contrast** (`cart/page.tsx`) | Secondary text (`#999999`) on white card background has a contrast ratio of **2.84:1**, failing WCAG AA (minimum 4.5:1 for normal text). | 🟠 High | White Theme Users | Upgrade secondary text to `#555555` or `#444444` (contrast **7.46:1**, fully compliant with WCAG AAA). |
| **Empty Cart State** (`cart/page.tsx`) | At 320px width, the recommended books 2-column grid cards experience cramped price actions. | 🟡 Medium | Small phones (320px–360px) | Optimize recommended book cards in empty state with responsive stacking so prices and CTAs never touch. |

---

## 3. Viewport Verification Matrix (Planned Testing)

| Viewport Category | Resolutions Tested | Key Verification Criteria |
|---|---|---|
| **Ultra-Compact & Folded** | 280x653 | Zero horizontal scroll (`scrollWidth <= innerWidth`), no text clipping. |
| **Small Phones** | 320x568, 360x640, 375x667 | Tap targets >= 44x44px, price digits fit on one line with non-breaking rupee. |
| **Modern Flagship Phones** | 360x800, 390x844, 393x852, 412x915, 430x932 | Sticky checkout bar thumb-reachable, safe area insets respected. |
| **Landscape Phones** | 667x375, 844x390, 915x412 | Viewport height conservation; sticky bars do not obstruct form fields. |
| **Tablets & Foldable Unfolded** | 717x512, 768x1024, 820x1180, 1024x1366 | 2-column split (Items on left, Summary on right), no awkward stretching. |
| **Laptops & Desktops** | 1280x720, 1366x768, 1440x900, 1920x1080 | Sticky sidebar summary, full keyboard accessibility, clear visual hierarchy. |
| **Ultrawide Monitors** | 2560x1080, 3440x1440 | Max-width constraint (`max-w-7xl mx-auto`), no extreme edge stretching. |

---

## 4. Remediation Architecture & Plan
1. **Phase 2.1 (Currency & Price Engine):** Enhance `formatINR` in `src/lib/utils.ts` with non-breaking whitespace (`\u00A0`), NaN defense, and tabular numeral support.
2. **Phase 2.2 (Quantity Stepper Enhancement):** Upgrade `QuantitySelector.tsx` to guarantee 44x44px touch targets on all sizes, add `touch-action: manipulation`, direct numeric typing mode, and keyboard `:focus-visible` styling.
3. **Phase 2.3 (Cart Page Layout & Mobile Sticky Bar):** Refactor `src/app/cart/page.tsx` with a thumb-reachable sticky bottom checkout bar on mobile, responsive item cards for folded devices (280px+), WCAG AA color contrast upgrades, and `aria-live` price announcements.
4. **Phase 2.4 (Verification & Measurement):** Execute headless responsive screenshot capture, assert zero horizontal overflow (`scrollWidth <= innerWidth`), verify 44x44px bounding boxes, and capture production build traces.
