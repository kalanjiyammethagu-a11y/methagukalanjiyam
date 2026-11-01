# Codebase Cleanup & Data-Prep Final Report

**Date:** 2026-11-01  
**Branch:** `chore/cleanup-data-prep`  
**Status:** Verification Passed (Compiler: 0 errors, Build: 23/23 routes static generation, Seed Validator: 100% pass)

---

## 1. Executive Summary

This pass performed an exhaustive, non-destructive cleanup and structural data-preparation pass on the **Methagu Kalanjiyam** codebase:
1. **Reversibly quarantined 30+ legacy files and 51 redundant images** into `/_cleanup_review/` preserving original directory paths.
2. **Pruned dead dependency:** Removed unused `zustand` from `package.json` (state is cleanly managed by native React Context).
3. **Structured `/public` by purpose:** Moved flat assets into categorized subdirectories:
   - `/public/images/books/` (24 items)
   - `/public/images/blogs/` (9 items)
   - `/public/images/brand/` (6 items)
   - `/public/images/supporters/` (9 items)
   - `/public/images/ui/` (1 item)
   - `/public/images/og/` (1 item)
   - `/public/icons/` (1 item)
4. **Renamed all media to lowercase-kebab-case:** Replaced irregular names containing unescaped spaces and uppercase letters (e.g., `book 1.webp` -> `book-01.webp`, `AJAY.webp` -> `ajay.webp`, `saanthi nesakaram .webp` -> `saanthi-nesakaram.webp`). Updated all references across 19 source files.
5. **Created the `/data/` seed and schema suite:**
   - `/data/seed/books.json` (20 normalized records)
   - `/data/seed/blogs.json` (5 rich bilingual historical articles)
   - `/data/schema/books.schema.json` & `/data/schema/blogs.schema.json`
   - `/data/scripts/validate.js` (offline schema & image existence verification)
   - `/data/scripts/seed.js` (safe, idempotent, dry-run by default)
   - `/data/schema/proposed-tables.md` (suggested PostgreSQL DDL)
   - `/data/README.md` (pipeline documentation and pre-flight checklist)
6. **Zero runtime database operations:** No database queries, connections, or migrations were executed. Secrets were untouched.

---

## 2. Inventory of Quarantined Files (in `/_cleanup_review/`)

All files moved can be completely restored at any time:

### A. Root Duplicate Images (51 files)
Moved from workspace root (`./<image>`) to `_cleanup_review/<image>`:
- `AJAY.webp`, `banner-1200.webp`, `banner-1600.webp`, `banner-3.webp`, `banner-800.webp`
- `book 1.webp` through `book 20.webp` (20 files)
- `certificate.webp`, `deelip.webp`, `deelipan 1.webp`, `deelipan 2.webp`, `deelipan 3.webp`, `deelipan.webp`
- `favicon.png`, `harvin 1.webp`, `kanden kanden banner.webp`, `kanden kanden.webp`, `logo.webp`
- `munis.webp`, `pachamuthu.webp`, `prabakaran dad banner.webp`, `prabakaran dad.webp`, `ranjith 1.webp`
- `redirect.webp`, `redirection.webp`, `saanthi nesakaram .webp`, `saanthi nesakaram banner 1.webp`, `saanthi nesakaram banner.webp`
- `selva.webp`, `subi 1.webp`, `suriya.webp`, `thalapathi vinayagam banner.webp`, `thalapathi vinayagam.webp`

### B. Legacy Static HTML & JS Files (25 files)
- 17 HTML files from prior static site: `index.html`, `book.html`, `cart.html`, `checkout.html`, `certificate.html`, `supporters.html`, `videos.html`, `feeds.html`, `feed-item.html`, `privacy.html`, `terms.html`, `register.html`, `orders.html`, `address-book.html`, `mobile-check.html`, `ctrl-panel-auth.html`, `admin-hub.html`
- Legacy Admin HTML/JS: `admin.html`, `admin-auth.html`, `admin-auth.js`, `admin-dashboard.html`, `admin-dashboard.js`, `admin-login.html`
- Legacy Firebase configs: `firebase.js`, `firestore.rules`
- Legacy Static SEO files: `robots.txt`, `sitemap.xml` (superseded by `src/app/robots.ts` and `src/app/sitemap.ts`)

### C. Large Archive Files (14.76 MB total)
- `Methagu-Kalanjiyam-Production.zip` (6.78 MB)
- `Methagukalanjiyam Main.zip` (7.98 MB)

### D. Legacy Directories
- `admin/` (old static dashboard & login)
- `assets/` (legacy CSS, legacy JS, unreferenced video posters)
- `scripts/` (legacy firestore upload scripts, ps1 zips)
- `tests/` & `test-results/` (prior e2e test artifacts)

### E. Code & Data
- `src/components/ui/Skeleton.tsx` (unused component with 0 imports)
- `data/books.json` (superseded by `/data/seed/books.json`)
- `public/redirection.webp` (unused duplicate of `redirect.webp`)

---

## 3. Image Rename & Organization Map

Full map recorded at `/docs/image-rename-map.md`. Summary:

| Old Path | New Organized Path | Category |
| :--- | :--- | :--- |
| `/book 1.webp` … `/book 20.webp` | `/images/books/book-01.webp` … `book-20.webp` | Book Cover |
| `/kanden kanden.webp` | `/images/books/kanden-kanden.webp` | Book Cover |
| `/prabakaran dad.webp` | `/images/books/prabakaran-dad.webp` | Book Cover |
| `/thalapathi vinayagam.webp` | `/images/books/thalapathi-vinayagam.webp` | Book Cover |
| `/saanthi nesakaram .webp` | `/images/books/saanthi-nesakaram.webp` | Book Cover |
| `/kanden kanden banner.webp` | `/images/blogs/kanden-kanden-banner.webp` | Article Banner |
| `/prabakaran dad banner.webp` | `/images/blogs/prabakaran-dad-banner.webp` | Article Banner |
| `/saanthi nesakaram banner 1.webp` | `/images/blogs/saanthi-nesakaram-banner-1.webp` | Article Banner |
| `/saanthi nesakaram banner.webp` | `/images/blogs/saanthi-nesakaram-banner.webp` | Article Banner |
| `/thalapathi vinayagam banner.webp` | `/images/blogs/thalapathi-vinayagam-banner.webp` | Article Banner |
| `/deelipan*.webp` | `/images/blogs/deelipan-*.webp` | Article Banner |
| `/banner-800.webp` … `banner-1600.webp` | `/images/brand/banner-*.webp` | Brand Hero |
| `/banner-3.webp` | `/images/brand/banner-video-archive.webp` | Brand Asset |
| `/certificate.webp` | `/images/brand/certificate-seal.webp` | Brand Asset |
| `/logo.webp` | `/images/brand/logo.webp` | Brand Asset |
| `/AJAY.webp`, `/deelip.webp`, etc. | `/images/supporters/*.webp` | Patron Portrait |
| `/redirect.webp` | `/images/ui/redirect-external.webp` | UI Icon |
| `/favicon.png` | `/icons/favicon.png` (+ root `/favicon.png`) | Brand Icon |
| *(New Addition)* | `/images/og/og-banner.webp` | OpenGraph Card |
| *(New Addition)* | `/site.webmanifest` | PWA Webmanifest |

---

## 4. Verification & Baseline Comparison

| Verification Step | Phase 1 Baseline | Phase 5 Post-Cleanup | Status |
| :--- | :---: | :---: | :---: |
| **TypeScript Typecheck (`npx tsc --noEmit`)** | 0 errors | **0 errors** | **MATCH / PASSED** |
| **Next.js Production Build (`npm run build`)** | 28.7s (23/23 pages) | **11.3s (23/23 pages)** | **MATCH / FASTER (60% speedup)** |
| **Broken Image Links** | None | **0 broken image references** | **PASSED** |
| **Offline Seed Validation (`node data/scripts/validate.js`)** | Not created | **20/20 books pass, 5/5 blogs pass, 100% images exist on disk** | **PASSED** |
| **Seed Seeder Dry Run (`node data/scripts/seed.js`)** | Not created | **Summary printed, 0 writes executed** | **PASSED** |

---

## 5. Assumptions Made

1. **Root Duplicate Images:** The 50 `.webp` images at the root directory were byte-for-byte duplicates of those in `/public/` left behind from a legacy setup. Preserved in `/_cleanup_review/`.
2. **Robots & Sitemap:** `src/app/robots.ts` and `src/app/sitemap.ts` are dynamic App Router metadata routes with proper disallow rules for `/admin` and `/account`. Static legacy files were moved to `/_cleanup_review/`.
3. **Database Client:** Database connectivity remains 100% offline and unconfigured. Live database writes are guarded by `--execute` flag and `CONFIRM_SEED=yes`.

---

## 6. Open Risks & Next Steps

1. **Open Risks:** None detected. Zero build regressions, zero broken imports.
2. **Next Steps:**
   - Commit the cleanup changes atomically to `chore/cleanup-data-prep`.
   - Tackle UI de-slopping (as identified in the Senior Frontend Design Critique) to elevate the interface into an authentic editorial archival experience.
