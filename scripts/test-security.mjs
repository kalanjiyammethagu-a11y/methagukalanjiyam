/**
 * Automated Security Verification Test Suite
 * Tests: Input validation, rate limiting, cryptographic signature verification,
 * and malicious payload rejection.
 */

import assert from "node:assert";
import crypto from "node:crypto";
import { rateLimit } from "../src/lib/rate-limit.ts";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../src/lib/crypto.ts";
import {
  createOrderSchema,
  verifyPaymentSchema,
} from "../src/lib/validators/order.ts";
import { sanitizeHtml, safeJsonLdStringify } from "../src/lib/sanitize.ts";

console.log("=================================================");
console.log(" METHAGU KALANJIYAM — SECURITY VERIFICATION SUITE");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -----------------------------------------------------------------
// 1. INPUT VALIDATION TESTS (ZOD BOUNDARY DEFENSE)
// -----------------------------------------------------------------
console.log("[1] Input Validation & Schema Hardening Tests:");

runTest("Rejects invalid phone number (less than 10 digits)", () => {
  const result = createOrderSchema.safeParse({
    items: [{ book_id: "book-1", quantity: 1 }],
    shipping_address: {
      full_name: "Test User",
      phone: "12345", // INVALID
      house_name: "No 1",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
  });
  assert.strictEqual(result.success, false);
});

runTest("Rejects invalid pincode (alphanumeric or wrong length)", () => {
  const result = createOrderSchema.safeParse({
    items: [{ book_id: "book-1", quantity: 1 }],
    shipping_address: {
      full_name: "Test User",
      phone: "9876543210",
      house_name: "No 1",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "00000A", // INVALID
    },
  });
  assert.strictEqual(result.success, false);
});

runTest("Rejects empty items array (zero items)", () => {
  const result = createOrderSchema.safeParse({
    items: [],
    shipping_address: {
      full_name: "Test User",
      phone: "9876543210",
      house_name: "No 1",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
  });
  assert.strictEqual(result.success, false);
});

runTest("Rejects oversized quantity per item (> 50 items)", () => {
  const result = createOrderSchema.safeParse({
    items: [{ book_id: "book-1", quantity: 51 }],
    shipping_address: {
      full_name: "Test User",
      phone: "9876543210",
      house_name: "No 1",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
  });
  assert.strictEqual(result.success, false);
});

runTest("Rejects unknown properties (Zod .strict() enforcement)", () => {
  const result = createOrderSchema.safeParse({
    items: [{ book_id: "book-1", quantity: 1 }],
    shipping_address: {
      full_name: "Test User",
      phone: "9876543210",
      house_name: "No 1",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
    malicious_injected_field: "attack_payload", // NOT PERMITTED
  });
  assert.strictEqual(result.success, false);
});

runTest("Payment verify schema rejects forged ID formats", () => {
  const result = verifyPaymentSchema.safeParse({
    razorpay_order_id: "invalid_order_format",
    razorpay_payment_id: "pay_12345",
    razorpay_signature: "a".repeat(64),
  });
  assert.strictEqual(result.success, false);
});

runTest("Payment verify schema accepts valid format", () => {
  const result = verifyPaymentSchema.safeParse({
    razorpay_order_id: "order_Kz8yZ3abcdef12",
    razorpay_payment_id: "pay_Kz8yZ3abcdef12",
    razorpay_signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  });
  assert.strictEqual(result.success, true);
});

// -----------------------------------------------------------------
// 2. CRYPTOGRAPHIC SIGNATURE & HMAC TESTS
// -----------------------------------------------------------------
console.log("\n[2] Cryptographic Signature & Webhook Security Tests:");

const TEST_SECRET = "sec_test_secret_key_12345";
const TEST_ORDER = "order_MK99887766";
const TEST_PAYMENT = "pay_MK11223344";

runTest("Verifies valid payment signature using HMAC SHA-256", () => {
  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${TEST_ORDER}|${TEST_PAYMENT}`)
    .digest("hex");

  const verified = verifyPaymentSignature({
    order_id: TEST_ORDER,
    payment_id: TEST_PAYMENT,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.strictEqual(verified, true);
});

runTest("Rejects forged/altered payment signature", () => {
  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${TEST_ORDER}|${TEST_PAYMENT}`)
    .digest("hex");

  const tamperedSignature = validSignature.slice(0, -1) + (validSignature.slice(-1) === "0" ? "1" : "0");

  const verified = verifyPaymentSignature({
    order_id: TEST_ORDER,
    payment_id: TEST_PAYMENT,
    signature: tamperedSignature,
    secret: TEST_SECRET,
  });

  assert.strictEqual(verified, false);
});

runTest("Verifies authentic Razorpay webhook raw body signature", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", id: "evt_123" });
  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(rawBody)
    .digest("hex");

  const verified = verifyWebhookSignature(rawBody, validSignature, TEST_SECRET);
  assert.strictEqual(verified, true);
});

runTest("Rejects modified webhook payload (anti-tampering)", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", id: "evt_123" });
  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(rawBody)
    .digest("hex");

  const tamperedBody = JSON.stringify({ event: "payment.captured", id: "evt_123_MODIFIED" });

  const verified = verifyWebhookSignature(tamperedBody, validSignature, TEST_SECRET);
  assert.strictEqual(verified, false);
});

// -----------------------------------------------------------------
// 3. RATE LIMITING TESTS
// -----------------------------------------------------------------
console.log("\n[3] In-Memory Rate Limiting Sliding Window Tests:");

runTest("Enforces request threshold and triggers HTTP 429", () => {
  const testIp = `test-client-${Date.now()}`;
  const limit = 5;
  const windowMs = 5000;

  for (let i = 0; i < limit; i++) {
    const res = rateLimit(testIp, limit, windowMs);
    assert.strictEqual(res.success, true);
  }

  // Next request must be rejected
  const overLimitRes = rateLimit(testIp, limit, windowMs);
  assert.strictEqual(overLimitRes.success, false);
  assert.strictEqual(overLimitRes.remaining, 0);
});

// -----------------------------------------------------------------
// 4. XSS SANITIZATION & SCRIPT BREAKOUT TESTS
// -----------------------------------------------------------------
console.log("\n[4] XSS Sanitization & JSON-LD Breakout Defense Tests:");

runTest("Strips <script> tags from HTML content", () => {
  const dirty = "<p>Authentic History</p><script>alert('XSS')</script>";
  const clean = sanitizeHtml(dirty);
  assert.strictEqual(clean, "<p>Authentic History</p>");
});

runTest("Strips inline event handlers (onerror, onclick, onload)", () => {
  const dirty = '<img src="valid.jpg" onerror="alert(1)" onload="evil()" />';
  const clean = sanitizeHtml(dirty);
  assert.strictEqual(clean.includes("onerror"), false);
  assert.strictEqual(clean.includes("onload"), false);
});

runTest("Escapes </script> tag in JSON-LD stringify", () => {
  const maliciousBook = {
    title: "Test Book</script><script>alert('pwned')</script>",
  };
  const jsonLd = safeJsonLdStringify(maliciousBook);
  assert.strictEqual(jsonLd.includes("</script>"), false);
  assert.strictEqual(jsonLd.includes("\\u003c/script\\u003e"), true);
});

console.log("\n=================================================");
console.log(` SUMMARY: ${passedTests} / ${totalTests} SECURITY TESTS PASSED`);
console.log("=================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
