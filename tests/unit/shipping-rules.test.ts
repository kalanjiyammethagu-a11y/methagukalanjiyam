import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SHIPPING_CONFIG,
  computeShippingFee,
  isTamilNaduDestination,
  sanitizeNonNegativeNumber,
} from "../../src/lib/shipping-rules.ts";

describe("Shipping Rules Unit Tests", () => {
  it("recognizes Tamil Nadu and Puducherry destination strings across English and Tamil", () => {
    assert.equal(isTamilNaduDestination("Tamil Nadu"), true);
    assert.equal(isTamilNaduDestination("tamil-nadu"), true);
    assert.equal(isTamilNaduDestination("TN"), true);
    assert.equal(isTamilNaduDestination("தமிழ்நாடு"), true);
    assert.equal(isTamilNaduDestination("Puducherry"), true);
    assert.equal(isTamilNaduDestination("Pondicherry"), true);
    assert.equal(isTamilNaduDestination("Karnataka"), false);
    assert.equal(isTamilNaduDestination("other-india"), false);
    assert.equal(isTamilNaduDestination(""), false);
    assert.equal(isTamilNaduDestination(null), false);
  });

  it("charges Tamil Nadu fee below free-shipping threshold and 0 at or above threshold", () => {
    assert.equal(computeShippingFee(100, "Tamil Nadu"), DEFAULT_SHIPPING_CONFIG.standard_shipping_fee);
    assert.equal(computeShippingFee(999, "TN"), 60);
    assert.equal(computeShippingFee(1000, "Tamil Nadu"), 0);
    assert.equal(computeShippingFee(1500, "Karnataka"), 0);
  });

  it("charges Other India fee below threshold and handles zero subtotal and diaspora", () => {
    assert.equal(computeShippingFee(250, "Maharashtra"), DEFAULT_SHIPPING_CONFIG.other_india_shipping_fee);
    assert.equal(computeShippingFee(250, "other-india"), 100);
    assert.equal(computeShippingFee(0, "Tamil Nadu"), 0);
    assert.equal(computeShippingFee(-10, "Tamil Nadu"), 0);
    assert.equal(computeShippingFee(500, "diaspora"), 0);
  });

  it("applies custom shipping configs and sanitizes invalid negative/NaN numbers", () => {
    assert.equal(sanitizeNonNegativeNumber("45", 60), 45);
    assert.equal(sanitizeNonNegativeNumber(-5, 60), 60);
    assert.equal(sanitizeNonNegativeNumber("invalid", 100), 100);

    const custom = {
      standard_shipping_fee: 50,
      other_india_shipping_fee: 120,
      free_shipping_threshold: 800,
    };
    assert.equal(computeShippingFee(799, "Tamil Nadu", custom), 50);
    assert.equal(computeShippingFee(799, "Delhi", custom), 120);
    assert.equal(computeShippingFee(800, "Delhi", custom), 0);
  });
});
