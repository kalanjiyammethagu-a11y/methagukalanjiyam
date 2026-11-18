import crypto from "crypto";

/**
 * Cryptographically verifies Razorpay payment signature
 * HMAC SHA256 of order_id + "|" + payment_id using RAZORPAY_KEY_SECRET
 */
export function verifyPaymentSignature(params: {
  order_id: string;
  payment_id: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || process.env.RAZORPAY_KEY_SECRET;

  if (!secret || !params.signature || !params.order_id || !params.payment_id) {
    return false;
  }

  const payload = `${params.order_id}|${params.payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (expectedSignature.length !== params.signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf8"),
    Buffer.from(params.signature, "utf8")
  );
}

/**
 * Cryptographically verifies Razorpay Webhook signature
 * HMAC SHA256 of raw body using RAZORPAY_WEBHOOK_SECRET
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET || ""
): boolean {
  if (!signature || !secret || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

