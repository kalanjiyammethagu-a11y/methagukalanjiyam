export const runtime = "edge";

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Truck,
  Printer,
  MessageCircle,
  ArrowRight,
  PackageCheck,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ArchivalWaxSealIcon, PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface OrderDetail {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  tracking_number: string | null;
  courier: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
  shipping_address: {
    full_name?: string;
    phone?: string;
    house_name?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  order_items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    line_total: number;
    cover_url: string | null;
  }>;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!orderNumber) return;

    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Order not found");
        }
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || "Failed to load order receipt");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A6847] mx-auto" />
          <p className="text-sm text-neutral-600 font-tamil">
            {isTa ? "ஆர்டர் விவரங்கள் பெறப்படுகின்றன..." : "Loading order details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-20 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 font-tamil">
          {isTa ? "ஆர்டர் காணப்படவில்லை" : "Order Not Found"}
        </h1>
        <p className="text-xs text-neutral-600 font-tamil">
          {error || (isTa ? "கோரப்பட்ட ஆர்டர் எண் தவறானது அல்லது அகற்றப்பட்டுள்ளது." : "The requested order number could not be found.")}
        </p>
        <Link
          href="/books"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A6847] text-white text-xs font-bold font-tamil"
        >
          {isTa ? "நூல்களை உலாவுக" : "Browse Catalog"}
        </Link>
      </div>
    );
  }

  const isConfirmed = order.status === "confirmed" || order.payment_status === "paid";
  const isShipped = order.status === "shipped";
  const isDelivered = order.status === "delivered";

  return (
    <div className="min-h-screen pb-20 pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          locale={locale}
          items={[
            { label: "கூடை", labelEn: "Cart", href: "/cart" },
            { label: `ஆர்டர் ${order.order_number}`, labelEn: `Order ${order.order_number}` },
          ]}
        />

        {/* Hero Success Badge */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 font-tamil">
                    {order.payment_status === "paid" ? (isTa ? "கட்டணம் செலுத்தப்பட்டது" : "Paid Online") : order.payment_status}
                  </span>
                  <span className="text-xs text-emerald-200/70 font-mono">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold font-tamil tracking-tight">
                  {isTa ? "ஆர்டர் உறுதி செய்யப்பட்டது!" : "Order Confirmed!"}
                </h1>
                <p className="text-xs text-emerald-100/80 font-mono">
                  Order ID: <span className="font-bold text-white">{order.order_number}</span>
                </p>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer min-h-[44px]"
              >
                <Printer className="h-4 w-4" />
                <span>{isTa ? "ரசீதை அச்சிடுக" : "Print Receipt"}</span>
              </button>

              <a
                href={`https://wa.me/918248654946?text=${encodeURIComponent(
                  `வணக்கம் மேதகு களஞ்சியம்,\nஎனது ஆர்டர் எண்: ${order.order_number} குறித்து விசாரிக்க விரும்புகிறேன்.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Postal Tracking Notice (if dispatched) */}
        {order.tracking_number && (
          <GlassPanel className="p-5 sm:p-6 rounded-2xl border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 font-tamil">
                    {isTa ? "பார்சல் தபாலில் அனுப்பப்பட்டுள்ளது (Dispatched)" : "Parcel Dispatched via Courier"}
                  </h3>
                  <p className="text-xs text-neutral-600 font-tamil">
                    {order.courier || "ST Courier / Speed Post"} • AWB:{" "}
                    <span className="font-mono font-bold text-neutral-900">{order.tracking_number}</span>
                  </p>
                </div>
              </div>

              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  <span>{isTa ? "நேரடி டிராக்கிங்" : "Track Parcel"}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </GlassPanel>
        )}

        {/* Bill of Supply / Order Details Box */}
        <div className="bg-white rounded-3xl border border-black/10 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/8 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A6847] font-tamil mb-1">
                <ArchivalWaxSealIcon className="h-4 w-4" />
                <span>அரசு MSME பதிவு: UDYAM-TN-18-0101323</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 font-tamil">
                மேதகு களஞ்சியம் — கொள்முதல் ரசீது (Bill of Supply)
              </h2>
              <p className="text-xs text-neutral-500 font-tamil mt-0.5">
                தமிழ்நாடு, இந்தியா • தொடர்பு: +91 82486 54946
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-500 font-tamil block">நிலை (Status):</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase font-mono">
                {order.status}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50/80 p-4 rounded-2xl border border-black/5 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-neutral-700 font-tamil block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#0A6847]" />
                <span>{isTa ? "அஞ்சல் முகவரி (Delivery Destination):" : "Delivery Address:"}</span>
              </span>
              <p className="font-bold text-neutral-900 font-tamil">{order.shipping_address?.full_name}</p>
              <p className="text-neutral-600 font-tamil">{order.shipping_address?.house_name}</p>
              <p className="text-neutral-600 font-tamil">
                {order.shipping_address?.city}, {order.shipping_address?.state} -{" "}
                <span className="font-mono font-bold text-neutral-900">{order.shipping_address?.pincode}</span>
              </p>
              <p className="text-neutral-600 font-tamil">அலைபேசி: {order.shipping_address?.phone}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="font-bold text-neutral-700 font-tamil block">
                {isTa ? "பணப் பரிவர்த்தனை விவரம்:" : "Payment Summary:"}
              </span>
              <p className="text-neutral-600 font-tamil">முறை: Razorpay Online (UPI / Card / Netbanking)</p>
              <p className="text-neutral-600 font-tamil">
                தேதி: {new Date(order.created_at).toLocaleString()}
              </p>
              <p className="text-neutral-600 font-tamil">
                வரி நிலை: HSN 4901 (புத்தகங்கள் - 0% NIL GST)
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-neutral-500 font-tamil">
                  <th className="py-2.5 font-bold">நூல் தலைப்பு (Publication)</th>
                  <th className="py-2.5 font-bold text-center">எண்ணிக்கை</th>
                  <th className="py-2.5 font-bold text-right">விலை</th>
                  <th className="py-2.5 font-bold text-right">மொத்தம்</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {order.order_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-neutral-900 font-tamil">
                      {item.title}
                    </td>
                    <td className="py-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">{formatINR(item.price)}</td>
                    <td className="py-3 text-right font-bold font-mono text-neutral-900">
                      {formatINR(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-black/10">
                  <td colSpan={3} className="pt-3 text-right text-neutral-600 font-tamil">
                    {isTa ? "நூல்கள் துணை மொத்தம் (Subtotal):" : "Subtotal:"}
                  </td>
                  <td className="pt-3 text-right font-mono font-medium">
                    {formatINR(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1 text-right text-neutral-600 font-tamil">
                    {isTa ? "அஞ்சல் & பொட்டலக் கட்டணம் (Shipping & Postal):" : "Postal Shipping:"}
                  </td>
                  <td className="py-1 text-right font-mono font-medium">
                    {formatINR(order.shipping_fee)}
                  </td>
                </tr>
                <tr className="border-t border-black/15 text-sm font-bold text-neutral-900">
                  <td colSpan={3} className="pt-3 text-right font-tamil text-[#0A6847]">
                    {isTa ? "மொத்தத் தொகை (Total Paid):" : "Grand Total:"}
                  </td>
                  <td className="pt-3 text-right font-mono text-[#0A6847] text-base">
                    {formatINR(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-tamil">
            <p>
              நன்றி! உங்கள் ஆதரவு தமிழீழ வரலாற்று ஆவணங்களை தலைமுறை கடந்து பாதுகாக்க உதவுகிறது.
            </p>
            <Link
              href="/books"
              className="text-[#0A6847] font-bold hover:underline inline-flex items-center gap-1 print:hidden"
            >
              <span>{isTa ? "மேலும் நூல்களை உலாவுக" : "Continue Browsing"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

