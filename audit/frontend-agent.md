# Frontend Agent Audit Report
## Repository: M:\Personal\Workspace\Book
---

FE-1: Both CartContext.tsx and LanguageContext.tsx declare use client at the top, making them full client components. LanguageContext manages non-UI state (locale, font size, theme, shipping region, delivery address, wishlist) that could be handled at server level. Context providers wrap entire app tree, meaning every child component re-renders when context values change.
FE-2: Over 30+ components have use client directive even though many are primarily presentational. Components like BookCard, VideoCard, CategoryFilterTabs, MobileNav, Header, Footer, SearchBar, ScrollToTopOnNavigation, FloatingWhatsApp, BottomNav, ErrorState, EmptyState, Tabs, Pagination, QuantitySelector, and Breadcrumbs do not use useState, useEffect, or useContext hooks.
FE-3: BookCard receives BookCardData prop but also drills into useLanguage() and useCart() context hooks internally, then reconciles propLocale || contextLocale. Creates two-level prop/context drilling pattern.
FE-4: Both contexts read/write localStorage directly without error boundaries. CartContext uses try/catch with console.error. LanguageContext wraps all localStorage operations in bare try { } catch { } blocks. If localStorage is full, private, or disabled, data silently vanishes.
FE-5: LanguageContext uses useState for 14+ separate pieces of state (locale, fontSize, readingTheme, shippingRegion, deliveryAddress, wishlist, isSettingsOpen, toast, toastTimerRef), each with individual useEffect persistence to localStorage. CartContext uses useState for items and isLoaded.
FE-6: CartContext persists cart to localStorage but app also uses Supabase for backend storage. No synchronization between localStorage cart and server-side cart store. Checkout flow uses Supabase API calls but cart state remains in localStorage, creating divergence risk.
FE-7: Many components have use client but are purely presentational. BookDetailClient correctly needs use client. However, BookCard uses useRouter() and useLanguage()/useCart() contexts, so use client is justified. VideoCard uses useMemo and useState for autoplaySrc.
FE-8: LanguageProvider wraps entire app. value prop includes every state variable. When ANY single state changes (e.g. locale), entire value object reference changes, causing ALL consumer components to re-render even those ignoring other values.
FE-9: subtotal uses useMemo(() => items.reduce(...), [items]). Since items is array state, any item addition/removal triggers memo recompute. Context value object includes subtotal, so any cart change forces re-render of all consumers.
FE-10: deliveryAddress synced in LanguageContext (lines 127-130), SettingsModal (line 31), and CartPage (lines 144-146). Three different components read/write same state from different effects, creating race conditions and stale closures.
FE-11: HeroSlider imports useEmblaCarousel from embla-carousel-react, Autoplay from embla-carousel-autoplay, Fade from embla-carousel-fade. Full Embla library ~30KB gzipped, only carousel with fade+autoplay needed. Autoplay configured with ref (autoplay.current) may not clean up on unmount.
FE-12: Every component imports individual icons from lucide-react. While tree-shakable, cumulative effect of 20+ components each importing 2-5 icons adds up. Some icons may be imported but not used in JSX.
FE-13: Autoplay plugin created via ref (autoplay.current = Autoplay({...})) and never cleaned up. When component unmounts, autoplay may continue running, causing memory leaks or unwanted autoplay on other components.
FE-14: BookCard Image src={book.image} with fill sizes={isCompact ? " 96px\ : isFeatured ? \176px\ : \160px\} loading=\lazy\ className=\object-cover\. fill used without parent with explicit width/height. HeroSlider Image with fill and sizes correct. VideoCard Image with fill may cause layout shift.
FE-15: next.config.ts configures formats: [" image/avif\, \image/webp\]. But need to verify if hero slide images and book cover images are uploaded in WebP or if Cloudflare R2 is configured for automatic format conversion.
FE-16: Four Google fonts loaded via next/font with display: swap: Inter, Fraunces, Noto Sans Tamil, Noto Serif Tamil. All have display: swap but loading 4 font families increases FOUT time and total download size. Noto Sans/Tamil large with 400,500,600,700 weights.
FE-17: HeroSlider images use fill prop requiring parent with explicit width/height to avoid CLS. Slide container has min-height settings. Scale transitions with will-change may cause layout thrashing.
FE-18: VideoCard renders iframe for video playback when isPlaying true. iframes have no intrinsic dimensions causing CLS until content loads. aspect-video class should provide aspect ratio. Video playback can impact LCP if above the fold.
FE-19: Home page uses React.Suspense with loading skeletons good. But BookCard shows images immediately with loading=" lazy\. CategoryFilterTabs filters books with useMemo but shows no skeleton during computation.
FE-20: Four Google fonts with display: swap risk CLS if fallback system font differs from loaded font sizes. Noto Sans/Tamil have different metrics than Latin fallback. Tamil text may reflow after font load.
FE-21: Several buttons have focus-visible:ring-2 focus-visible:ring-emerald-400. Some elements lose focus outlines due to focus:outline-none combined with custom focus rings not meeting contrast in all themes.
FE-22: HeroSlider progress indicator aria-label uses String(selectedIndex+1).padStart(2,0) which may be read oddly by screen readers saying " Slide 01 of 04\. BookCard aria-label on bookmark button complex conditional. Some elements lack sufficient description.
FE-23: Several UI elements use bg-black/[0.04], bg-white/70, text-zinc-600, text-[#555555] with varying opacity. Contrast against backgrounds may not meet WCAG AA: text-[#555555] on bg-white needs verification.
FE-24: BottomNav has no explicit keyboard navigation handling for nav items. CategoryFilterTabs tabs use role=" tablist\ but may not handle Shift+Tab properly. SearchBar modal has keyboard handling but quick category buttons may not be keyboard-accessible.
FE-25: While html lang=" ta\ set in layout.tsx, individual content switching between Tamil/English may not have proper lang attributes. BookCard line 224 has lang={locale === \ta\ ? \en\ : \ta\} good pattern but other elements may lack this.
FE-26: Next.js has default error boundary at app level (error.tsx), but no granular error boundaries for individual components. If HeroSlider, BookCard, or VideoCard throws error, entire page crashes to root boundary.
FE-27: Both context providers wrap localStorage operations in try/catch that silently swallow errors. CartContext: console.error then continue. LanguageContext: bare catch { }. If localStorage full/unavailable, data lost without user notification.
FE-28: Multiple files have imports that may not be used in JSX. HeroSlider imports {ArrowRight, ChevronLeft, ChevronRight, Pause, Play} from lucide-react all appear used. Need explicit unused import check.
FE-29: CartContext.tsx:58 and 71 have console.error for localStorage failures. LanguageContext.tsx:208 has console.error for sensitive storage. error.tsx:18 has console.error catching root error.
FE-30: No debugger statements found during audit. No debugger in any reviewed files.
## Summary Statistics

| Category | Count | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Severity Breakdown | | Critical: 2 | High: 5 | Medium: 13 | Low: 8+ |

**Critical Issues:**
1. FE-17: CLS risks in HeroSlider image layout shifts
2. FE-1: Client component overuse in CartContext/LanguageContext affecting entire app tree

**High Issues:**
1. FE-8: LanguageContext re-renders entire app on any state change
2. FE-18: Video iframe CLS/LCP risks
3. FE-2: Unnecessary use client directives on presentational components
4. FE-4: localStorage without proper error handling
5. FE-7: BookCard context/prop drilling confusion

**Medium Issues:**
1. FE-11: Embla Carousel bundle weight
2. FE-14: next/image usage issues
3. FE-16: Font loading impact
4. FE-22: aria-label improvements needed
5. FE-23: Color contrast verification needed
6. FE-24: Keyboard navigation gaps (BottomNav)
7. FE-10: Cart localStorage vs Supabase sync
8. FE-9: Subtotal recalculation re-renders
9. FE-12: Icon import optimization
10. FE-21: Focus outline consistency

**Low Issues:**
1. Font subset optimization
2. Skeleton screen coverage
3. Dead code cleanup
4. console.log removal
5. debugger verification
6. Various minor a11y improvements
