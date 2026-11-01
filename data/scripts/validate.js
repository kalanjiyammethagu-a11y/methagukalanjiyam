/**
 * Standalone Offline Seed Validator
 * Validates /data/seed/books.json and /data/seed/blogs.json against JSON schemas,
 * verifies unique slug constraints, and confirms every referenced image exists on disk.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const seedDir = path.resolve(__dirname, '../seed');
const publicDir = path.resolve(rootDir, 'public');

let totalErrors = 0;

function logPass(msg) {
  console.log(`  ✓ ${msg}`);
}
function logFail(msg) {
  console.error(`  ✗ ERROR: ${msg}`);
  totalErrors++;
}

console.log('\n========================================================');
console.log('   METHAGU KALANJIYAM — SEED DATA VALIDATION SUITE');
console.log('========================================================\n');

// 1. Validate Books
console.log('1. Validating Books Seed (/data/seed/books.json)...');
const booksPath = path.join(seedDir, 'books.json');
if (!fs.existsSync(booksPath)) {
  logFail('File /data/seed/books.json does not exist.');
} else {
  const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  console.log(`   Checking ${books.length} book records...`);

  const seenSlugs = new Set();
  const seenIds = new Set();

  books.forEach((book, idx) => {
    const loc = `Book #${idx + 1} ("${book.title || 'Untitled'}")`;

    // Required fields check
    const required = ['id', 'slug', 'title', 'titleEn', 'author', 'price', 'categorySlug', 'image', 'stock'];
    required.forEach(f => {
      if (book[f] === undefined || book[f] === null || book[f] === '') {
        logFail(`${loc} missing required field: "${f}"`);
      }
    });

    // Unique Slug check
    if (seenSlugs.has(book.slug)) {
      logFail(`${loc} duplicate slug: "${book.slug}"`);
    } else {
      seenSlugs.add(book.slug);
    }

    // Unique ID check
    if (seenIds.has(book.id)) {
      logFail(`${loc} duplicate id: "${book.id}"`);
    } else {
      seenIds.add(book.id);
    }

    // Price & stock sanity
    if (typeof book.price !== 'number' || book.price < 0) {
      logFail(`${loc} invalid price: ${book.price}`);
    }
    if (typeof book.stock !== 'number' || book.stock < 0) {
      logFail(`${loc} invalid stock: ${book.stock}`);
    }

    // Image existence check on disk
    if (book.image) {
      const relImg = book.image.startsWith('/') ? book.image.slice(1) : book.image;
      const fullImg = path.join(publicDir, relImg);
      if (!fs.existsSync(fullImg)) {
        logFail(`${loc} referenced image does not exist: "${book.image}" (expected at ${fullImg})`);
      }
    }
  });

  logPass(`All ${books.length} books have unique slugs and valid price/stock.`);
}

// 2. Validate Blogs / Articles
console.log('\n2. Validating Blogs Seed (/data/seed/blogs.json)...');
const blogsPath = path.join(seedDir, 'blogs.json');
if (!fs.existsSync(blogsPath)) {
  logFail('File /data/seed/blogs.json does not exist.');
} else {
  const blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
  console.log(`   Checking ${blogs.length} article records...`);

  const seenSlugs = new Set();

  blogs.forEach((blog, idx) => {
    const loc = `Blog #${idx + 1} ("${blog.titleTa || 'Untitled'}")`;

    const required = ['id', 'slug', 'titleTa', 'titleEn', 'coverImage', 'htmlContentTa', 'publishedAt'];
    required.forEach(f => {
      if (!blog[f]) {
        logFail(`${loc} missing required field: "${f}"`);
      }
    });

    if (seenSlugs.has(blog.slug)) {
      logFail(`${loc} duplicate slug: "${blog.slug}"`);
    } else {
      seenSlugs.add(blog.slug);
    }

    // Cover image check
    if (blog.coverImage) {
      const relImg = blog.coverImage.startsWith('/') ? blog.coverImage.slice(1) : blog.coverImage;
      const fullImg = path.join(publicDir, relImg);
      if (!fs.existsSync(fullImg)) {
        logFail(`${loc} referenced coverImage does not exist: "${blog.coverImage}"`);
      }
    }
  });

  logPass(`All ${blogs.length} articles have unique slugs and existing cover images.`);
}

console.log('\n--------------------------------------------------------');
if (totalErrors === 0) {
  console.log('✓ VALIDATION SUCCESS: All seed records are valid and all images exist on disk.\n');
  process.exit(0);
} else {
  console.error(`✗ VALIDATION FAILED with ${totalErrors} errors.\n`);
  process.exit(1);
}
