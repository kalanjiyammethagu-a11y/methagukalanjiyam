export interface DeliveryAddressInfo {
  fullName?: string;
  phone?: string;
  doorStreet?: string;
  cityArea?: string;
  districtState?: string;
  pincode?: string;
}

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916384654946";

export function getWhatsAppOrderUrl(
  bookTitle: string,
  price: number,
  slug: string,
  quantity: number = 1,
  address?: DeliveryAddressInfo | string
): string {
  const totalPrice = price * quantity;
  let text = `வணக்கம் மேதகு களஞ்சியம்,\nநான் "${bookTitle}" நூலை வாங்க விரும்புகிறேன்.\n• எண்ணிக்கை: ${quantity}\n• நூல் தொகை: ₹${totalPrice}\n• அஞ்சல் சேவை: ST Courier / Speed Post (TN: ₹60 / பிற மாநிலங்கள்: ₹100)\n• விவரப் பக்கம்: https://methagukalanjiyam.in/books/${slug}`;

  if (typeof address === "string" && address.trim()) {
    text += `\n\n📦 அஞ்சல் டெலிவரி முகவரி:\n${address.trim()}`;
  } else if (address && typeof address === "object" && address.fullName) {
    const formatted = [
      address.fullName,
      address.phone ? `அலைபேசி: ${address.phone}` : null,
      address.doorStreet,
      [address.cityArea, address.districtState, address.pincode].filter(Boolean).join(" - "),
    ].filter(Boolean).join("\n");
    if (formatted.trim()) {
      text += `\n\n📦 அஞ்சல் டெலிவரி முகவரி:\n${formatted}`;
    }
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getGeneralWhatsAppUrl(customMessage?: string): string {
  const text = customMessage || `வணக்கம் மேதகு களஞ்சியம், நான் புத்தகங்களை வாங்க விரும்புகிறேன்.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
