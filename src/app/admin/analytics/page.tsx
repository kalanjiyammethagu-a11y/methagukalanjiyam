"use client";

import * as React from "react";
import { MapPin, Download, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface AnalyticsResponse {
  summary: {
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
    aov: number;
    paidRate: number;
    rtoRate: number;
  };
  categoriesData: Array<{ name: string; share: number; revenue: number; count: number }>;
  regionalData: Array<{ region: string; share: number; orders: number; fee: string }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load live analytics.");
        }
        return res.json();
      })
      .then((json: AnalyticsResponse) => {
        if (active) setData(json);
      })
      .catch((err: any) => {
        if (active) setErrorMsg(err?.message || "Failed to load analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[][] = [
      ["Section", "Label", "Count / Share", "Amount / Value"],
      ["Summary", "Total Orders", String(data.summary.totalOrders), formatINR(data.summary.totalRevenue)],
      ["Summary", "Average Order Value", String(data.summary.activeOrders), formatINR(data.summary.aov)],
      ["Summary", "Paid Order Rate", `${data.summary.paidRate}%`, ""],
      ["Summary", "Returned / RTO Rate", `${data.summary.rtoRate}%`, ""],
      ...data.categoriesData.map((c) => ["Category", c.name, `${c.count} (${c.share}%)`, String(c.revenue)]),
      ...data.regionalData.map((r) => ["Region", r.region, `${r.orders} (${r.share}%)`, r.fee]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kalanjiyam-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Sales &amp; Reader Analytics
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Live breakdown computed directly from Supabase orders, order items, and book categories
          </p>
        </div>

        <button
          type="button"
          disabled={!data || loading}
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#0A6847] disabled:opacity-50 text-gray-800 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Download className="h-4 w-4 text-[#0A6847]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
          Computing live store analytics from database...
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="text-xs font-bold text-gray-500 mb-1">Average Order Value (AOV)</div>
              <div className="text-2xl font-black text-gray-900 font-mono">
                {formatINR(data.summary.aov)}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                Across {data.summary.activeOrders} active order(s)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="text-xs font-bold text-gray-500 mb-1">Paid Order Rate</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {data.summary.paidRate}%
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Out of {data.summary.totalOrders} total order(s)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="text-xs font-bold text-gray-500 mb-1">Return / RTO Rate</div>
              <div className="text-2xl font-black text-gray-900 font-mono">
                {data.summary.rtoRate}%
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Orders marked as returned in database
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-base text-gray-900">Revenue by Book Category</h3>
                <p className="text-xs text-gray-500">Real sales performance by archival catalog genre</p>
              </div>

              {data.categoriesData.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">No active order items yet.</div>
              ) : (
                <div className="space-y-4">
                  {data.categoriesData.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800">{cat.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-gray-500">{cat.count} orders</span>
                          <span className="font-bold text-gray-900">
                            {formatINR(cat.revenue)} ({cat.share}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${cat.share}%` }}
                          className="h-full bg-gradient-to-r from-[#0A6847] to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-base text-gray-900">Shipping Regional Split</h3>
                <p className="text-xs text-gray-500">Real destination states &amp; courier mix</p>
              </div>

              {data.regionalData.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">No shipping orders recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {data.regionalData.map((reg) => (
                    <div
                      key={reg.region}
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#0A6847]" />
                          <span className="font-bold text-xs text-gray-900">{reg.region}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#0A6847]">{reg.share}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{reg.orders} orders</span>
                        <span>Fee: {reg.fee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
