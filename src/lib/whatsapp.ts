export interface DeliveryAddressInfo {
  fullName?: string;
  phone?: string;
  doorStreet?: string;
  cityArea?: string;
  districtState?: string;
  pincode?: string;
}

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916384654946";
export const DISPLAY_WHATSAPP_NUMBER = "6384654946";
export const DISPLAY_PHONE = "+91 63846 54946";
export const DISPLAY_WHATSAPP_LABEL_TA = "WhatsApp எண் : 6384654946";
export const DISPLAY_WHATSAPP_LABEL_EN = "WhatsApp: 6384654946";

export function buildWhatsAppDirectUrl(message?: string): string {
  const cleanNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, "");
  if (!message) return `https://wa.me/${cleanNumber}`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Format delivery address cleanly without dangling labels or "undefined".
 * Works whether fullName is present or not, as long as any address field is provided.
 */
export function formatDeliveryAddress(address?: DeliveryAddressInfo | string): string {
  if (!address) return "";

  if (typeof address === "string") {
    return address.trim();
  }

  if (typeof address === "object") {
    const parts: string[] = [];

    const name = address.fullName?.trim();
    if (name) {
      parts.push(name);
    }

    const phone = address.phone?.trim();
    if (phone) {
      parts.push(`அலைபேசி: ${phone}`);
    }

    const street = address.doorStreet?.trim();
    if (street) {
      parts.push(street);
    }

    const cityLocalityParts = [
      address.cityArea?.trim(),
      address.districtState?.trim(),
      address.pincode?.trim(),
    ].filter(Boolean);

    if (cityLocalityParts.length > 0) {
      parts.push(cityLocalityParts.join(" - "));
    }

    return parts.join("\n").trim();
  }

  return "";
}

/**
 * Generates a direct WhatsApp URL to order a specific book.
 * Incorporates postal address whenever any address field exists.
 */
export function getWhatsAppOrderUrl(
  bookTitle: string,
  price: number,
  slug: string,
  quantity: number = 1,
  address?: DeliveryAddressInfo | string
): string {
  const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
  const totalPrice = safePrice * safeQty;
  const safeTitle = (bookTitle || "").trim();
  const safeSlug = (slug || "").trim();

  let text = `வணக்கம் மேதகு களஞ்சியம்,\nநான் "${safeTitle}" நூலை வாங்க விரும்புகிறேன்.\n• எண்ணிக்கை: ${safeQty}\n• நூல் தொகை: ₹${totalPrice}\n• அஞ்சல் சேவை: ST Courier / Speed Post (TN: ₹60 / பிற மாநிலங்கள்: ₹100)\n• விவரப் பக்கம்: https://methagukalanjiyam.in/books/${safeSlug}`;

  const formattedAddress = formatDeliveryAddress(address);
  if (formattedAddress) {
    text += `\n\n📦 அஞ்சல் டெலிவரி முகவரி:\n${formattedAddress}`;
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getGeneralWhatsAppUrl(customMessage?: string): string {
  const text = customMessage?.trim() || `வணக்கம் மேதகு களஞ்சியம், நான் புத்தகங்களை வாங்க விரும்புகிறேன்.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
