"use client";

import * as React from "react";
import Link from "next/link";
import {
  Save,
  CheckCircle2,
  Phone,
  Truck,
  ShieldCheck,
  Server,
  ArrowUpRight,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form states
  const [storeName, setStoreName] = React.useState("Methagu Kalanjiyam");
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
        showToast("Settings saved successfully to database!");
      } else {
        showToast("Error updating settings in database");
      }
    } catch {
      showToast("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Store & Platform Settings
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Store identity, WhatsApp routing numbers, shipping rate controls, and backend infrastructure status
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Identity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-gray-900">
              Store Profile & Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Udyam MSME Registration
              </label>
              <input
                type="text"
                value={udyamId}
                onChange={(e) => setUdyamId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Hotline & Ordering */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-gray-900">
              WhatsApp Dispatch & Helpline
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Primary Ordering Phone (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
              <span className="text-[10px] text-gray-400">
                Linked to all public store order buttons and alerts
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Secondary Support Line
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Shipping Rates & Deliverable Pincodes Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Truck className="h-5 w-5 text-[#0A6847]" />
            <h3 className="font-bold text-base text-gray-900">
              Shipping Charges & Deliverable Pincodes Matrix
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Tamil Nadu Postal Rate (₹)
              </label>
              <input
                type="number"
                value={tnShippingFee}
                onChange={(e) => setTnShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
              <span className="text-[10px] text-gray-400">ST Courier / Speed Post (2-3 days)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Rest of India Rate (₹)
              </label>
              <input
                type="number"
                value={otherShippingFee}
                onChange={(e) => setOtherShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
              <span className="text-[10px] text-gray-400">India Post Speed Post (4-6 days)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
              />
              <span className="text-[10px] text-gray-400">Orders above this amount get free shipping</span>
            </div>
          </div>

          {/* Deliverable Pincodes Selector */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-700 block">
              Deliverable Pincodes Coverage
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setPincodeMode("all_india")}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  pincodeMode === "all_india"
                    ? "border-[#0A6847] bg-emerald-50/50 text-gray-900 ring-1 ring-[#0A6847]"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
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
                  <span className="font-bold block">All-India Speed Post</span>
                  <span className="text-[11px] text-gray-500">
                    Direct India Post Speed Post delivery to all 19,100+ postal PIN codes
                  </span>
                </div>
              </label>

              <label
                onClick={() => setPincodeMode("south_india")}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  pincodeMode === "south_india"
                    ? "border-[#0A6847] bg-emerald-50/50 text-gray-900 ring-1 ring-[#0A6847]"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
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
                  <span className="font-bold block">South India Hubs (ST Courier)</span>
                  <span className="text-[11px] text-gray-500">
                    Tamil Nadu, Puducherry, Kerala, Karnataka, Andhra & Telangana
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold text-gray-600 block mb-1">
                Dispatch & SLA Policy Note
              </label>
              <textarea
                rows={2}
                value={pincodeNote}
                onChange={(e) => setPincodeNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Live Connected Database Status */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 bg-emerald-50/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-700" />
              <h3 className="font-bold text-base text-gray-900">
                Live Database Connected
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold font-mono">
              Live & Synchronized
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            All settings are directly bound to Supabase PostgreSQL (public.site_settings). Updates saved here immediately reflect on live cart calculations, postal fee slabs, and customer receipts.
          </p>
        </div>

        {/* Section 5: ERPNext Enterprise Synchronization */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#0A6847]" />
              <h3 className="font-bold text-base text-gray-900">
                ERPNext & Frappe Synchronization
              </h3>
            </div>
            <Link
              href="/admin/erp"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Manage ERP Sync</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Direct REST integration configured for <code className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">https://erp.methagukalanjiyam.in</code>. Automatically mirrors customer profiles, sales invoices, stock levels, and order dispatches with zero-loss outbox queueing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[11px] text-gray-400 font-medium">ERP Host</div>
              <div className="font-mono font-bold text-gray-900 mt-0.5 truncate">erp.methagukalanjiyam.in</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[11px] text-gray-400 font-medium">API Key</div>
              <div className="font-mono font-bold text-gray-900 mt-0.5">251d72274f50663</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[11px] text-gray-400 font-medium">Outbox Mode</div>
              <div className="font-bold text-emerald-700 mt-0.5">Offline-Resilient Buffer</div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Platform Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
