import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SHIPMENT_STATUSES,
  ST_COURIER_DEFAULT_NAME,
  ST_COURIER_TRACKING_URL,
  buildBilingualWhatsAppTrackingUrl,
  buildWhatsAppTrackingMessage,
  findDuplicateTrackingOrders,
  normalizeShipmentStatus,
  resolveCourierTrackingUrl,
  validateTrackingId,
} from "../../src/lib/tracking.ts";
import { adminOrderTrackingUpdateSchema } from "../../src/lib/validators/admin.ts";

describe("ST Courier Tracking validation & normalization", () => {
  it("trims whitespace and enforces 5-30 alphanumeric/hyphen light rules", () => {
    assert.deepEqual(validateTrackingId("  ST-TN-29834756  "), {
      valid: true,
      value: "ST-TN-29834756",
    });
    assert.deepEqual(validateTrackingId("   "), {
      valid: true,
      value: "",
    });
    assert.equal(validateTrackingId("1234").valid, false);
    assert.equal(validateTrackingId("A".repeat(31)).valid, false);
    assert.equal(validateTrackingId("ST 98765").valid, false);
    assert.equal(validateTrackingId("STC_98765").valid, false);
    assert.equal(validateTrackingId("ABC12").valid, true);
  });

  it("supports all 8 canonical shipment statuses and defaults to ST Courier URL", () => {
    assert.deepEqual([...SHIPMENT_STATUSES], [
      "Processing",
      "Packed",
      "Shipped",
      "In Transit",
      "Out for Delivery",
      "Delivered",
      "Delivery Failed",
      "Returned",
    ]);

    assert.equal(ST_COURIER_DEFAULT_NAME, "ST Courier");
    assert.equal(resolveCourierTrackingUrl("ST Courier"), ST_COURIER_TRACKING_URL);
    assert.equal(resolveCourierTrackingUrl(undefined), ST_COURIER_TRACKING_URL);
    assert.equal(normalizeShipmentStatus(undefined, "dispatched", null), "Shipped");
    assert.equal(normalizeShipmentStatus(undefined, "pending", "STC123456"), "Shipped");
    assert.equal(normalizeShipmentStatus("Out for Delivery", "dispatched", "STC123456"), "Out for Delivery");
  });

  it("detects duplicate tracking IDs across other orders without blocking saves", () => {
    const orders = [
      { id: "ord-1", orderNumber: "MK-1001", trackingId: "st-987654" },
      { id: "ord-2", orderNumber: "MK-1002", trackingId: "ST-987654" },
      { id: "ord-3", orderNumber: "MK-1003", trackingId: "ST-111111" },
    ];

    const dupsForOrd1 = findDuplicateTrackingOrders("  ST-987654 ", "ord-1", orders);
    assert.deepEqual(dupsForOrd1, [{ id: "ord-2", orderNumber: "MK-1002" }]);

    const noDup = findDuplicateTrackingOrders("ST-999999", "ord-1", orders);
    assert.deepEqual(noDup, []);
  });

  it("validates tracking PATCH payload via Zod schema", () => {
    const ok = adminOrderTrackingUpdateSchema.safeParse({
      orderId: "11111111-1111-4111-8111-111111111111",
      courierName: "ST Courier",
      trackingId: "  STC-12345678  ",
      shipmentStatus: "In Transit",
      estimatedDeliveryDate: "2026-12-01",
      customerNoteEn: "Dispatched via Chennai hub",
      customerNoteTa: "சென்னை மையத்திலிருந்து அனுப்பப்பட்டது",
      internalNote: "Staff remark: fragile packaging",
    });
    assert.equal(ok.success, true);

    const badTracking = adminOrderTrackingUpdateSchema.safeParse({
      orderId: "11111111-1111-4111-8111-111111111111",
      trackingId: "AB",
    });
    assert.equal(badTracking.success, false);
  });

  it("builds UTF-8 bilingual Tamil + English WhatsApp tracking message with ST Courier URL", () => {
    const msg = buildWhatsAppTrackingMessage({
      customerName: "முருகன்",
      orderNumber: "MK-2026-042",
      trackingId: "STC-55667788",
      courierName: "ST Courier",
      shipmentStatus: "Shipped",
      customerNoteTa: "நாளைக்குள் கிடைக்கும்.",
      customerNoteEn: "Expected tomorrow.",
    });

    assert.ok(msg.includes("முருகன்"));
    assert.ok(msg.includes("MK-2026-042"));
    assert.ok(msg.includes("STC-55667788"));
    assert.ok(msg.includes(ST_COURIER_TRACKING_URL));
    assert.ok(msg.includes("அனுப்பப்பட்டது"));
    assert.ok(msg.includes("Expected tomorrow."));

    const url = buildBilingualWhatsAppTrackingUrl({
      customerName: "முருகன்",
      customerPhone: "+91 98765 43210",
      orderNumber: "MK-2026-042",
      trackingId: "STC-55667788",
    });
    assert.ok(url.startsWith("https://wa.me/919876543210?text="));
    assert.equal(decodeURIComponent(url.split("text=")[1]).includes("https://stcourier.com/"), true);
  });

  it("never exposes internal_note or uses unverified cookie checks on customer order routes", () => {
    const orderDetailApi = readFileSync(
      path.resolve(process.cwd(), "src/app/api/orders/[orderNumber]/route.ts"),
      "utf8"
    );
    const myOrdersApi = readFileSync(
      path.resolve(process.cwd(), "src/app/api/orders/my-orders/route.ts"),
      "utf8"
    );

    assert.ok(orderDetailApi.includes("requireAdmin(req)"));
    assert.ok(!orderDetailApi.includes("if (adminSessionCookie)"));
    assert.ok(!orderDetailApi.includes("sanitizedOrder.internal_note"));
    assert.ok(!myOrdersApi.includes("internal_note,"));
  });
});
