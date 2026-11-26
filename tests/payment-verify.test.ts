import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "../src/lib/crypto.ts";
import { calculateOrderSummary } from "../src/lib/razorpay.ts";
import {
  addressSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from "../src/lib/validators/order.ts";

describe("Payment Verification, Webhook Crypto & Order Summary Tests", () => {
  const testSecret = "test_razorpay_secret_key_123456789";
  const webhookSecret = "whsec_test_secret_987654321";
  const validOrderId = "order_EKfMRJln2Gj30A";
  const validPaymentId = "pay_29QQoUBi66xm2f";

  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${validOrderId}|${validPaymentId}`)
    .digest("hex");

  it("1. Valid payment signature verifies successfully with timing-safe HMAC SHA-256", () => {
    const isValid = verifyPaymentSignature({
      order_id: validOrderId,
      payment_id: validPaymentId,
      signature: validSignature,
      secret: testSecret,
    });
    assert.equal(isValid, true);
  });

  it("2. Rejects tampered, mismatched-length, or missing-secret payment signatures", () => {
    assert.equal(
      verifyPaymentSignature({
        order_id: validOrderId,
        payment_id: validPaymentId,
        signature: "a".repeat(64),
        secret: testSecret,
      }),
      false
    );

    assert.equal(
      verifyPaymentSignature({
        order_id: validOrderId,
        payment_id: validPaymentId,
        signature: "abc123",
        secret: testSecret,
      }),
      false
    );

    const prevEnvSecret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;
    try {
      assert.equal(
        verifyPaymentSignature({
          order_id: validOrderId,
          payment_id: validPaymentId,
          signature: validSignature,
          secret: "",
        }),
        false
      );
      assert.equal(
        verifyPaymentSignature({
          order_id: "",
          payment_id: validPaymentId,
          signature: validSignature,
          secret: testSecret,
        }),
        false
      );
      assert.equal(
        verifyPaymentSignature({
          order_id: validOrderId,
          payment_id: "",
          signature: validSignature,
          secret: testSecret,
        }),
        false
      );
      assert.equal(
        verifyPaymentSignature({
          order_id: validOrderId,
          payment_id: validPaymentId,
          signature: "",
          secret: testSecret,
        }),
        false
      );
    } finally {
      if (prevEnvSecret !== undefined) {
        process.env.RAZORPAY_KEY_SECRET = prevEnvSecret;
      }
    }
  });

  it("3. verifyWebhookSignature validates exact raw bodies and rejects tampering, wrong length, or missing secret", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: validPaymentId, order_id: validOrderId, amount: 26000 } } } });
    const sig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

    assert.equal(verifyWebhookSignature(rawBody, sig, webhookSecret), true);
    assert.equal(verifyWebhookSignature(rawBody + " ", sig, webhookSecret), false);
    assert.equal(verifyWebhookSignature(rawBody, "a".repeat(64), webhookSecret), false);
    assert.equal(verifyWebhookSignature(rawBody, "short_sig", webhookSecret), false);
    assert.equal(verifyWebhookSignature("", sig, webhookSecret), false);
    assert.equal(verifyWebhookSignature(rawBody, "", webhookSecret), false);
    assert.equal(verifyWebhookSignature(rawBody, sig, ""), false);
  });

  it("4. verifyPaymentSchema, addressSchema, and createOrderSchema reject invalid inputs", () => {
    assert.equal(verifyPaymentSchema.safeParse({}).success, false);
    assert.equal(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: validOrderId,
        razorpay_payment_id: validPaymentId,
      }).success,
      false
    );
    assert.equal(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: "invalid_id",
        razorpay_payment_id: "invalid_pay",
        razorpay_signature: "invalid_sig",
      }).success,
      false
    );

    assert.equal(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: validOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature,
      }).success,
      true
    );

    // Address validation enforces pincode, phone, and .strict()
    assert.equal(
      addressSchema.safeParse({
        full_name: "Arun",
        phone: "9876543210",
        house_name: "12 Gandhi Street",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "012345",
      }).success,
      false
    );
    assert.equal(
      addressSchema.safeParse({
        full_name: "Arun",
        phone: "+91 98765 43210",
        house_name: "12 Gandhi Street",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
      }).success,
      true
    );
    assert.equal(
      createOrderSchema.safeParse({
        items: [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 1 }],
        shipping_address: {
          full_name: "Arun",
          phone: "9876543210",
          house_name: "12 Gandhi Street",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
        },
        unexpected_field: "blocked_by_strict",
      }).success,
      false
    );
  });

  it("5. calculateOrderSummary computes real book totals and regional shipping accurately", () => {
    const tn = calculateOrderSummary(
      [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 2 }],
      "Tamil Nadu"
    );
    assert.equal(tn.subtotal, 200);
    assert.equal(tn.shippingFee, 60);
    assert.equal(tn.totalAmount, 260);
    assert.equal(tn.amountInPaise, 26000);

    const other = calculateOrderSummary(
      [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 2 }],
      "Kerala"
    );
    assert.equal(other.shippingFee, 100);
    assert.equal(other.totalAmount, 300);

    const freeShip = calculateOrderSummary(
      [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 10 }],
      "Kerala"
    );
    assert.equal(freeShip.subtotal, 1000);
    assert.equal(freeShip.shippingFee, 0);
    assert.equal(freeShip.amountInPaise, 100000);

    assert.throws(
      () => calculateOrderSummary([], "Tamil Nadu"),
      /Order must contain at least one item/
    );
    assert.throws(
      () =>
        calculateOrderSummary(
          [{ book_id: "b0000000-0000-0000-0000-000000000001", quantity: 0 }],
          "Tamil Nadu"
        ),
      /Invalid quantity/
    );
  });
});
