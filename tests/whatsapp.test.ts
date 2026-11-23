import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getWhatsAppOrderUrl, formatDeliveryAddress } from "../src/lib/whatsapp";

describe("WhatsApp URL Builder Unit Tests", () => {
  it("should handle name only without dangling address fields", () => {
    const url = getWhatsAppOrderUrl("களத்தில் கேட்டவை", 200, "kalam", 1, {
      fullName: "Mugilan",
    });

    assert.ok(url.startsWith("https://wa.me/"));
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("Mugilan"));
    assert.ok(decoded.includes("📦 அஞ்சல் டெலிவரி முகவரி:"));
    assert.ok(!decoded.includes("undefined"));
    assert.ok(!decoded.includes("அலைபேசி:"));
  });

  it("should handle address only (without name) cleanly", () => {
    const url = getWhatsAppOrderUrl("களத்தில் கேட்டவை", 200, "kalam", 1, {
      doorStreet: "42 Bharathi Street",
      cityArea: "T Nagar",
      districtState: "Chennai",
      pincode: "600017",
    });

    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("📦 அஞ்சல் டெலிவரி முகவரி:"));
    assert.ok(decoded.includes("42 Bharathi Street"));
    assert.ok(decoded.includes("T Nagar - Chennai - 600017"));
    assert.ok(!decoded.includes("undefined"));
  });

  it("should handle both name and full address", () => {
    const url = getWhatsAppOrderUrl("களத்தில் கேட்டவை", 200, "kalam", 2, {
      fullName: "Karthik",
      phone: "9876543210",
      doorStreet: "Plot 10, VOC Nagar",
      cityArea: "Madurai",
      districtState: "Tamil Nadu",
      pincode: "625001",
    });

    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("Karthik"));
    assert.ok(decoded.includes("அலைபேசி: 9876543210"));
    assert.ok(decoded.includes("Plot 10, VOC Nagar"));
    assert.ok(decoded.includes("Madurai - Tamil Nadu - 625001"));
    assert.ok(decoded.includes("• எண்ணிக்கை: 2"));
    assert.ok(decoded.includes("• நூல் தொகை: ₹400"));
    assert.ok(!decoded.includes("undefined"));
  });

  it("should handle neither name nor address gracefully", () => {
    const url = getWhatsAppOrderUrl("களத்தில் கேட்டவை", 200, "kalam", 1, undefined);
    const decoded = decodeURIComponent(url);
    assert.ok(!decoded.includes("📦 அஞ்சல் டெலிவரி முகவரி:"));
    assert.ok(!decoded.includes("undefined"));

    const urlEmptyObj = getWhatsAppOrderUrl("களத்தில் கேட்டவை", 200, "kalam", 1, {});
    const decodedEmpty = decodeURIComponent(urlEmptyObj);
    assert.ok(!decodedEmpty.includes("📦 அஞ்சல் டெலிவரி முகவரி:"));
    assert.ok(!decodedEmpty.includes("undefined"));
  });

  it("should handle special characters and quotes safely", () => {
    const titleWithSpecialChars = 'போராட்டம் & "வெற்றி" <1984-2009> % # ? /';
    const url = getWhatsAppOrderUrl(titleWithSpecialChars, 250, "porattam-vetri", 1, {
      fullName: "Anand & Friends",
      doorStreet: "C/O Library, #5, 1st Cross & 2nd Main",
    });

    assert.ok(!url.includes(" "));
    assert.ok(!url.includes("<"));
    assert.ok(!url.includes(">"));
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('போராட்டம் & "வெற்றி" <1984-2009> % # ? /'));
    assert.ok(decoded.includes("Anand & Friends"));
  });

  it("should handle emoji properly without encoding corruption", () => {
    const emojiTitle = "விடுதலைப் புலிகள் வரலாறு 🐅🔥📖";
    const url = getWhatsAppOrderUrl(emojiTitle, 300, "viduthalai-varalaru", 1, {
      fullName: "ஈழவன் ❤️",
    });

    assert.ok(!url.includes("🐅"));
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("🐅🔥📖"));
    assert.ok(decoded.includes("ஈழவன் ❤️"));
  });

  it("should handle multi-line address gracefully", () => {
    const multiLineStreet = "Door 15, Ground Floor,\nNear Old Temple,\nWest Mambalam";
    const url = getWhatsAppOrderUrl("வரலாற்று சுவடுகள்", 150, "suvadugal", 1, {
      doorStreet: multiLineStreet,
      pincode: "600033",
    });

    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("Door 15, Ground Floor,\nNear Old Temple,\nWest Mambalam"));
    assert.ok(decoded.includes("600033"));
    assert.ok(!decoded.includes("undefined"));
  });

  it("should handle very long input without crashing or overflowing", () => {
    const veryLongTitle = "வரலாறு ".repeat(50);
    const veryLongStreet = "விருதுநகர் பிரதான சாலை ".repeat(40);
    const url = getWhatsAppOrderUrl(veryLongTitle, 500, "long-slug", 10, {
      fullName: "நெடுஞ்செழியன் ".repeat(10),
      doorStreet: veryLongStreet,
      cityArea: "விருதுநகர்",
      districtState: "தமிழ்நாடு",
      pincode: "626001",
    });

    assert.ok(url.startsWith("https://wa.me/"));
    assert.ok(url.length > 500);
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes("• எண்ணிக்கை: 10"));
    assert.ok(decoded.includes("• நூல் தொகை: ₹5000"));
  });
});
