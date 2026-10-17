# STATE.md — Project State & Memory

> **Project:** Methagu Kalanjiyam (Platform Rebuild to Next.js 15 + Supabase + Cloudflare)  
> **Updated:** 2026-10-17  
> **Status:** READY FOR PHASE 1 EXECUTION  

---

## Current Position

- **Phase:** 0 (Planning & Architectural Design) → Complete
- **SPEC Status:** `FINALIZED` (includes Blog with multi-image gallery & keyword taxonomy)
- **ROADMAP Status:** `FINALIZED` (12 phases, decomposed into actionable waves)
- **Next Phase:** Phase 1 (Foundation — Scaffold, Tailwind v4 design system, layout shell)

---

## Architectural Decisions Locked

| Item | Decision | Note |
|------|----------|------|
| Framework | Next.js 15 (App Router, Server Actions, TypeScript) | Modern SSR/RSC |
| Database & Auth | Supabase PostgreSQL + Supabase Auth | Free tier DB, RLS security |
| Image & Hosting | Cloudflare Pages + Cloudflare R2 | S3-compatible, edge CDN, zero egress |
| Image Pipeline | Sharp | Auto-compress to WebP/AVIF (85% quality) |
| CSS | Tailwind CSS v4 | Frosted glassmorphism design tokens |
| Payments | Razorpay | Test mode first, webhook verification |
| Language | Full bilingual (Tamil + English) | `next-intl` with language toggle |
| Search Engine | PostgreSQL `tsvector` + `pg_trgm` | Full-text + fuzzy Tamil/English search |
| Blog Feature | Multi-image gallery + keyword taxonomy | Cross-linking bookstore books |

---

## Documents & Specs

- [SPEC.md](file:///m:/Personal/Workspace/Book/.gsd/SPEC.md) — Canonical specification (Schema, RLS, APIs, Feature Specs)
- [ROADMAP.md](file:///m:/Personal/Workspace/Book/.gsd/ROADMAP.md) — 12-Phase roadmap with task breakdown
- [transformation_plan.md](file:///C:/Users/madha/.gemini/antigravity-ide/brain/a92c1906-b688-49e0-93ca-27c33dc7f4ae/transformation_plan.md) — Visual overview and mockups

---

## Immediate Next Steps (Phase 1)

1. Initialize Next.js 15 project with App Router, TypeScript, Tailwind CSS v4.
2. Configure path aliases, dependencies (`@supabase/supabase-js`, `@supabase/ssr`, `sharp`, `zod`, `zustand`).
3. Set up fonts (Fraunces, Inter, Noto Sans Tamil) & glassmorphism theme tokens in `globals.css`.
4. Build UI primitives (`GlassPanel`, `Button`, `Input`, `Badge`, `Skeleton`, `Toast`, `Modal`).
5. Assemble layout shell (`Header`, `Footer`, `MobileNav`, `SearchBar`, root `layout.tsx`).
