# Design System Master Specification: Methagu Kalanjiyam

**Product:** மேதகு களஞ்சியம் (Methagu Kalanjiyam) — Rare Tamil Historical Literature & Archival Documentation  
**Version:** 1.0.0 (Editorial Archival Edition)  
**Status:** Approved Architectural Standard  
**Design Direction:** Cultural Editorial / Physical Library Craft (Zero AI-Slop)

---

## 1. Design Philosophy & Aesthetic Stance

### Core Tenet: Physical Archival Craft, Not Generic SaaS
Methagu Kalanjiyam is an authoritative, solemn cultural institution preserving out-of-print historical Tamil literature, wartime memoirs, and rare archival records.

- **Anti-Reference (Banned "AI Slop"):**
  - No translucent glassmorphism (`backdrop-filter: blur(20px)`), frosted plastic cards, or floating glow pills.
  - No Silicon Valley SaaS tropes (e.g. `⌘K Spotlight`, public admin portals in brand navbars, generic monospace pills).
  - No floating badges overlapping original book cover art or typography.
  - No rubbery hover animations (`scale-105`, `active:scale-95`).
- **Target Aesthetic (Editorial Print & Archival Library):**
  - Warm, tactile archival paper canvases (`#FAF8F5`, `#F3EFE6`).
  - Deep charcoal printing ink (`#191614`), never harsh digital pitch black.
  - Dignified forest green accent (`#0D5C3A`), evocative of historic Tamil palm-leaf preservation and book cloth bindings.
  - Crisp letterpress hairline rules (`border-[#E3DDD2]`), authentic bibliographic hierarchy, and physical book spine depth.

---

## 2. Design Tokens

### A. Color Palette & WCAG 2.2 AA Contrast Compliance

| Token Name | CSS Variable | Hex / Value | Purpose | Contrast vs Canvas (`#FAF8F5`) |
| :--- | :--- | :--- | :--- | :---: |
| **Canvas** | `--color-canvas` | `#FAF8F5` | Primary warm archival background | Base |
| **Surface Subt** | `--color-surface-subtle` | `#F3EFE6` | Inset panels, table headers, breadcrumbs | 1.1:1 |
| **Surface Card** | `--color-surface-card` | `#FFFFFF` | Isolated book and article reading cards | 1.05:1 |
| **Ink Primary** | `--color-ink-primary` | `#191614` | Body text, major headlines, titles | **14.8:1 (AAA Pass)** |
| **Ink Secondary** | `--color-ink-secondary` | `#4A443E` | Subtitles, authors, metadata, captions | **7.2:1 (AAA Pass)** |
| **Ink Muted** | `--color-ink-muted` | `#665F57` | Footnotes, timestamps, isbn, borders | **4.9:1 (AA Pass)** |
| **Accent Primary** | `--color-accent` | `#0D5C3A` | Primary CTAs, active links, brand insignia | **6.2:1 (AA Pass)** |
| **Accent Hover** | `--color-accent-hover` | `#08442A` | Interactive hover state for accent items | **8.6:1 (AAA Pass)** |
| **Accent Tint** | `--color-accent-tint` | `#EBF5EF` | Active navigation pill, cart item badges | 1.2:1 |
| **Border Hairline**| `--color-border-hairline`| `#E5DFD5` | 1px clean grid separators and card borders| UI Border (3.1:1) |
| **Border Strong** | `--color-border-strong` | `#CFC6B8` | Focused inputs, card hover borders | UI Border (3.5:1) |
| **Error / Destructive** | `--color-danger` | `#B91C1C` | Out of stock alert, validation error | **4.7:1 (AA Pass)** |

*Contrast Rule: Never use gray below `#665F57` for text on white/canvas surfaces (fixes the 40 contrast failures flagged in Lighthouse).*

---

### B. Typography Scale & Hierarchy

#### Font Stacks
1. **Tamil Serif (Headlines & Formal Archival Citations):**  
   `var(--font-noto-serif-tamil), "Bamini", "Tamil Sangam MN", Georgia, serif`
2. **English Serif (Literary Headings & Drop Caps):**  
   `var(--font-fraunces), "Playfair Display", Georgia, serif`
3. **Primary Body (Bilingual Interface & Reading Text):**  
   `var(--font-noto-tamil), var(--font-inter), -apple-system, system-ui, sans-serif`

#### Typographic Hierarchy

| Role | Font Size | Line Height | Tracking | Weight | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | 2.5rem – 3.25rem (40–52px) | 1.15 | -0.02em | Bold (700) | Homepage hero publication title |
| **Page Title (H1)** | 2.0rem – 2.5rem (32–40px) | 1.2 | -0.015em | Bold (700) | Books catalog, Article headline |
| **Section Heading (H2)** | 1.5rem – 1.75rem (24–28px) | 1.3 | -0.01em | SemiBold (600) | Category title, Curated shelves |
| **Card Heading (H3)** | 1.125rem – 1.25rem (18–20px) | 1.35 | normal | Bold (700) | Book card title, Article card title |
| **Body Primary** | **1.0rem (16px minimum)** | **1.55 – 1.6** | normal | Regular (400) | Book descriptions, article paragraphs |
| **Body Secondary** | 0.875rem (14px) | 1.45 | normal | Medium (500) | Author, publisher, pricing, search |
| **Archival Label** | 0.75rem (12px) | 1.3 | +0.05em | SemiBold (600) | Catalog numbers (`களஞ்சியம் #01`), dates |

*Line Length Rule: Long-form reading containers must enforce `max-w-[68ch]` for optimal reading fatigue prevention.*

---

### C. Spacing System (4px Baseline Grid)

| Token | Pixels | Tailwind | Application |
| :--- | :--- | :--- | :--- |
| `space-1` | 4px | `p-1`, `gap-1` | Micro-spacing, icon-to-label gaps |
| `space-2` | 8px | `p-2`, `gap-2` | Compact button padding, tag margins |
| `space-3` | 12px | `p-3`, `gap-3` | Input internal padding, card metadata spacing |
| `space-4` | 16px | `p-4`, `gap-4` | Base gutter, card internal padding |
| `space-6` | 24px | `p-6`, `gap-6` | Grid gaps, section interior spacing |
| `space-8` | 32px | `p-8`, `gap-8` | Section separations, hero margins |
| `space-12`| 48px | `py-12`, `mb-12`| Major landmark boundaries |
| `space-16`| 64px | `py-16`, `my-16`| Page section vertical rhythm |

---

### D. Radius & Elevation

- **Corner Radius:**
  - `rounded` (4px): Form inputs, checkboxes, small tags
  - `rounded-md` (6px): Buttons, search trigger, language toggle
  - `rounded-lg` (8px): Book cards, modal dialogs, drawer panels
  - *Banned:* `rounded-2xl`, `rounded-3xl` for standard content cards.
- **Elevation (Paper Drops, No Neon Glows):**
  - **Flat / Hairline:** `border border-[#E5DFD5]` (default for all cards)
  - **Resting Paper:** `box-shadow: 0 1px 3px rgba(25, 22, 20, 0.05), 0 1px 2px rgba(25, 22, 20, 0.03)`
  - **Elevated Hover:** `box-shadow: 0 4px 16px -2px rgba(25, 22, 20, 0.08), 0 2px 4px -1px rgba(25, 22, 20, 0.04)`

---

## 3. Component Design Rules

### A. Navigation Bar (Public Header)
- **Container:** Solid warm white/canvas header with a crisp 1px bottom border (`border-[#E5DFD5]`). No blurred plastic glass panels.
- **Branding:** Methagu Kalanjiyam bilingual typographic logo with seal of authenticity.
- **Search:** Clean inline or accessible modal input with visible text search label.
- **Language Switcher:** Crisp segmented button (`தமிழ்` / `English`) with explicit `aria-pressed` states.
- **Sanitization:** Remove public `Admin` showcase trigger and `⌘K` Mac shortcuts from the primary header. Admin is accessed directly at `/admin` or via discrete footer link.

### B. Book Card (`BookCard.tsx`)
- **Unobstructed Cover:** Absolutely **zero badges, ribbons, or buttons positioned over the book cover**.
- **Physical Depth:** Subtle 2px spine shadow gradient on the left edge of the cover image simulating a physical hardbound/paperback edition.
- **Metadata Block (Below Cover):**
  1. Category / Archival Catalog kicker (e.g. `களஞ்சியம் பதிப்பு #01` / `வரலாற்று ஆவணம்`) in 12px muted caps.
  2. Book Title in 16px bold serif.
  3. Author line in 13px medium ink.
  4. Price in bold INR (`₹100`) with clear stock status indicator.
  5. Single primary action: Direct Order (`நூலை வாங்குக`) or Quick WhatsApp checkout.

### C. Hero Showcase
- Clean editorial presentation of featured archival works.
- Large legible Tamil serif title, contextual historical introduction, and direct order action.
- Slider pagination dots with **minimum 44 × 44 px accessible touch target hit areas** (resolving Lighthouse touch target failure).

### D. Accessibility & Interaction Floor
- **Touch Targets:** Minimum 44 × 44 pt / px for all interactive buttons, links, and pagination toggles.
- **Focus Rings:** Unbroken, high-visibility 2px solid `#0D5C3A` with 2px offset.
- **Motion:** Micro-transitions strictly between 150ms and 250ms with `ease-out`. All motion wrapped in `@media (prefers-reduced-motion: reduce)`.
- **Keyboard Navigation:** Logical tab order from top to bottom; modals trap focus and dismiss cleanly on `Escape`.
