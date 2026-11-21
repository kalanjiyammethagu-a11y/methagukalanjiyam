import fs from "node:fs";
import path from "node:path";

function getAllFiles(dir, exts = [".ts", ".tsx", ".js", ".mjs"]) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git" && file !== "_cleanup_review") {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.some((ext) => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const allSourceFiles = getAllFiles("src");
const allScriptFiles = getAllFiles("scripts");
const allCodeFiles = [...allSourceFiles, ...allScriptFiles, "next.config.ts"];

// Read all code file contents into memory for fast searching
const fileContents = allCodeFiles.map((file) => ({
  path: file,
  content: fs.readFileSync(file, "utf8"),
}));

console.log("================================================================================");
console.log(" DEAD CODE & ASSET AUDIT REPORT");
console.log(" Scanned source files: " + allCodeFiles.length);
console.log("================================================================================\n");

// 1. Audit public/ assets
console.log("1. AUDITING PUBLIC/ ASSETS:");
const publicFiles = [];
function getPublicFiles(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      getPublicFiles(fullPath);
    } else {
      publicFiles.push(fullPath);
    }
  }
}
getPublicFiles("public");

let unreferencedAssets = [];
for (const asset of publicFiles) {
  const filename = path.basename(asset);
  // web path relative to public e.g. /images/books/book-01.webp
  const relPath = "/" + path.relative("public", asset).replace(/\\/g, "/");

  // Search across all code files
  let refCount = 0;
  for (const f of fileContents) {
    if (f.content.includes(filename) || f.content.includes(relPath)) {
      refCount++;
    }
  }

  // Also check if matches patterns like `book-${id}.webp` or dynamic strings
  const isBookImage = asset.includes("books\\book-") || asset.includes("books/book-");
  const isFavicon = filename.includes("icon") || filename.includes("favicon") || filename.includes("apple-");

  if (refCount === 0 && !isBookImage && !isFavicon) {
    unreferencedAssets.push({ asset, relPath, filename, size: fs.statSync(asset).size });
  }
}

console.log(`  Total public files scanned: ${publicFiles.length}`);
console.log(`  Unreferenced asset candidates: ${unreferencedAssets.length}`);
for (const u of unreferencedAssets) {
  console.log(`    - ${u.relPath} (${u.size} bytes)`);
}

// 2. Audit debugger & console.log statements
console.log("\n2. AUDITING DEBUGGER & CONSOLE STATEMENTS:");
let debugStatements = [];
for (const f of fileContents) {
  if (f.path.includes("scripts")) continue; // Allow console in maintenance scripts
  const lines = f.content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("debugger;")) {
      debugStatements.push({ file: f.path, line: idx + 1, type: "debugger", text: line.trim() });
    } else if (line.match(/\bconsole\.(log|debug|warn|trace)\(/)) {
      // Exclude intentional structured error logging e.g. console.error in catch
      if (!line.includes("console.error")) {
        debugStatements.push({ file: f.path, line: idx + 1, type: "console", text: line.trim() });
      }
    }
  });
}
console.log(`  Debug / console.log statements in src/: ${debugStatements.length}`);
debugStatements.slice(0, 15).forEach((d) => {
  console.log(`    - [${d.type}] ${d.file}:${d.line} -> ${d.text}`);
});

// 3. Audit scripts directory
console.log("\n3. AUDITING SCRIPTS/ DIRECTORY:");
const scriptFiles = fs.readdirSync("scripts");
for (const s of scriptFiles) {
  const full = path.join("scripts", s);
  const size = fs.statSync(full).size;
  console.log(`  - scripts/${s} (${size} bytes)`);
}

// 4. Audit root stray files
console.log("\n4. AUDITING ROOT DIRECTORY CANDIDATES:");
const rootCandidates = [
  "delivery-enterprise-upgrade.zip",
  "robots.txt",
  "CNAME",
  "tsconfig.tsbuildinfo",
];
for (const c of rootCandidates) {
  if (fs.existsSync(c)) {
    const size = fs.statSync(c).size;
    console.log(`  - ${c} (${size} bytes) -> EXISTS`);
  }
}

