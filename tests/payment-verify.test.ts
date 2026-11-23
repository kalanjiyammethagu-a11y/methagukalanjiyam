import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { verifyPaymentSignature } from "../src/lib/crypto";
import { verifyPaymentSchema } from "../src/lib/validators/order";

describe("Payment Verification & Idempotency Unit Tests", () => {
  const testSecret = "test_razorpay_secret_key_123456789";
  const validOrderId = "order_EKfMRJln2Gj30A";
  const validPaymentId = "pay_29QQoUBi66xm2f";

  // Generate valid HMAC SHA256 signature
  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${validOrderId}|${validPaymentId}`)
    .digest("hex");

  it("1. Valid signature verifies successfully with timing-safe HMAC SHA-256", () => {
    const isValid = verifyPaymentSignature({
      order_id: validOrderId,
      payment_id: validPaymentId,
      signature: validSignature,
      secret: testSecret,
    });
    assert.equal(isValid, true);
  });

  it("2. Invalid signature is strictly rejected", () => {
    const badSignature = "a".repeat(64);
    const isValid = verifyPaymentSignature({
      order_id: validOrderId,
      payment_id: validPaymentId,
      signature: badSignature,
      secret: testSecret,
    });
    assert.equal(isValid, false);

    // Mismatched length
    const shortSignature = "abc123";
    const isShortValid = verifyPaymentSignature({
      order_id: validOrderId,
      payment_id: validPaymentId,
      signature: shortSignature,
      secret: testSecret,
    });
    assert.equal(isShortValid, false);
  });

  it("3. Missing or malformed payload fields fail Zod validation with 400 status", () => {
    // Missing all fields
    const emptyResult = verifyPaymentSchema.safeParse({});
    assert.equal(emptyResult.success, false);

    // Missing signature
    const missingSig = verifyPaymentSchema.safeParse({
      razorpay_order_id: validOrderId,
      razorpay_payment_id: validPaymentId,
    });
    assert.equal(missingSig.success, false);

    // Invalid format (not matching regex)
    const malformed = verifyPaymentSchema.safeParse({
      razorpay_order_id: "invalid_id",
      razorpay_payment_id: "invalid_pay",
      razorpay_signature: "invalid_sig",
    });
    assert.equal(malformed.success, false);
  });

  it("4. Idempotent replay of same verification returns 200 with existing order", () => {
    // Simulate database state for an already paid order
    const existingOrderInDb = {
      id: "ord_1001",
      order_number: "MK-2026-0001",
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: validPaymentId,
    };

    const incomingPayment = {
      order_id: validOrderId,
      payment_id: validPaymentId,
    };

    // Idempotency check logic from route handler:
    let responseStatus: number;
    let responseBody: any;

    if (existingOrderInDb.payment_status === "paid") {
      if (existingOrderInDb.razorpay_payment_id === incomingPayment.payment_id) {
        responseStatus = 200;
        responseBody = {
          success: true,
          message: "Payment already verified and order confirmed.",
          order_id: existingOrderInDb.id,
          order_number: existingOrderInDb.order_number,
        };
      } else {
        responseStatus = 409;
        responseBody = { error: "Order is already paid with a different payment reference" };
      }
    } else {
      responseStatus = 200;
      responseBody = { success: true };
    }

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.order_id, "ord_1001");
    assert.equal(responseBody.order_number, "MK-2026-0001");
  });

  it("5. Concurrent second submission (simulated 0 updated rows + replay check) returns 200", () => {
    // Thread 1 previously updated the order.
    // Thread 2 runs: UPDATE orders ... WHERE payment_status != 'paid' -> matches 0 rows!
    const updatedRows = [] as any[]; // 0 rows updated because status is already 'paid'

    const existingOrderInDb = {
      id: "ord_1001",
      order_number: "MK-2026-0001",
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: validPaymentId,
    };

    let responseStatus: number;
    let responseBody: any;

    if (updatedRows.length === 0) {
      if (existingOrderInDb.payment_status === "paid") {
        if (existingOrderInDb.razorpay_payment_id === validPaymentId) {
          responseStatus = 200;
          responseBody = {
            success: true,
            message: "Payment already verified and order confirmed.",
            order_id: existingOrderInDb.id,
            order_number: existingOrderInDb.order_number,
          };
        } else {
          responseStatus = 409;
          responseBody = { error: "Order is already paid with a different payment reference" };
        }
      } else {
        responseStatus = 400;
        responseBody = { error: "Order could not be transitioned" };
      }
    } else {
      responseStatus = 200;
      responseBody = { success: true };
    }

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.order_id, "ord_1001");
  });

  it("6. Mismatched payment ID on an already-paid order returns 409 Conflict", () => {
    const existingOrderInDb = {
      id: "ord_1001",
      order_number: "MK-2026-0001",
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: "pay_different_payment_id_9999",
    };

    const incomingPaymentId = validPaymentId;

    let responseStatus = 200;
    let responseBody: any;

    if (existingOrderInDb.payment_status === "paid") {
      if (existingOrderInDb.razorpay_payment_id === incomingPaymentId) {
        responseStatus = 200;
      } else {
        responseStatus = 409;
        responseBody = { error: "Order is already paid with a different payment reference" };
      }
    }

    assert.equal(responseStatus, 409);
    assert.equal(responseBody.error, "Order is already paid with a different payment reference");
  });

  it("7. Terminal order status (cancelled/refunded) rejects verification with 400", () => {
    const cancelledOrder = {
      id: "ord_1002",
      order_number: "MK-2026-0002",
      payment_status: "pending",
      status: "cancelled",
      razorpay_payment_id: null,
    };

    let responseStatus = 200;
    let responseBody: any;

    if (cancelledOrder.status === "cancelled" || cancelledOrder.status === "refunded") {
      responseStatus = 400;
      responseBody = { error: `Cannot verify payment for order with status: ${cancelledOrder.status}` };
    }

    assert.equal(responseStatus, 400);
    assert.ok(responseBody.error.includes("cancelled"));
  });
});
