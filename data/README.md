# Data-Prep & Seed Pipeline

This directory contains validated seed datasets, formal JSON schemas, validation scripts, and idempotent database migration/seed scripts for **Methagu Kalanjiyam**.

## Directory Layout

```
/data/
├── README.md                     # Pipeline documentation & pre-flight checklist
├── schema/
│   ├── books.schema.json         # JSON Schema for books
│   ├── blogs.schema.json         # JSON Schema for articles/blogs
│   └── proposed-tables.md        # Suggested SQL DDL & ORM schemas
├── scripts/
│   ├── validate.js               # Offline data & image reference validator
│   └── seed.js                   # Safe, idempotent upsert seeder (dry-run by default)
└── seed/
    ├── books.json                # 20 normalized book records
    └── blogs.json                # 5 full-length rich historical articles
```

## Normalization Details

Every field from existing static files was preserved without alteration or fabrication:
- **Unique Slugs:** Standardized kebab-case slugs (`katunayake-attack-victory`, `eelam-liberation`).
- **Asset Paths:** Normalized to point to categorized `/images/books/` and `/images/blogs/`.
- **Dates:** Stored as standardized ISO 8601 UTC timestamps (`createdAt`, `updatedAt`, `publishedAt`).
- **Bilingual Content:** Maintained parallel Tamil and English titles, descriptions, and excerpts.

## How to Validate Offline

Runs completely offline without database connections or external network dependencies:

```bash
node data/scripts/validate.js
```

The validator checks:
1. Every record against schema constraints and required fields.
2. Uniqueness of IDs and URL slugs.
3. Physical existence of every referenced image on disk under `/public`.

## How to Dry-Run the Seeder

By default, the seed script is safe and performs zero database writes:

```bash
node data/scripts/seed.js
```

It prints a summary of items to be upserted and samples records.

## Production Pre-Flight Checklist

Before executing the first live database seed in the future:
- [ ] Supabase instance created and migration scripts (`supabase/migrations/001_initial_schema.sql`) applied.
- [ ] Database credentials configured in secure server environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Run `node data/scripts/validate.js` to guarantee 0 errors.
- [ ] Un-comment the lazy Supabase client in `data/scripts/seed.js`.
- [ ] Execute with explicit dual-confirmation:
  ```bash
  CONFIRM_SEED=yes node data/scripts/seed.js --execute
  ```
