"use client";

import * as React from "react";
import {
  MapPin,
  Download,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const categoriesData = [
    { name: "National History & Records", share: 44, revenue: 21406, count: 148 },
    { name: "Battlefield Memoirs", share: 28, revenue: 13622, count: 96 },
    { name: "Biographies & Memorials", share: 18, revenue: 8757, count: 62 },
    { name: "Literature & Poetry", share: 10, revenue: 4865, count: 36 },
  ];

  const regionalData = [
    { region: "Tamil Nadu (ST Courier)", share: 78, orders: 266, fee: "₹60" },
    { region: "Other States (KA, KL, MH, DL)", share: 16, orders: 55, fee: "₹100" },
    { region: "Overseas Diaspora (Postal Air)", share: 6, orders: 21, fee: "Postal" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Sales & Reader Analytics
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            In-depth breakdown of book categories, shipping geographies, and conversion metrics
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Exporting report...")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#0A6847] text-gray-800 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Download className="h-4 w-4 text-[#0A6847]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* 3 Metric High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 mb-1">
            Average Order Value (AOV)
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">₹354</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">
            +₹32 higher than last month
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 mb-1">
            WhatsApp Conversion Rate
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">92.4%</div>
          <p className="text-[11px] text-gray-500 mt-2">
            Completed via direct customer assistance
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 mb-1">
            Return / RTO Rate
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">0.18%</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">
            Negligible return-to-origin across all courier routes
          </p>
        </div>
      </div>

      {/* Categories & Geography Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-gray-900">
              Revenue by Book Category
            </h3>
            <p className="text-xs text-gray-500">
              Performance split across archival catalog genres
            </p>
          </div>

          <div className="space-y-4">
            {categoriesData.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-gray-500">{cat.count} orders</span>
                    <span className="font-bold text-gray-900">{formatINR(cat.revenue)} ({cat.share}%)</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
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
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-gray-900">
              Shipping Regional Split
            </h3>
            <p className="text-xs text-gray-500">
              Destination states & postal coverage breakdown
            </p>
          </div>

          <div className="space-y-4">
            {regionalData.map((reg) => (
              <div
                key={reg.region}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0A6847]" />
                    <span className="font-bold text-xs text-gray-900">
                      {reg.region}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0A6847]">
                    {reg.share}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{reg.orders} orders</span>
                  <span>Fee: {reg.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
