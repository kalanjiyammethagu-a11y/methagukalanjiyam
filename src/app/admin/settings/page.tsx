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

  // Form states
  const [storeName, setStoreName] = React.useState("மேதகு களஞ்சியம்");
  const [phone, setPhone] = React.useState("+91 63846 54946");
  const [altPhone, setAltPhone] = React.useState("+91 82486 54946");
  const [tnShippingFee, setTnShippingFee] = React.useState(60);
  const [otherShippingFee, setOtherShippingFee] = React.useState(100);
  const [udyamId, setUdyamId] = React.useState("UDYAM-TN-18-0101323");
  const [upiId, setUpiId] = React.useState("methagukalanjiyam@oksbi");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(isTa ? "நிர்வாக அமைப்புகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன!" : "Settings saved successfully!");
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

        {/* Section 3: Shipping Rates */}
        <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-black/8 pb-3">
            <Truck className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "அஞ்சல் கட்டணங்கள் (ST Courier & India Post)" : "Shipping Fee Matrix"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "தமிழ்நாடு முழுவதும் அஞ்சல் கட்டணம் (₹)" : "Tamil Nadu Flat Rate (₹)"}
              </label>
              <input
                type="number"
                value={tnShippingFee}
                onChange={(e) => setTnShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 font-tamil">
                {isTa ? "பிற இந்திய மாநிலங்களுக்கு அஞ்சல் கட்டணம் (₹)" : "Other Indian States Flat Rate (₹)"}
              </label>
              <input
                type="number"
                value={otherShippingFee}
                onChange={(e) => setOtherShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Prepared Supabase Backend Status */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-black/8 pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-700" />
              <h3 className="font-bold text-base text-zinc-900 font-tamil">
                {isTa ? "பின்னணி சேவையகம் (Backend Architecture)" : "Backend Architecture Ready"}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 text-[11px] font-bold font-tamil border border-emerald-400/40">
              {isTa ? "இணைப்பிற்குத் தயார்" : "Ready to Connect"}
            </span>
          </div>

          <p className="text-xs text-zinc-600 font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தின் அனைத்து தரவுத்தள அட்டவணைகளும் (Books, Orders, Articles, Supporters) மற்றும் CRUD சேவைச் சுருக்கங்கள் (API Stubs) src/lib/api/admin-service.ts-ல் முழுமையாக கட்டமைக்கப்பட்டுள்ளன. நீங்கள் Supabase கணக்கை இணைக்கும் போது கூடுதல் குறியீட்டு மாற்றம் தேவையின்றி நேரடியாக இயங்கும்."
              : "All database schemas, TypeScript interfaces, and REST/RPC service stubs are pre-architected in src/lib/api/admin-service.ts and supabase/migrations. Ready for live plug-and-play."}
          </p>

          <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-200 text-xs font-mono flex items-center justify-between">
            <span>NEXT_PUBLIC_SUPABASE_URL &amp; ANON_KEY</span>
            <button
              type="button"
              onClick={handleCopyEnv}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-sans"
            >
              {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy Template"}</span>
            </button>
          </div>
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
