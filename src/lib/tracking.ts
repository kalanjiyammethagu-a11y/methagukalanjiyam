import type { OrderStatus } from "@/types/admin";

export const ST_COURIER_DEFAULT_NAME = "ST Courier";
export const ST_COURIER_TRACKING_URL = "https://stcourier.com/";

export const COURIER_OPTIONS = [
  "ST Courier",
  "India Post",
  "Professional Courier",
] as const;

export const SHIPMENT_STATUSES = [
  "Processing",
  "Packed",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delivery Failed",
  "Returned",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, { en: string; ta: string }> = {
  Processing: { en: "Processing", ta: "செயலாக்கத்தில்" },
  Packed: { en: "Packed", ta: "பொட்டலமிடப்பட்டது" },
  Shipped: { en: "Shipped", ta: "அனுப்பப்பட்டது" },
  "In Transit": { en: "In Transit", ta: "போக்குவரத்தில்" },
  "Out for Delivery": { en: "Out for Delivery", ta: "விநியோகத்திற்குப் புறப்பட்டது" },
  Delivered: { en: "Delivered", ta: "வழங்கப்பட்டது" },
  "Delivery Failed": { en: "Delivery Failed", ta: "விநியோகம் தோல்வி" },
  Returned: { en: "Returned", ta: "திரும்பப் பெறப்பட்டது" },
};

export interface ShipmentEventItem {
  id: string;
  order_id: string;
  status: ShipmentStatus;
  note?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export const TRACKING_ID_REGEX = /^[A-Za-z0-9-]{5,30}$/;

/**
 * Light validation & normalization for ST Courier / courier tracking numbers.
 * Exact ST Courier barcode rules vary across branches, so only trims whitespace and accepts
 * 5-30 alphanumeric/hyphen characters.
 */
export function normalizeTrackingId(raw?: string | null): string {
  return (raw || "").trim();
}

export function validateTrackingId(raw?: string | null): {
  valid: boolean;
  value: string;
  error?: string;
} {
  const value = normalizeTrackingId(raw);
  if (!value) {
    return { valid: true, value: "" };
  }
  if (value.length < 5 || value.length > 30) {
    return {
      valid: false,
      value,
      error: "Tracking ID must be 5 to 30 characters after trimming.",
    };
  }
  if (!TRACKING_ID_REGEX.test(value)) {
    return {
      valid: false,
      value,
      error: "Tracking ID may only contain letters, digits, and hyphens (-).",
    };
  }
  return { valid: true, value };
}

export function resolveCourierTrackingUrl(courierName?: string | null): string {
  const normalized = (courierName || "").trim().toLowerCase();
  if (normalized.includes("india") || normalized.includes("post") || normalized.includes("speed")) {
    return "https://www.indiapost.gov.in/";
  }
  if (normalized.includes("professional")) {
    return "https://www.tpcindia.com/";
  }
  return ST_COURIER_TRACKING_URL;
}

export function mapLegacyCourierToName(courier?: string | null): string {
  const clean = (courier || "").trim();
  if (!clean) return ST_COURIER_DEFAULT_NAME;
  const lower = clean.toLowerCase();
  if (lower === "st_courier" || lower.includes("st courier") || lower === "st") {
    return ST_COURIER_DEFAULT_NAME;
  }
  if (lower === "india_post" || lower.includes("india") || lower.includes("speed")) {
    return "India Post";
  }
  if (lower === "professional_courier" || lower.includes("professional")) {
    return "Professional Courier";
  }
  return clean;
}

export function mapCourierNameToLegacyEnum(
  courierName?: string | null
): "st_courier" | "india_post" | "professional_courier" {
  const lower = (courierName || "").trim().toLowerCase();
  if (lower.includes("india") || lower.includes("post") || lower.includes("speed")) {
    return "india_post";
  }
  if (lower.includes("professional")) {
    return "professional_courier";
  }
  return "st_courier";
}

export function normalizeShipmentStatus(
  shipmentStatus?: string | null,
  legacyOrderStatus?: string | null,
  trackingId?: string | null
): ShipmentStatus {
  const raw = (shipmentStatus || "").trim();
  if (SHIPMENT_STATUSES.includes(raw as ShipmentStatus)) {
    return raw as ShipmentStatus;
  }
  const legacy = (legacyOrderStatus || "").trim().toLowerCase();
  if (legacy === "delivered") return "Delivered";
  if (legacy === "returned") return "Returned";
  if (legacy === "dispatched" || legacy === "shipped" || (trackingId && trackingId.trim())) {
    return "Shipped";
  }
  return "Processing";
}

export function mapShipmentStatusToAdminOrderStatus(
  shipmentStatus: ShipmentStatus,
  currentStatus?: OrderStatus
): OrderStatus {
  if (shipmentStatus === "Delivered") return "delivered";
  if (shipmentStatus === "Shipped" || shipmentStatus === "In Transit" || shipmentStatus === "Out for Delivery") {
    return "shipped";
  }
  if (shipmentStatus === "Returned" || shipmentStatus === "Delivery Failed") {
    return currentStatus === "cancelled" ? "cancelled" : "shipped";
  }
  if (shipmentStatus === "Packed" || shipmentStatus === "Processing") {
    return currentStatus === "pending" ? "confirmed" : currentStatus || "confirmed";
  }
  return currentStatus || "confirmed";
}

export function mapShipmentStatusToDbOrderStatus(
  shipmentStatus: ShipmentStatus
): "confirmed" | "dispatched" | "delivered" | "returned" | undefined {
  switch (shipmentStatus) {
    case "Processing":
    case "Packed":
      return "confirmed";
    case "Shipped":
    case "In Transit":
    case "Out for Delivery":
      return "dispatched";
    case "Delivered":
      return "delivered";
    case "Returned":
      return "returned";
    default:
      return undefined;
  }
}

/**
 * Finds other orders using the same tracking ID (case-insensitive) to warn admins without blocking saves.
 */
export function findDuplicateTrackingOrders(
  trackingId: string | null | undefined,
  currentOrderId: string,
  allOrders: Array<{ id: string; orderNumber: string; trackingId?: string | null; trackingNumber?: string | null }>
): Array<{ id: string; orderNumber: string }> {
  const normalized = normalizeTrackingId(trackingId).toLowerCase();
  if (!normalized) return [];

  return allOrders
    .filter((o) => {
      if (o.id === currentOrderId) return false;
      const otherId = normalizeTrackingId(o.trackingId || o.trackingNumber).toLowerCase();
      return Boolean(otherId && otherId === normalized);
    })
    .map((o) => ({ id: o.id, orderNumber: o.orderNumber }));
}

export interface WhatsAppTrackingMessageInput {
  customerName: string;
  orderNumber: string;
  trackingId?: string | null;
  courierName?: string | null;
  shipmentStatus?: ShipmentStatus | string | null;
  trackingUrl?: string | null;
  customerNoteTa?: string | null;
  customerNoteEn?: string | null;
}

/**
 * Generates a UTF-8 bilingual Tamil + English dispatch update message for WhatsApp.
 */
export function buildWhatsAppTrackingMessage(input: WhatsAppTrackingMessageInput): string {
  const courier = (input.courierName || ST_COURIER_DEFAULT_NAME).trim() || ST_COURIER_DEFAULT_NAME;
  const trackingId = normalizeTrackingId(input.trackingId);
  const status = normalizeShipmentStatus(input.shipmentStatus, undefined, trackingId);
  const statusLabels = SHIPMENT_STATUS_LABELS[status];
  const trackingUrl = input.trackingUrl?.trim() || resolveCourierTrackingUrl(courier);

  const lines: string[] = [
    `வணக்கம் ${input.customerName},`,
    `உங்கள் மேதகு களஞ்சியம் ஆர்டர் #${input.orderNumber} (${courier}) நிலை: ${statusLabels.ta}.`,
    trackingId
      ? `பார்சல் கண்காணிப்பு எண் (Tracking ID): ${trackingId}`
      : `பார்சல் கண்காணிப்பு எண் விரைவில் பகிரப்படும்.`,
    ...(input.customerNoteTa?.trim() ? [`குறிப்பு: ${input.customerNoteTa.trim()}`] : []),
    `கண்காணிக்க (${courier}): ${trackingUrl}`,
    "",
    `Hello ${input.customerName},`,
    `Update on your Methagu Kalanjiyam order #${input.orderNumber} (${courier}): ${statusLabels.en}.`,
    trackingId
      ? `Tracking ID: ${trackingId}`
      : `Tracking details will be shared shortly.`,
    ...(input.customerNoteEn?.trim() ? [`Note: ${input.customerNoteEn.trim()}`] : []),
    `Track at: ${trackingUrl}`,
  ];

  return lines.join("\n");
}

export function buildBilingualWhatsAppTrackingUrl(
  input: WhatsAppTrackingMessageInput & { customerPhone: string }
): string {
  const cleanPhone = (input.customerPhone || "").replace(/[^0-9]/g, "");
  const message = buildWhatsAppTrackingMessage(input);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
