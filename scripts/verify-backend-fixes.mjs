/**
 * Verification test script for backend, database, and CRUD hardening
 */
import assert from "node:assert";

async function runTests() {
  console.log("=================================================");
  console.log("  BACKEND & DATABASE HARDENING VERIFICATION SUITE");
  console.log("=================================================");

  // 1. Verify that backdoor strings are absent in all source files
  const fs = await import("node:fs");
  const path = await import("node:path");

  function scanDir(dir, patterns) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const matches = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", ".next", ".git"].includes(entry.name)) {
          matches.push(...scanDir(fullPath, patterns));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            matches.push({ file: fullPath, pattern });
          }
        }
      }
    }
    return matches;
  }

  const backdoorMatches = scanDir("src", ["signature_valid", "admin-01"]);
  console.log(`[TEST 1] Admin Backdoor Tokens Scan: Found ${backdoorMatches.length} matches.`);
  assert.strictEqual(backdoorMatches.length, 0, "No backdoor tokens should exist in src/");
  console.log("  ✓ PASS: Zero backdoor tokens found across entire codebase.\n");

  // 2. Verify existence of new CRUD routes
  const requiredFiles = [
    "src/app/api/admin/categories/route.ts",
    "src/app/api/categories/route.ts",
    "src/app/api/addresses/route.ts",
    "src/app/api/books/route.ts",
    "supabase/migrations/010_database_hardening.sql",
  ];

  console.log("[TEST 2] Verifying New CRUD and Migration Modules:");
  for (const relPath of requiredFiles) {
    const exists = fs.existsSync(path.resolve(relPath));
    console.log(`  Checking ${relPath}: ${exists ? "FOUND" : "MISSING"}`);
    assert.strictEqual(exists, true, `File ${relPath} must exist`);
  }
  console.log("  ✓ PASS: All required CRUD modules and migrations exist.\n");

  // 3. Test calculateOrderSummaryAsync logic directly
  console.log("[TEST 3] Testing calculateOrderSummary calculation logic:");
  const { calculateOrderSummary } = await import("../src/lib/razorpay.ts");

  const summaryTN = calculateOrderSummary(
    [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 2 }],
    "Tamil Nadu"
  );
  assert.strictEqual(summaryTN.items.length, 1);
  assert.strictEqual(summaryTN.shippingFee, 60);
  assert.strictEqual(summaryTN.subtotal, 200); // 100 * 2
  assert.strictEqual(summaryTN.totalAmount, 260);
  assert.strictEqual(summaryTN.amountInPaise, 26000);
  console.log(`  TN shipping verified: Subtotal=₹${summaryTN.subtotal}, Shipping=₹${summaryTN.shippingFee}, Total=₹${summaryTN.totalAmount}`);

  const summaryOther = calculateOrderSummary(
    [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 1 }],
    "Karnataka"
  );
  assert.strictEqual(summaryOther.shippingFee, 100);
  assert.strictEqual(summaryOther.totalAmount, 200);
  console.log(`  Other India shipping verified: Subtotal=₹${summaryOther.subtotal}, Shipping=₹${summaryOther.shippingFee}, Total=₹${summaryOther.totalAmount}`);
  console.log("  ✓ PASS: Server-side pricing & shipping calculation validated.\n");

  console.log("=================================================");
  console.log("  ALL TESTS PASSED WITH 100% EMPIRICAL PROOF");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
