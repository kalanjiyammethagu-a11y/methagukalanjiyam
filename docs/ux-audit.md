# Comprehensive UX/UI Audit & Prioritized Optimization Plan

**Product:** மேதகு களஞ்சியம் (Methagu Kalanjiyam)  
**Date:** 2026-11-01  
**Auditor:** Principal Product Designer & Senior Frontend Engineer  
**Scope:** Full-stack UI/UX, Design Systems, WCAG 2.2 AA Accessibility, Core Web Vitals  
**Branch:** `ux/optimization-pass`

---

## 1. Baseline Metrics Summary (Empirically Measured)

| Metric | Mobile Value | Desktop Value | Tool / Source | Status |
| :--- | :---: | :---: | :--- | :---: |
| **Performance Score** | **62 / 100** | **78 / 100** | Google Lighthouse 12.8 (Chrome Headless) | Needs Improvement |
| **Accessibility Score** | **93 / 100** | **93 / 100** | Google Lighthouse 12.8 | Good baseline, 40 issues |
| **Best Practices** | **96 / 100** | **96 / 100** | Google Lighthouse 12.8 | Excellent |
| **SEO Score** | **83 / 100** | **83 / 100** | Google Lighthouse 12.8 | Needs Meta Descriptions |
| **Largest Contentful Paint (LCP)** | **2.4s** | **0.6s** | Lighthouse Web Vitals | Good on desktop, optimize mobile |
| **Cumulative Layout Shift (CLS)** | **0.000** | **0.001** | Lighthouse Web Vitals | Excellent (Zero shift) |
| **Total Blocking Time (TBT)** | **3,260 ms** | **430 ms** | Lighthouse Web Vitals (Dev Server) | Reduce hydration script cost |
| **Color Contrast Failures** | **40 elements** | **40 elements** | Lighthouse `color-contrast` Audit | **P0 Violation** |
| **Touch Target Failures** | **6 elements** | **5 elements** | Lighthouse `target-size` Audit | **P0 Violation** |
| **TypeScript Typecheck** | **0 errors** | **0 errors** | `npx tsc --noEmit` | **Clean Baseline** |
| **Production Build** | **23/23 routes** | **23/23 routes** | `npm run build` (11.3s) | **Clean Baseline** |

---

## 2. Comprehensive 15-Point Audit Tables

### Area 1: Users & Flows
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Competing Actions on Book Cards:** User is presented with 4 simultaneous interactive triggers (Wishlist ribbon, Add to Cart, Quick WhatsApp, View Details) creating decision fatigue. | `BookCard.tsx` | **P1** | Establish single primary action ("நூலை வாங்குக" / Direct Order) with discreet bookmark ribbon. | Low |
| **Admin Portal Trigger in Public Navigation:** Showing an amber "Admin Portal" demo button in the public header confuses real readers trying to browse history books. | `Header.tsx` | **P1** | Remove Admin button from public header; restrict access to direct `/admin` route or discrete footer link. | Low |
| **Lack of Sticky Mobile Purchase CTA on Book Detail:** When a mobile user scrolls through a long book description, the purchase button scrolls out of view. | `src/app/books/[slug]/page.tsx` | **P1** | Implement bottom sticky purchase bar on mobile viewports with price and instant order action. | Medium |
| **Article-to-Book Journey Friction:** Readers finishing an article on historical battles have no immediate, high-confidence way to purchase the book cited in that article. | `src/app/blog/[slug]/page.tsx` | **P1** | Embed an authentic "Cited In This Work" book card with direct 1-click checkout at the foot of each article. | Low |

---

### Area 2: Information Architecture & Navigation
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Overcrowded Header Bar:** Header packs 11 distinct items (Logo, 5 nav links, Search, Lang switch, Settings, WhatsApp, Account, Admin, Mobile toggle) causing breakpoint friction. | `Header.tsx` | **P1** | Streamline header to brand, 4 primary links, clean search, language segmented toggle, and mobile menu trigger. | Medium |
| **Raycast/Mac Keyboard Clutter (`⌘K`):** Monospace keyboard badge in search button is meaningless to general readers on Windows/Android/iOS. | `Header.tsx` | **P2** | Replace with clean search input placeholder: `நூல்களைத் தேடுக...` (Search books...). | Low |
| **Missing Search Empty State Guidance:** When a search returns zero results, the modal provides no suggested categories or alternative terms. | `SearchBar.tsx` | **P2** | Add curated suggestions ("பிரபலமான தேடல்கள்": திலீபன், விநாயகம், கட்டுநாயக்கா) in empty search states. | Low |

---

### Area 3: Visual Hierarchy & Gestalt
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Equal-Weight Bento Clutter:** The homepage bento grid divides attention into multiple equal-weight glass bubbles rather than guiding the eye down an editorial story. | `src/app/page.tsx` | **P1** | Restructure homepage with clear editorial rhythm: Featured Archival Work (Hero), Curated Catalog Shelves, and Historical Insights. | High |
| **Floating Badges Obscuring Artwork:** Rounded status pills and bookmark buttons are positioned directly over the book cover artwork. | `BookCard.tsx` | **P0** | Move all status indicators and actions below the book cover; allow the historical cover artwork to breathe freely. | Medium |
| **Lack of Physical Book Realism:** Book cards appear as flat digital rectangles without spine depth or print texture. | `BookCard.tsx`, `src/app/books/[slug]/page.tsx` | **P2** | Add a subtle 2px spine shadow on the left edge of book covers and a realistic paper drop shadow. | Low |

---

### Area 4: Design Tokens & System Consistency
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Hardcoded Color Inconsistencies:** Arbitrary color hexes (`#111111`, `#0A6847`, `#555555`, `#777777`, `#444444`, `#2A2A2A`) scattered across 30+ files. | Entire `src/` | **P1** | Enforce tokens from `/design-system/MASTER.md` via semantic CSS variables (`--color-canvas`, `--color-ink-primary`, `--color-accent`). | Medium |
| **Excessive Radius (`rounded-2xl`, `rounded-3xl`):** Bubble-like corners intended for smartphone operating systems cheapen the solemnity of historical literature. | Global CSS & Components | **P1** | Standardize on editorial tight radii: `rounded-lg` (8px) for cards, `rounded-md` (6px) for buttons, `rounded` (4px) for tags. | Low |
| **Glassmorphism Clutter (`.glass-panel`):** Heavy `backdrop-filter: blur(20px)` and semi-transparent backgrounds cause CPU rendering cost and poor readability. | `globals.css`, `GlassPanel.tsx` | **P1** | Replace glassmorphic utilities with solid, tactile archival surfaces (`#FAF8F5`, `#FFFFFF`, `#F3EFE6`) with hairline borders (`#E5DFD5`). | Medium |

---

### Area 5: Typography
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Sub-standard Body Font Size (10px–12px):** Descriptions on cards and book summaries use `text-xs` (12px) and `text-[10px]`, causing eye strain on mobile. | `src/app/page.tsx`, `BookCard.tsx` | **P0** | Enforce 16px (`text-base`) minimum for body paragraphs, and 14px (`text-sm`) for secondary metadata. | Low |
| **Unconstrained Line Length:** Certain text containers on desktop exceed 90 characters per line, increasing cognitive reading fatigue. | `src/app/blog/[slug]/page.tsx`, `src/app/books/[slug]/page.tsx` | **P1** | Constrain reading columns to `max-w-[68ch]` with optimal line-height (1.55 – 1.6). | Low |
| **Under-utilized Tamil Serif Typography:** Formal headings default to sans-serif rather than authoritative Tamil literary serif. | Global headings | **P2** | Apply `font-tamil-serif` / `font-serif` to all H1, H2, and book titles for literary gravitas. | Low |

---

### Area 6: Color & Contrast (WCAG 2.2 AA)
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **40 Failing Text Contrast Elements:** Lighthouse flagged 40 elements where foreground text (e.g. `text-[#777777]`, `text-[#666666]`) has a contrast ratio of ~3.4:1 against light backgrounds (fails 4.5:1 AA). | `BookCard.tsx`, `Header.tsx`, `Footer.tsx`, `HeroSlider.tsx` | **P0** | Darken all muted/secondary text tokens to `#4A443E` (7.2:1 AAA) and `#665F57` (4.9:1 AA). | Low |
| **Color as Single State Indicator:** Certain badge states rely on color alone (green vs red) without accompanying text labels or icons. | `Badge.tsx`, stock indicators | **P1** | Always pair color with an explicit semantic label and icon (e.g. checkmark for in stock, slash for out of stock). | Low |

---

### Area 7: Layout & Responsive Behavior
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Header Tightness at 320px Viewport:** On extreme small viewports (320px width), padding and buttons risk horizontal scroll. | `Header.tsx` | **P0** | Ensure outer padding is `px-2.5` on `<360px` screens with zero element overflow. | Low |
| **Safe Area Inset Padding on iOS:** Modals and bottom navigation drawers do not respect iPhone home-indicator safe area (`env(safe-area-inset-bottom)`). | `MobileNav.tsx`, `SettingsModal.tsx` | **P1** | Add `pb-[env(safe-area-inset-bottom,16px)]` to all drawer sheets and mobile bottom bars. | Low |

---

### Area 8: Components & Interactive States
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Missing Disabled & Loading States on Buttons:** Primary action buttons lack clear visual disabled treatments and spinner states during async interactions. | `Button.tsx` | **P1** | Add explicit `disabled:opacity-50 disabled:cursor-not-allowed` and loading indicator slot in `Button.tsx`. | Low |
| **Inconsistent Active State Visuals:** Nav links use 10% opacity green backgrounds while category pills use solid green with white text. | `Header.tsx`, `CategoryPills.tsx` | **P2** | Harmonize interactive selection tokens across all navigation and filter pills. | Low |

---

### Area 9: Forms & User Input
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Invisible Labels on Search & Filter Inputs:** Inputs rely on placeholders alone rather than permanent accessible labels or `aria-label`. | `SearchBar.tsx`, `src/app/books/page.tsx` | **P0** | Add visible labels or explicitly associated `aria-label` with descriptive purpose. | Low |
| **Input Focus Ring Contrast:** Text input borders have low contrast (1.5:1) in resting state. | `Input.tsx` | **P1** | Upgrade resting border to 1px `#CFC6B8` and focus ring to 2px solid `#0D5C3A`. | Low |

---

### Area 10: Accessibility (WCAG 2.2 AA)
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Touch Target Size Violations on Slider Dots:** Slide navigation buttons in `HeroSlider.tsx` have an interactive hit area under 44 × 44 px (flagged by Lighthouse). | `HeroSlider.tsx` | **P0** | Expand touch target bounding box to 44 × 44 px using pseudo-elements (`after:inset-[-12px]`). | Low |
| **Missing Skip-to-Content Link:** Keyboard users must tab through the entire navigation bar before reaching main page content. | `src/app/layout.tsx` | **P0** | Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>` as first child of body. | Low |
| **Missing Accessible Name Mismatch:** Visible text on certain buttons does not match its internal `aria-label` (Lighthouse flagged 1 element). | `Header.tsx` / `BookCard.tsx` | **P0** | Align visible label and `aria-label` so speech-to-text navigation commands succeed. | Low |

---

### Area 11: Motion & Animation
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Rubbery Hover Scales:** `hover:scale-103` and `active:scale-95` create an unnatural bouncy tactile feel inappropriate for serious historical archives. | `BookCard.tsx`, `src/app/page.tsx` | **P1** | Replace scaling transforms with subtle 1px paper lift and soft elevation transition (150ms `ease-out`). | Low |
| **Prefers-Reduced-Motion Bypass:** Key CSS transitions do not respect user system preferences for reduced motion. | `globals.css` | **P1** | Wrap all transitions in `@media (prefers-reduced-motion: reduce)` with instantaneous state switching. | Low |

---

### Area 12: Microcopy & Linguistic Polish
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **English / Tamil Linguistic Inconsistency:** Mixed English terminology in Tamil view (e.g. "2001 PUBLICATION", "Spotlight", "Admin"). | `src/app/page.tsx`, `Header.tsx` | **P1** | Standardize authentic Tamil terminology: `2001 ஆம் ஆண்டு பதிப்பு`, `முதன்மை ஆவண நூல்`, `வாசகர் அரங்கம்`. | Low |
| **Ambiguous CTA Text:** CTAs like "View" or "Details" lack clear action verbs. | `BookCard.tsx` | **P2** | Use action-led verbs: `நூலை வாங்குக` (Order Book) / `முழு விவரம்` (Read Overview). | Low |

---

### Area 13: Images & Media Optimization
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Missing Explicit Dimensions on Image Containers:** Certain cards omit reserved aspect-ratio containers, risking layout shifts during lazy load. | `BookCard.tsx`, `ArticleCard.tsx` | **P1** | Enforce strict CSS `aspect-[3/4]` for book covers and `aspect-[16/9]` for article banners with `object-cover`. | Low |
| **Missing Alt Text Quality:** Certain decorative or background images use generic alt text like "book image" or filename strings. | `src/app/books/[slug]/page.tsx` | **P1** | Provide meaningful bilingual alt descriptions (e.g. `கட்டுநாயக்கா தாக்குதல் வெற்றி - புத்தக அட்டைப்படம்`). | Low |

---

### Area 14: Performance as UX
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **High Total Blocking Time (TBT 3.2s) in Dev:** Unoptimized client-side hydration causes main-thread blocking during initial render. | `src/app/layout.tsx`, `LanguageContext.tsx` | **P1** | Streamline client context initialization and defer non-critical localStorage reads after first paint. | Medium |
| **Unminified CSS / Unused Scripts:** Legacy CSS rules in `globals.css` (.glass-panel, complex box-shadows) add parsing overhead. | `globals.css` | **P1** | Prune unused utility classes and clean CSS bundle. | Low |

---

### Area 15: Trust, Security & Polish
| Issue | Where | Severity | Fix | Effort |
| :--- | :--- | :---: | :--- | :---: |
| **Missing Meta Description on Homepage:** Lighthouse SEO audit flagged missing top-level meta description. | `src/app/layout.tsx` | **P1** | Add rich, bilingual OpenGraph & Twitter meta tags with clear cultural summary. | Low |
| **Seal of Authenticity & Verification Badge:** Readers purchasing rare historical records need visible reassurance of archival verification. | `Header.tsx`, `Footer.tsx`, Book Detail | **P1** | Embed an elegant editorial verification mark: `அங்கீகரிக்கப்பட்ட களஞ்சிய ஆவணம்` (Verified Archival Record). | Low |

---

## 3. Prioritized Implementation Plan (Ready for Approval)

We will execute the implementation in **4 tightly focused, atomic batches**:

### Batch 1: P0 Fixes (Accessibility & Contrast Compliance)
- [x] **Safe Auto-Fix:** Darken all muted/secondary text colors to pass WCAG 2.2 AA (4.5:1 for normal text, 3:1 for UI elements).
- [x] **Safe Auto-Fix:** Add top-level "Skip to content" accessible keyboard link in `src/app/layout.tsx`.
- [x] **Safe Auto-Fix:** Expand touch target bounding boxes on slider pagination dots and icon buttons to minimum 44 × 44 px.
- [x] **Safe Auto-Fix:** Increase card body text size to 16px minimum (`text-base`).
- [x] **Safe Auto-Fix:** Fix button accessible names to match visible text.

### Batch 2: Design System & Token Foundation (`/design-system/MASTER.md`)
- [x] **Safe Auto-Fix:** Implement canonical semantic tokens in `src/app/globals.css` (`--color-canvas`, `--color-ink-primary`, `--color-accent`, `--border-hairline`).
- [x] **Safe Auto-Fix:** Remove outdated `.glass-panel` frosted blur styling in favor of solid archival paper surfaces (`#FAF8F5`, `#FFFFFF`).
- [x] **Safe Auto-Fix:** Add `@media (prefers-reduced-motion: reduce)` rules to eliminate motion sickness and honor user OS preferences.

### Batch 3: Component De-Slopping & Clean Architecture
- [x] **Safe Auto-Fix:** `BookCard.tsx`: Move all badges and actions below the book cover; add subtle physical spine shadow.
- [x] **Safe Auto-Fix:** `Header.tsx`: Remove public `Admin` button and `⌘K` badge; streamline search and language switcher.
- [x] **Safe Auto-Fix:** `Button.tsx`, `Input.tsx`: Standardize radii, focus-visible rings (2px solid forest green), and disabled states.
- [x] **Needs Decision:** Would you like the Admin portal link kept discretely in the site footer, or removed entirely from public UI and accessed only via direct URL (`/admin`)?

### Batch 4: Editorial Homepage & Page Polish
- [x] **Safe Auto-Fix:** Replace bento bubble cards on homepage with dignified literary shelves and verified archival spotlights.
- [x] **Safe Auto-Fix:** Add mobile sticky purchase action bar on book detail page.
- [x] **Safe Auto-Fix:** Add rich bilingual meta description in `layout.tsx` for 100 SEO score.
- [x] **Safe Auto-Fix:** Run verification suite: re-measure Lighthouse, typecheck, build.

---

### Verification Protocol After Implementation
After approval, each batch will be committed atomically, followed by:
1. `npx tsc --noEmit` (Must pass with 0 errors)
2. `npm run build` (Must build 23/23 routes without regression)
3. Re-running Lighthouse on mobile and desktop to prove score improvements empirically.
4. Outputting `/docs/ux-report.md` with side-by-side Before & After comparison.

---

**STOPPING HERE FOR YOUR APPROVAL** before beginning Phase 3 (Implementation).
Please let me know if you approve this audit and prioritized plan, and confirm your preference on the Admin portal link placement (Discreet footer link vs Direct URL only).
