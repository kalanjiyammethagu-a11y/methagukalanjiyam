export interface StoreShippingConfig {
  default_courier: string;
  standard_shipping_fee: number;
  other_india_shipping_fee: number;
  free_shipping_threshold: number;
  deliverable_pincodes_note?: string;
  deliverable_pincodes_note_ta?: string;
}

export interface StorePublicGeneralConfig {
  site_name_ta: string;
  site_name_en: string;
  contact_phone: string;
  alt_phone: string;
  support_email: string;
  whatsapp_number: string;
  udyam_id: string;
}

export const DEFAULT_SHIPPING_CONFIG: StoreShippingConfig = {
  default_courier: "st_courier",
  standard_shipping_fee: 60,
  other_india_shipping_fee: 100,
  free_shipping_threshold: 1000,
  deliverable_pincodes_note:
    "Speed Post delivers to all 19,100+ postal PIN codes in India. ST Courier covers Tamil Nadu, Puducherry and South India.",
  deliverable_pincodes_note_ta:
    "தமிழ்நாடு, புதுச்சேரி மற்றும் தென்னிந்தியாவிற்கு எஸ்டி கூரியர் மூலமும், இந்தியா முழுவதும் 19,100+ அஞ்சல் குறியீடுகளுக்கு விரைவு அஞ்சல் மூலமும் நூல்கள் அனுப்பப்படுகின்றன.",
};

export function sanitizeNonNegativeNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function isTamilNaduDestination(stateOrRegion?: string | null): boolean {
  const normalized = (stateOrRegion || "").trim().toLowerCase();
  return (
    normalized === "tamil-nadu" ||
    normalized.includes("tamil") ||
    normalized.includes("தமிழ்நாடு") ||
    normalized === "tn" ||
    normalized.includes("puducherry") ||
    normalized.includes("pondicherry")
  );
}

/**
 * Pure shipping fee calculation used identically on server (/api/orders/create) and client (/cart).
 */
export function computeShippingFee(
  subtotal: number,
  stateOrRegion: string,
  config: Pick<
    StoreShippingConfig,
    "standard_shipping_fee" | "other_india_shipping_fee" | "free_shipping_threshold"
  > = DEFAULT_SHIPPING_CONFIG
): number {
  if (subtotal <= 0) return 0;

  const normalized = (stateOrRegion || "").trim().toLowerCase();
  if (normalized === "diaspora") return 0;

  const threshold = sanitizeNonNegativeNumber(
    config.free_shipping_threshold,
    DEFAULT_SHIPPING_CONFIG.free_shipping_threshold
  );
  if (threshold > 0 && subtotal >= threshold) {
    return 0;
  }

  const tnFee = sanitizeNonNegativeNumber(
    config.standard_shipping_fee,
    DEFAULT_SHIPPING_CONFIG.standard_shipping_fee
  );
  const otherIndiaFee = sanitizeNonNegativeNumber(
    config.other_india_shipping_fee,
    DEFAULT_SHIPPING_CONFIG.other_india_shipping_fee
  );

  return isTamilNaduDestination(stateOrRegion) ? tnFee : otherIndiaFee;
}
