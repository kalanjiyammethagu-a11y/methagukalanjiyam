"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Truck,
  Printer,
  MessageCircle,
  ArrowRight,
  MapPin,
  ExternalLink,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { ArchivalWaxSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { localized } from "@/lib/i18n";
import {
  SHIPMENT_STATUS_LABELS,
  ST_COURIER_TRACKING_URL,
  normalizeShipmentStatus,
  resolveCourierTrackingUrl,
} from "@/lib/tracking";

interface ShipmentEventView {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

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
  is_authorized?: boolean;
  courier_name?: string | null;
  courier: string | null;
  tracking_id?: string | null;
  tracking_number: string | null;
  shipment_status?: string | null;
  tracking_url: string | null;
  shipped_at?: string | null;
  estimated_delivery_date?: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  customer_note_en?: string | null;
  customer_note_ta?: string | null;
  shipment_events?: ShipmentEventView[];
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
  const [phoneVerifyInput, setPhoneVerifyInput] = React.useState("");
  const [verifyingPhone, setVerifyingPhone] = React.useState(false);
  const [copiedTracking, setCopiedTracking] = React.useState(false);

  const loadOrder = React.useCallback(
    async (phoneSuffix?: string) => {
      if (!orderNumber) return;
      if (phoneSuffix) setVerifyingPhone(true);
      else setLoading(true);
      setError(null);
      try {
        const qs = phoneSuffix ? `?phone=${encodeURIComponent(phoneSuffix)}` : "";
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}${qs}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Order not found");
        }
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || "Failed to load order receipt");
      } finally {
        setLoading(false);
        setVerifyingPhone(false);
      }
    },
    [orderNumber]
  );

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleCopyTracking = async (tid: string) => {
    try {
      await navigator.clipboard.writeText(tid);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } catch {}
  };

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
        <h1 className="text-xl font-bold text-neutral-900 dark:text-zinc-100 font-tamil">
          {isTa ? "ஆர்டர் காணப்படவில்லை" : "Order Not Found"}
        </h1>
        <p className="text-xs text-neutral-600 dark:text-zinc-300 font-tamil">
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all shadow-md min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Customer Shipment & Courier Tracking Panel */}
        {(() => {
          const activeTrackingId = order.tracking_id || order.tracking_number;
          const activeCourier = order.courier_name || order.courier || "ST Courier";
          const shipmentStatus = normalizeShipmentStatus(
            order.shipment_status,
            order.status,
            activeTrackingId
          );
          const statusLabel = SHIPMENT_STATUS_LABELS[shipmentStatus][locale];
          const externalTrackUrl =
            order.tracking_url || resolveCourierTrackingUrl(activeCourier) || ST_COURIER_TRACKING_URL;
          const localizedNote = localized(
            {
              customer_note_en: order.customer_note_en,
              customer_note_ta: order.customer_note_ta,
            },
            "customer_note",
            locale
          );
          const events = order.shipment_events || [];

          if (order.is_authorized === false) {
            return (
              <GlassPanel className="p-5 sm:p-6 rounded-2xl border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/60 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-zinc-100 font-tamil">
                      {isTa
                        ? "பார்சல் கண்காணிப்பு மற்றும் முகவரியைக் காண உறுதிப்படுத்தவும்"
                        : "Verify Your Phone Digits to View Courier Tracking & Address"}
                    </h3>
                    <p className="text-xs text-neutral-700 dark:text-zinc-200 font-tamil leading-relaxed">
                      {isTa
                        ? `ஆர்டர் நிலை: ${statusLabel}. முழு கண்காணிப்பு எண் மற்றும் நிகழ்வுகளைக் காண உங்கள் தொலைபேசி எண்ணின் கடைசி 4 இலக்கங்களை உள்ளிடவும்.`
                        : `Current shipment status: ${statusLabel}. Enter the last 4 digits of your order phone number (or sign in) to unlock tracking details.`}
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (phoneVerifyInput.trim().length >= 4) {
                      loadOrder(phoneVerifyInput.trim());
                    }
                  }}
                  className="flex flex-wrap gap-2"
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneVerifyInput}
                    onChange={(e) => setPhoneVerifyInput(e.target.value)}
                    placeholder={isTa ? "கடைசி 4 இலக்கங்கள் (எ.கா. 4321)" : "Last 4 digits of phone"}
                    className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-xs font-mono min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={verifyingPhone || phoneVerifyInput.trim().length < 4}
                    className="px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085237] disabled:opacity-60 text-white text-xs font-bold min-h-[44px] cursor-pointer"
                  >
                    {verifyingPhone
                      ? isTa
                        ? "சரிபார்க்கிறது..."
                        : "Verifying..."
                      : isTa
                        ? "தகவல்களைத் திற"
                        : "Unlock Tracking"}
                  </button>
                </form>
              </GlassPanel>
            );
          }

          return (
            <GlassPanel className="p-5 sm:p-6 rounded-2xl border-emerald-500/30 bg-emerald-50/75 dark:bg-emerald-950/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0A6847] text-white flex items-center justify-center shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-zinc-100 font-tamil leading-snug">
                        {activeCourier}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold font-tamil">
                        {statusLabel}
                      </span>
                    </div>

                    {activeTrackingId ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-zinc-200">
                        <span>{isTa ? "கண்காணிப்பு எண் (Tracking ID):" : "Tracking ID:"}</span>
                        <span className="font-mono font-bold text-neutral-950 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                          {activeTrackingId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(activeTrackingId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-[#111111] dark:text-zinc-100 text-[11px] font-semibold cursor-pointer min-h-[32px]"
                        >
                          {copiedTracking ? (
                            <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedTracking ? (isTa ? "நகலெடுக்கப்பட்டது" : "Copied") : isTa ? "நகலெடு" : "Copy"}</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-700 dark:text-zinc-300 font-tamil">
                        {isTa
                          ? "உங்கள் பார்சல் தயார்படுத்தப்படுகிறது; அனுப்பப்பட்டதும் கண்காணிப்பு எண் இங்கு வெளியிடப்படும்."
                          : "Your parcel is being prepared; your ST Courier tracking ID will appear here once dispatched."}
                      </p>
                    )}

                    {(order.shipped_at || order.dispatched_at || order.estimated_delivery_date) && (
                      <div className="flex flex-wrap gap-4 text-[11px] text-neutral-700 dark:text-zinc-300 font-mono pt-0.5">
                        {(order.shipped_at || order.dispatched_at) && (
                          <span>
                            {isTa ? "அனுப்பப்பட்ட தேதி:" : "Shipped:"}{" "}
                            {new Date(order.shipped_at || order.dispatched_at!).toLocaleDateString()}
                          </span>
                        )}
                        {order.estimated_delivery_date && (
                          <span>
                            {isTa ? "எதிர்பார்க்கப்படும் வருகை:" : "Est. Delivery:"}{" "}
                            {order.estimated_delivery_date}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={externalTrackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all min-h-[44px] shrink-0"
                >
                  <span>{isTa ? `${activeCourier} இணையத்தில் கண்காணிக்க` : `Track on ${activeCourier}`}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {localizedNote && (
                <div className="p-3 rounded-xl bg-white/95 dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-xs text-neutral-800 dark:text-zinc-200 font-tamil leading-relaxed">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 mr-1.5">
                    {isTa ? "குறிப்பு:" : "Dispatch Note:"}
                  </span>
                  {localizedNote}
                </div>
              )}

              {events.length > 0 && (
                <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-zinc-100 flex items-center gap-1.5 font-tamil">
                    <Clock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>{isTa ? "பார்சல் பயண நிலை வரலாறு" : "Shipment Timeline"}</span>
                  </h4>
                  <ol className="space-y-2 border-l-2 border-emerald-300 dark:border-emerald-700 ml-2 pl-4">
                    {events.map((ev) => {
                      const st = normalizeShipmentStatus(ev.status);
                      return (
                        <li key={ev.id} className="relative text-xs">
                          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-50 dark:ring-emerald-950" />
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-bold text-neutral-900 dark:text-zinc-100 font-tamil">
                              {SHIPMENT_STATUS_LABELS[st][locale]}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-600 dark:text-zinc-400">
                              {new Date(ev.created_at).toLocaleString()}
                            </span>
                          </div>
                          {ev.note && (
                            <p className="text-neutral-700 dark:text-zinc-300 font-tamil mt-0.5 leading-relaxed">
                              {ev.note}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </GlassPanel>
          );
        })()}

        {/* Bill of Supply / Order Details Box */}
        <div className="bg-white dark:bg-[#1F1F23] rounded-3xl border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/8 dark:border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A6847] dark:text-emerald-400 font-tamil mb-1">
                <ArchivalWaxSealIcon className="h-4 w-4" />
                <span>அரசு MSME பதிவு: UDYAM-TN-18-0101323</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 font-tamil">
                மேதகு களஞ்சியம் — கொள்முதல் ரசீது (Bill of Supply)
              </h2>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 font-tamil mt-0.5">
                தமிழ்நாடு, இந்தியா • தொடர்பு: +91 82486 54946
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-600 dark:text-zinc-400 font-tamil block">நிலை (Status):</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 uppercase font-mono">
                {order.status}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50/80 dark:bg-zinc-900/80 p-4 rounded-2xl border border-black/5 dark:border-white/10 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-neutral-800 dark:text-zinc-200 font-tamil block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
                <span>{isTa ? "அஞ்சல் முகவரி (Delivery Destination):" : "Delivery Address:"}</span>
              </span>
              <p className="font-bold text-neutral-900 dark:text-zinc-100 font-tamil">{order.shipping_address?.full_name}</p>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">{order.shipping_address?.house_name}</p>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">
                {order.shipping_address?.city}, {order.shipping_address?.state} -{" "}
                <span className="font-mono font-bold text-neutral-900 dark:text-zinc-100">{order.shipping_address?.pincode}</span>
              </p>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">அலைபேசி: {order.shipping_address?.phone}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="font-bold text-neutral-800 dark:text-zinc-200 font-tamil block">
                {isTa ? "பணப் பரிவர்த்தனை விவரம்:" : "Payment Summary:"}
              </span>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">முறை: Razorpay Online (UPI / Card / Netbanking)</p>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">
                தேதி: {new Date(order.created_at).toLocaleString()}
              </p>
              <p className="text-neutral-700 dark:text-zinc-300 font-tamil">
                வரி நிலை: HSN 4901 (புத்தகங்கள் - 0% NIL GST)
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-neutral-600 dark:text-zinc-400 font-tamil">
                  <th className="py-2.5 font-bold">நூல் தலைப்பு (Publication)</th>
                  <th className="py-2.5 font-bold text-center">எண்ணிக்கை</th>
                  <th className="py-2.5 font-bold text-right">விலை</th>
                  <th className="py-2.5 font-bold text-right">மொத்தம்</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {order.order_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-neutral-900 dark:text-zinc-100 font-tamil">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.cover_url || "/images/books/book-placeholder.webp"}
                          alt={item.title}
                          className="h-12 w-9 rounded-md object-cover border border-black/10 dark:border-white/15 bg-stone-100 dark:bg-zinc-800 shrink-0"
                        />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono text-neutral-900 dark:text-zinc-100">{item.quantity}</td>
                    <td className="py-3 text-right font-mono text-neutral-900 dark:text-zinc-100">{formatINR(item.price)}</td>
                    <td className="py-3 text-right font-bold font-mono text-neutral-900 dark:text-zinc-100">
                      {formatINR(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-black/10 dark:border-white/10">
                  <td colSpan={3} className="pt-3 text-right text-neutral-700 dark:text-zinc-300 font-tamil">
                    {isTa ? "நூல்கள் துணை மொத்தம் (Subtotal):" : "Subtotal:"}
                  </td>
                  <td className="pt-3 text-right font-mono font-medium text-neutral-900 dark:text-zinc-100">
                    {formatINR(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1 text-right text-neutral-700 dark:text-zinc-300 font-tamil">
                    {isTa ? "அஞ்சல் & பொட்டலக் கட்டணம் (Shipping & Postal):" : "Postal Shipping:"}
                  </td>
                  <td className="py-1 text-right font-mono font-medium text-neutral-900 dark:text-zinc-100">
                    {formatINR(order.shipping_fee)}
                  </td>
                </tr>
                <tr className="border-t border-black/15 dark:border-white/15 text-sm font-bold text-neutral-900 dark:text-zinc-100">
                  <td colSpan={3} className="pt-3 text-right font-tamil text-[#0A6847] dark:text-emerald-400">
                    {isTa ? "மொத்தத் தொகை (Total Paid):" : "Grand Total:"}
                  </td>
                  <td className="pt-3 text-right font-mono text-[#0A6847] dark:text-emerald-400 text-base">
                    {formatINR(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-600 dark:text-zinc-400 font-tamil">
            <p>
              நன்றி! உங்கள் ஆதரவு தமிழீழ வரலாற்று ஆவணங்களை தலைமுறை கடந்து பாதுகாக்க உதவுகிறது.
            </p>
            <Link
              href="/books"
              className="text-[#0A6847] dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 print:hidden"
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

