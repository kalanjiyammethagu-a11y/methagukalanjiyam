/**
 * Standalone Idempotent Seed Runner
 *
 * SAFETY INVARIANTS:
 * - DRY-RUN BY DEFAULT: Reads seed files, validates them, and prints what it WOULD insert.
 * - Live write requires BOTH:
 *     1. Explicit command-line flag: --execute
 *     2. Explicit environment variable: CONFIRM_SEED=yes
 * - Database client is imported lazily and is not configured until production readiness.
 * - Upsert operation is idempotent on `slug`.
 */

const fs = require('fs');
const path = require('path');

const seedDir = path.resolve(__dirname, '../seed');
const isExecute = process.argv.includes('--execute');
const isConfirmed = process.env.CONFIRM_SEED === 'yes';

console.log('\n========================================================');
console.log('   METHAGU KALANJIYAM — IDEMPOTENT DATABASE SEEDER');
console.log('========================================================');

const books = JSON.parse(fs.readFileSync(path.join(seedDir, 'books.json'), 'utf8'));
const blogs = JSON.parse(fs.readFileSync(path.join(seedDir, 'blogs.json'), 'utf8'));

console.log(`Loaded ${books.length} books and ${blogs.length} blogs from seed directory.\n`);

if (!isExecute || !isConfirmed) {
  console.log('MODE: [DRY-RUN] (No writes performed)\n');
  console.log('Summary of records that WOULD be upserted:');
  console.log(`  - Books to upsert: ${books.length} records`);
  console.log(`    Sample Book: id="${books[0].id}", slug="${books[0].slug}", title="${books[0].title}", price=₹${books[0].price}, image="${books[0].image}"`);
  console.log(`  - Blogs to upsert: ${blogs.length} records`);
  console.log(`    Sample Blog: id="${blogs[0].id}", slug="${blogs[0].slug}", titleTa="${blogs[0].titleTa}", coverImage="${blogs[0].coverImage}"`);
  console.log('\nTo execute live database writes in the future (once DB credentials are configured):');
  console.log('  CONFIRM_SEED=yes node data/scripts/seed.js --execute\n');
  process.exit(0);
}

// -------------------------------------------------------------
// LIVE EXECUTION BLOCK (Guarded by --execute AND CONFIRM_SEED=yes)
// -------------------------------------------------------------
console.log('MODE: [LIVE EXECUTION REQUESTED]');

// TODO: Connect database client here when ready:
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.error('ERROR: Database client is not configured. Live writes are prohibited by safety invariants.');
process.exit(1);
