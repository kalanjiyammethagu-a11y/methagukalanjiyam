# ARCHITECTURE.md — System Topology & Cognitive Neural Network

> **Project:** Methagu Kalanjiyam Platform Rebuild  
> **Status:** ACTIVE ARCHITECTURE / SOURCE OF TRUTH  
> **Last Synced:** 2026-10-17  
> **Target Stack:** Next.js 15 (App Router, Server Actions) + Supabase (PostgreSQL 15, RLS) + Cloudflare Pages & R2 + Tailwind CSS v4 + Razorpay  

---

## 1. System Topology & Data Flow

```
                      ┌──────────────────────────────────────────┐
                      │             CLIENT LAYER                 │
                      │   Next.js 15 App Router (Edge & SSR)     │
                      │  Bilingual (Tamil/English) + Glass UI    │
                      └───────┬──────────────────────────┬───────┘
                              │                          │
           Image Reads / CDN  │                          │ Server Actions / API Routes
                              ▼                          ▼
               ┌──────────────────────┐      ┌───────────────────────────────┐
               │    CLOUDFLARE R2     │      │      SUPABASE POSTGRESQL      │
               │  - Book Covers       │      │  - Relational Schema (12 tab) │
               │  - Article Galleries │      │  - Row Level Security (RLS)   │
               │  - WebP Auto Pipeline│      │  - Full-Text & Fuzzy Search   │
               │  - Zero Egress Cost  │      │  - Atomic Concurrency Locks   │
               └──────────────────────┘      └───────────────┬───────────────┘
                                                             │
                                                             │ Webhooks & Signature Verification
                                                             ▼
                                             ┌───────────────────────────────┐
                                             │      RAZORPAY GATEWAY         │
                                             │  - Mobile UPI Intent Flow     │
                                             │  - Cards / NetBanking         │
                                             │  - Auto Refund / Webhook Sync │
                                             └───────────────────────────────┘
```

---

## 2. Neural State Map (For Any AI Resuming Context)

```
[SPEC.md] (Canonical Requirements & Schema)
   │
   ├──► [ROADMAP.md] (12-Phase Execution Plan)
   │       │
   │       ├──► [STATE.md] (Realtime Session Memory & Current Position)
   │       │
   │       └──► [JOURNAL.md] (Empirical Verification & Commits)
   │
   └──► [ARCHITECTURE.md] (This File — Component Graph & Data Contracts)
```

### Context Recovery Checklist for Incoming Agents:
1. **Read `.gsd/STATE.md`** → Check current phase, completed tasks, and active wave.
2. **Read `.gsd/SPEC.md`** → Verify DB schema, table names, types, and constraints before creating code.
3. **Verify Git History** → Run `git log --oneline -5` to inspect committed tasks.
4. **Follow Empirical Validation** → Never mark a task done without running verification commands or visual capture.

---

## 3. Database Entity Relationship Map

```
  profiles (users & admins)
     ├──< addresses (saved delivery locations)
     ├──< cart_items (persistent cart sync)
     ├──< orders (purchases with tracking)
     │       └──< order_items (snapshot of book at purchase)
     └──< articles (unified blog & news updates)
             ├──< article_books (books promoted inside articles)
             └──< gallery_images (Cloudflare R2 WebP array)

  categories
     └──< books (catalog items)
             ├──> search_vector (title + author + transliteration_keywords + desc)
             ├──> stock_reserved_until (concurrency hold)
             └──< order_items
```

---

## 4. Key Engineering Guardrails

1. **Anti-Over-Selling Concurrency:**
   - Always call `reserve_stock_for_checkout` with row-level locks (`SELECT ... FOR UPDATE`) before returning Razorpay order IDs.
2. **Mobile First & Zero-Friction Checkout:**
   - Support Guest Checkout with Phone OTP and auto-generated profile on payment confirmation.
   - Razorpay configured for UPI Intent flow (instant redirect to GPay/PhonePe).
3. **Storage Boundary:**
   - Never store binary image data in Supabase. Supabase holds only metadata and URLs pointing to `https://images.methagukalanjiyam.in/` (Cloudflare R2).
4. **Design Integrity (No AI Slop):**
   - Palette: Warm off-white (`#FAFAF9`), Obsidian darks (`#121212`), Deep Tamil Green (`#0A6847`), Brass/Gold (`#B8860B`).
   - Tactile glassmorphism: layered backdrop filters (`backdrop-blur-xl`), 1px translucent borders (`rgba(255,255,255,0.08)` / `rgba(0,0,0,0.06)`), spring-based micro-interactions.
   - Script rendering: `Noto Sans Tamil` with proper letterspacing and vertical rhythm for Tamil typography.

---

*ARCHITECTURE v1.0 — Synced with SPEC and ROADMAP*
