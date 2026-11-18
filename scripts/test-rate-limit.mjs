import test from "node:test";
import assert from "node:assert/strict";

// Dynamic import of the compiled/source rate-limit module
// We can test the exact rate limiting sliding-window algorithm logic
import { rateLimit, resetRateLimit, resetAllRateLimits } from "../src/lib/rate-limit.ts";

test("Rate limiter allows requests under the limit", () => {
  resetAllRateLimits();
  const id = "test-ip-1";
  const limit = 5;
  const windowMs = 1000;

  for (let i = 1; i <= limit; i++) {
    const res = rateLimit(id, limit, windowMs);
    assert.equal(res.success, true, `Request ${i} should succeed`);
    assert.equal(res.remaining, limit - i, `Remaining should be ${limit - i}`);
    assert.ok(res.reset > Date.now(), "Reset timestamp should be in the future");
  }
});

test("Rate limiter blocks requests over the limit", () => {
  resetAllRateLimits();
  const id = "test-ip-2";
  const limit = 3;
  const windowMs = 1000;

  // Consume allowance
  rateLimit(id, limit, windowMs);
  rateLimit(id, limit, windowMs);
  rateLimit(id, limit, windowMs);

  // 4th request should fail
  const blocked = rateLimit(id, limit, windowMs);
  assert.equal(blocked.success, false, "4th request must be blocked");
  assert.equal(blocked.remaining, 0, "Remaining must be 0");
  assert.ok(blocked.reset > Date.now(), "Reset timestamp must be set");
});

test("Rate limiter handles independent identifiers separately", () => {
  resetAllRateLimits();
  const idA = "ip-a";
  const idB = "ip-b";
  const limit = 2;
  const windowMs = 1000;

  rateLimit(idA, limit, windowMs);
  rateLimit(idA, limit, windowMs);
  assert.equal(rateLimit(idA, limit, windowMs).success, false, "ip-a should be blocked");

  // ip-b should still be allowed
  assert.equal(rateLimit(idB, limit, windowMs).success, true, "ip-b should be allowed");
});

test("Rate limiter resets when resetRateLimit is called", () => {
  resetAllRateLimits();
  const id = "test-reset";
  const limit = 1;
  const windowMs = 1000;

  rateLimit(id, limit, windowMs);
  assert.equal(rateLimit(id, limit, windowMs).success, false);

  resetRateLimit(id);
  assert.equal(rateLimit(id, limit, windowMs).success, true, "Should succeed after reset");
});
