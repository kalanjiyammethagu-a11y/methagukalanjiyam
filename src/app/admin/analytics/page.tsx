"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  PieChart,
  ShoppingBag,
  CreditCard,
  Truck,
  Users,
  Download,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminAnalyticsPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const categoriesData = [
    { nameTa: "வரலாறு & ஆவணங்கள்", nameEn: "National History & Records", share: 44, revenue: 21406, count: 148 },
    { nameTa: "போர்முனை நினைவுகள்", nameEn: "Battlefield Memoirs", share: 28, revenue: 13622, count: 96 },
    { nameTa: "வாழ்க்கை வரலாறு", nameEn: "Biographies & Memorials", share: 18, revenue: 8757, count: 62 },
    { nameTa: "தமிழ் இலக்கியம் & கவிதை", nameEn: "Literature & Poetry", share: 10, revenue: 4865, count: 36 },
  ];

  const regionalData = [
    { regionTa: "தமிழ்நாடு (ST Courier / அஞ்சல்)", regionEn: "Tamil Nadu (ST Courier)", share: 78, orders: 266, fee: "₹60" },
    { regionTa: "பிற இந்திய மாநிலங்கள் (கர்நாடகா, கேரளா)", regionEn: "Other States (KA, KL, MH)", share: 16, orders: 55, fee: "₹100" },
    { regionTa: "வெளிநாட்டுப் புலம்பெயர் தமிழர்கள் (International)", regionEn: "Overseas Diaspora", share: 6, orders: 21, fee: "Postal" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-tamil text-zinc-900">
            {isTa ? "விற்பனை & வாசகர் புள்ளிவிவரங்கள்" : "Sales & Reader Analytics"}
          </h2>
          <p className="text-xs text-zinc-500 font-tamil mt-1">
            {isTa
              ? "நூல் வகைகள், அஞ்சல் புவியியல் பிரிவுகள் மற்றும் வாசகர் கொள்முதல் போக்குகளின் விரிவான ஆய்வு"
              : "In-depth breakdown of book categories, shipping geographies, and conversion metrics"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert(isTa ? "அறிக்கை பதிவிறக்கம் தொடங்குகிறது..." : "Exporting report...")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-black/12 hover:border-[#0A6847] text-zinc-800 text-xs font-bold font-tamil shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Download className="h-4 w-4 text-[#0A6847]" />
          <span>{isTa ? "CSV அறிக்கை பதிவிறக்கம்" : "Export CSV Report"}</span>
        </button>
      </div>

      {/* 3 Metric High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs">
          <div className="text-xs font-bold text-zinc-500 font-tamil mb-1">
            {isTa ? "சராசரி ஆர்டர் மதிப்பு (AOV)" : "Average Order Value (AOV)"}
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">₹354</div>
          <p className="text-[11px] text-emerald-700 font-semibold font-tamil mt-2">
            +₹32 {isTa ? "கடந்த மாதத்தை விட அதிகம்" : "higher than last month"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs">
          <div className="text-xs font-bold text-zinc-500 font-tamil mb-1">
            {isTa ? "புலனம் (WhatsApp) ஆர்டர் விகிதம்" : "WhatsApp Conversion"}
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">92.4%</div>
          <p className="text-[11px] text-zinc-500 font-tamil mt-2">
            {isTa ? "நேரடி WhatsApp உரையாடலில் நிறைவடைகிறது" : "Completed via WhatsApp assistance"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs">
          <div className="text-xs font-bold text-zinc-500 font-tamil mb-1">
            {isTa ? "திரும்பப் பெறப்பட்டவை (Return Rate)" : "Return / RTO Rate"}
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">0.18%</div>
          <p className="text-[11px] text-emerald-700 font-semibold font-tamil mt-2">
            {isTa ? "மிகக் குறைந்த RTO சதவீதம்" : "Negligible return-to-origin"}
          </p>
        </div>
      </div>

      {/* Categories & Geography Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "நூல் பிரிவு வாரியான விற்பனைப் பகிர்வு" : "Revenue by Book Category"}
            </h3>
            <p className="text-xs text-zinc-500 font-tamil">
              {isTa ? "எந்தப் பிரிவு நூல்கள் அதிக வருவாயை ஈட்டுகின்றன?" : "Performance split across catalog genres"}
            </p>
          </div>

          <div className="space-y-4">
            {categoriesData.map((cat) => (
              <div key={cat.nameEn} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800 font-tamil">
                    {isTa ? cat.nameTa : cat.nameEn}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-500">{cat.count} {isTa ? "நூல்கள்" : "orders"}</span>
                    <span className="font-bold text-zinc-900">{formatINR(cat.revenue)} ({cat.share}%)</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.share}%` }}
                    className="h-full bg-gradient-to-r from-[#0A6847] to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Shipping Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "அஞ்சல் பகுதி புவியியல்" : "Shipping Regional Split"}
            </h3>
            <p className="text-xs text-zinc-500 font-tamil">
              {isTa ? "நூல்கள் டெலிவரி செய்யப்படும் பகுதிகள்" : "Destination states & postal coverage"}
            </p>
          </div>

          <div className="space-y-4">
            {regionalData.map((reg) => (
              <div
                key={reg.regionEn}
                className="p-3.5 rounded-xl border border-black/8 bg-zinc-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0A6847]" />
                    <span className="font-bold text-xs text-zinc-900 font-tamil">
                      {isTa ? reg.regionTa : reg.regionEn}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0A6847]">
                    {reg.share}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-tamil">
                  <span>{reg.orders} {isTa ? "ஆர்டர்கள்" : "orders"}</span>
                  <span>{isTa ? "கட்டணம்:" : "Rate:"} {reg.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
