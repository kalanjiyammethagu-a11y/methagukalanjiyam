import { createAdminClient } from "@/lib/supabase/admin";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import {
  DEFAULT_SHIPPING_CONFIG,
  sanitizeNonNegativeNumber,
  type StorePublicGeneralConfig,
  type StoreShippingConfig,
} from "@/lib/shipping-rules";

export {
  computeShippingFee,
  DEFAULT_SHIPPING_CONFIG,
  isTamilNaduDestination,
  type StorePublicGeneralConfig,
  type StoreShippingConfig,
} from "@/lib/shipping-rules";

export const DEFAULT_PUBLIC_GENERAL_CONFIG: StorePublicGeneralConfig = {
  site_name_ta: "மேதகு களஞ்சியம்",
  site_name_en: "Methagu Kalanjiyam",
  contact_phone: "+91 63846 54946",
  alt_phone: "+91 63846 54946",
  support_email: "contact@methagukalanjiyam.in",
  whatsapp_number: WHATSAPP_NUMBER,
  udyam_id: "UDYAM-TN-18-0101323",
};

/**
 * Reads live shipping & general store settings from Supabase `site_settings`, falling back cleanly.
 */
export async function getStorePublicSettings(): Promise<{
  shipping: StoreShippingConfig;
  general: StorePublicGeneralConfig;
}> {
  try {
    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

    if (isPlaceholderDb) {
      return {
        shipping: DEFAULT_SHIPPING_CONFIG,
        general: DEFAULT_PUBLIC_GENERAL_CONFIG,
      };
    }

    const adminSupabase = createAdminClient();
    const { data: rows, error } = await (adminSupabase.from("site_settings") as any)
      .select("key, value")
      .in("key", ["shipping", "general"]);

    if (error || !Array.isArray(rows)) {
      return {
        shipping: DEFAULT_SHIPPING_CONFIG,
        general: DEFAULT_PUBLIC_GENERAL_CONFIG,
      };
    }

    const map: Record<string, any> = {};
    for (const r of rows) {
      if (r?.key && r?.value) map[r.key] = r.value;
    }

    const rawShipping = map.shipping || {};
    const rawGeneral = map.general || {};

    return {
      shipping: {
        default_courier:
          typeof rawShipping.default_courier === "string" && rawShipping.default_courier.trim()
            ? rawShipping.default_courier
            : DEFAULT_SHIPPING_CONFIG.default_courier,
        standard_shipping_fee: sanitizeNonNegativeNumber(
          rawShipping.standard_shipping_fee,
          DEFAULT_SHIPPING_CONFIG.standard_shipping_fee
        ),
        other_india_shipping_fee: sanitizeNonNegativeNumber(
          rawShipping.other_india_shipping_fee,
          DEFAULT_SHIPPING_CONFIG.other_india_shipping_fee
        ),
        free_shipping_threshold: sanitizeNonNegativeNumber(
          rawShipping.free_shipping_threshold,
          DEFAULT_SHIPPING_CONFIG.free_shipping_threshold
        ),
        deliverable_pincodes_note:
          rawShipping.deliverable_pincodes_note || DEFAULT_SHIPPING_CONFIG.deliverable_pincodes_note,
        deliverable_pincodes_note_ta:
          rawShipping.deliverable_pincodes_note_ta ||
          DEFAULT_SHIPPING_CONFIG.deliverable_pincodes_note_ta,
      },
      general: {
        site_name_ta: rawGeneral.site_name_ta || DEFAULT_PUBLIC_GENERAL_CONFIG.site_name_ta,
        site_name_en: rawGeneral.site_name_en || DEFAULT_PUBLIC_GENERAL_CONFIG.site_name_en,
        contact_phone: rawGeneral.contact_phone || DEFAULT_PUBLIC_GENERAL_CONFIG.contact_phone,
        alt_phone: rawGeneral.alt_phone || DEFAULT_PUBLIC_GENERAL_CONFIG.alt_phone,
        support_email: rawGeneral.support_email || DEFAULT_PUBLIC_GENERAL_CONFIG.support_email,
        whatsapp_number:
          String(rawGeneral.whatsapp_number || DEFAULT_PUBLIC_GENERAL_CONFIG.whatsapp_number).replace(
            /\D/g,
            ""
          ) || WHATSAPP_NUMBER,
        udyam_id: rawGeneral.udyam_id || DEFAULT_PUBLIC_GENERAL_CONFIG.udyam_id,
      },
    };
  } catch {
    return {
      shipping: DEFAULT_SHIPPING_CONFIG,
      general: DEFAULT_PUBLIC_GENERAL_CONFIG,
    };
  }
}

export async function getShippingConfig(): Promise<StoreShippingConfig> {
  const { shipping } = await getStorePublicSettings();
  return shipping;
}
