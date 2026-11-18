"use client";

import * as React from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Database,
  Phone,
  Truck,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Server,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminSettingsPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Form states
  const [storeName, setStoreName] = React.useState("மேதகு களஞ்சியம்");
  const [phone, setPhone] = React.useState("+91 82486 54946");
  const [altPhone, setAltPhone] = React.useState("+91 63846 54946");
  const [tnShippingFee, setTnShippingFee] = React.useState(60);
  const [otherShippingFee, setOtherShippingFee] = React.useState(100);
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState(1000);
  const [udyamId, setUdyamId] = React.useState("UDYAM-TN-18-0101323");
  const [upiId, setUpiId] = React.useState("methagukalanjiyam@oksbi");
  const [pincodeMode, setPincodeMode] = React.useState("all_india");
  const [pincodeNote, setPincodeNote] = React.useState(
    "Speed Post (India Post) provides pan-India delivery to all 19,100+ postal PIN codes across all 28 states & 8 UTs. ST Courier covers Tamil Nadu, Puducherry and South India."
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch live settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          const g = data.settings?.general || {};
          const s = data.settings?.shipping || {};

          if (g.site_name) setStoreName(g.site_name);
          if (g.contact_phone) setPhone(g.contact_phone);
          if (g.alt_phone) setAltPhone(g.alt_phone);
          if (g.udyam_id) setUdyamId(g.udyam_id);
          if (g.upi_id) setUpiId(g.upi_id);

          if (s.standard_shipping_fee !== undefined) setTnShippingFee(Number(s.standard_shipping_fee));
          if (s.other_india_shipping_fee !== undefined) setOtherShippingFee(Number(s.other_india_shipping_fee));
          if (s.free_shipping_threshold !== undefined) setFreeShippingThreshold(Number(s.free_shipping_threshold));
          if (s.deliverable_pincodes_mode) setPincodeMode(s.deliverable_pincodes_mode);
          if (s.deliverable_pincodes_note) setPincodeNote(s.deliverable_pincodes_note);
        }
      } catch (err) {
        console.warn("Could not load live settings, using defaults:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: {
            site_name: storeName,
            contact_phone: phone,
            alt_phone: altPhone,
            whatsapp_number: phone.replace(/\D/g, ""),
            udyam_id: udyamId,
            upi_id: upiId,
            support_email: "contact@methagukalanjiyam.in",
          },
          shipping: {
            standard_shipping_fee: Number(tnShippingFee),
            other_india_shipping_fee: Number(otherShippingFee),
            free_shipping_threshold: Number(freeShippingThreshold),
            default_courier: "st_courier",
            deliverable_pincodes_mode: pincodeMode,
            deliverable_pincodes_note: pincodeNote,
          },
        }),
      });

      if (res.ok) {
        showToast(
          isTa
            ? "நிர்வாக அமைப்புகள் வெற்றிகரமாக தரவுத்தளத்தில் சேமிக்கப்பட்டன!"
            : "Settings saved successfully to database!"
        );
      } else {
        showToast("Error updating settings in database");
      }
    } catch {
      showToast("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-tamil">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-tamil text-zinc-900">
          {isTa ? "களஞ்சிய நிர்வாக அமைப்புகள்" : "Store & Platform Settings"}
        </h2>
        <p className="text-xs text-zinc-500 font-tamil mt-1">
          {isTa
            ? "நிறுவன விவரங்கள், புலனம் (WhatsApp) தொடர்பு எண்கள், அஞ்சல் கட்டணங்கள் மற்றும் பின்னணி சேவையக அமைப்புகள்"
            : "Store identity, WhatsApp routing numbers, shipping rate controls, and backend infrastructure status"}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Identity */}
        <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-black/8 pb-3">
            <ShieldCheck className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "நிறுவன அடையாளம் & பதிவு விவரங்கள்" : "Store Profile & Identity"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "களஞ்சியத்தின் பெயர்" : "Store Name"}
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-tamil min-h-[40px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "மத்திய அரசு தொழில் பதிவு எண் (Udyam)" : "Udyam MSME Registration"}
              </label>
              <input
                type="text"
                value={udyamId}
                onChange={(e) => setUdyamId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Hotline & Ordering */}
        <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-black/8 pb-3">
            <Phone className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "புலனம் (WhatsApp) உதவி & ஆர்டர் வழியமைப்பு" : "WhatsApp Dispatch & Helpline"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "முதன்மை WhatsApp ஆர்டர் எண்" : "Primary Ordering Phone"}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
              <span className="text-[10px] text-zinc-400 font-tamil">
                {isTa ? "தளத்தின் அனைத்து வாங்கு பொத்தான்களிலும் இந்த எண் பயன்படுத்தப்படும்" : "Linked to all public order buttons"}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "துணை தொடர்பு / உதவி எண்" : "Secondary Support Line"}
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Shipping Rates & Deliverable Pincodes Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-black/8 pb-3">
            <Truck className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "அஞ்சல் கட்டணங்கள் & டெலிவரி செய்யப்படும் பின்கோடுகள்" : "Shipping Charges & Deliverable Pincodes Matrix"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "தமிழ்நாடு அஞ்சல் கட்டணம் (₹)" : "Tamil Nadu Postal Rate (₹)"}
              </label>
              <input
                type="number"
                value={tnShippingFee}
                onChange={(e) => setTnShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
              <span className="text-[10px] text-zinc-400 font-tamil">ST Courier / Speed Post (2-3 days)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "பிற மாநிலங்கள் கட்டணம் (₹)" : "Rest of India Rate (₹)"}
              </label>
              <input
                type="number"
                value={otherShippingFee}
                onChange={(e) => setOtherShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
              <span className="text-[10px] text-zinc-400 font-tamil">India Post Speed Post (4-6 days)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "இலவச அஞ்சல் வரம்பு (₹)" : "Free Shipping Threshold (₹)"}
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
              <span className="text-[10px] text-zinc-400 font-tamil">Orders above this amount get free shipping</span>
            </div>
          </div>

          {/* Deliverable Pincodes Selector */}
          <div className="space-y-2 pt-2 border-t border-black/5">
            <label className="text-xs font-bold text-zinc-700 font-tamil block">
              {isTa ? "டெலிவரி செய்யப்படும் பின்கோடு வரம்பு (Deliverable Coverage)" : "Deliverable Pincodes Coverage"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setPincodeMode("all_india")}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  pincodeMode === "all_india"
                    ? "border-[#0A6847] bg-[#0A6847]/5 text-neutral-900 ring-1 ring-[#0A6847]"
                    : "border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="pincodeMode"
                  checked={pincodeMode === "all_india"}
                  onChange={() => setPincodeMode("all_india")}
                  className="mt-0.5 text-[#0A6847]"
                />
                <div>
                  <span className="font-bold block font-tamil">அனைத்து இந்திய பின்கோடுகள் (All-India Speed Post)</span>
                  <span className="text-[11px] text-neutral-500 font-tamil">
                    இந்தியாவின் 19,100+ பின்கோடுகளுக்கும் India Post நேரடி டெலிவரி
                  </span>
                </div>
              </label>

              <label
                onClick={() => setPincodeMode("south_india")}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  pincodeMode === "south_india"
                    ? "border-[#0A6847] bg-[#0A6847]/5 text-neutral-900 ring-1 ring-[#0A6847]"
                    : "border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="pincodeMode"
                  checked={pincodeMode === "south_india"}
                  onChange={() => setPincodeMode("south_india")}
                  className="mt-0.5 text-[#0A6847]"
                />
                <div>
                  <span className="font-bold block font-tamil">தென்னிந்தியா மட்டும் (ST Courier Hubs)</span>
                  <span className="text-[11px] text-neutral-500 font-tamil">
                    தமிழ்நாடு, புதுச்சேரி, கேரளா, கர்நாடகா, ஆந்திரா & தெலங்கானா
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold text-zinc-600 font-tamil block mb-1">
                {isTa ? "பார்சல் கண்காணிப்பு & வாடிக்கையாளர் குறிப்பு" : "Dispatch & SLA Policy Note"}
              </label>
              <textarea
                rows={2}
                value={pincodeNote}
                onChange={(e) => setPincodeNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-tamil resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Live Connected Database Status */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-300 bg-emerald-50/30 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-700" />
              <h3 className="font-bold text-base text-zinc-900 font-tamil">
                {isTa ? "நேரடி தரவுத்தள இணைப்பு (Supabase Postgres 17)" : "Live Database Connected"}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold font-mono">
              Live &amp; Synchronized
            </span>
          </div>

          <p className="text-xs text-zinc-600 font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தின் அனைத்து அமைப்புகளும் Supabase பொது தரவுத்தள அட்டவணையுடன் (public.site_settings) நேரடியாக இணைக்கப்பட்டுள்ளன. இங்கு நீங்கள் மாற்றும் கட்டணங்கள் மற்றும் தொலைபேசி எண்கள் தளத்தின் செக் அவுட் மற்றும் வாங்கு பொத்தான்களில் உடனடி விளைவை ஏற்படுத்தும்."
              : "All settings are directly bound to Supabase PostgreSQL (public.site_settings). Updates here immediately reflect on live cart calculations, postal fee slabs, and customer receipts."}
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold font-tamil shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{isTa ? "அமைப்புகளைச் சேமிக்க" : "Save Platform Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
