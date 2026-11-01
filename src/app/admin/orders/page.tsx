"use client";

import * as React from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { mockOrders } from "@/data/admin-mock";
import type { AdminOrder, OrderStatus } from "@/types/admin";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminOrdersPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [orders, setOrders] = React.useState<AdminOrder[]>(mockOrders);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Selected order modal / drawer
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrder | null>(null);
  const [trackingInput, setTrackingInput] = React.useState("");

  // Lock body scroll and dismiss on Escape
  React.useEffect(() => {
    if (selectedOrder) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedOrder(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(isTa ? `ஆர்டர் நிலை மாற்றப்பட்டது: ${newStatus}` : `Order status updated to ${newStatus}`);
  };

  const handleSaveTracking = (orderId: string) => {
    if (!trackingInput.trim()) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              trackingNumber: trackingInput,
              courierPartner: "ST Courier",
              status: o.status === "pending" || o.status === "confirmed" ? "shipped" : o.status,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              trackingNumber: trackingInput,
              courierPartner: "ST Courier",
              status: "shipped",
            }
          : null
      );
    }
    showToast(isTa ? `அஞ்சல் கண்காணிப்பு எண் சேர்க்கப்பட்டது: ${trackingInput}` : `Tracking ID saved: ${trackingInput}`);
    setTrackingInput("");
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.customerCity.toLowerCase().includes(q);

    const matchesTab = activeTab === "all" || o.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-400/30 text-[11px] font-bold font-tamil">
            <Clock className="h-3 w-3 text-amber-700" />
            {isTa ? "நிலுவையில்" : "Pending"}
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-900 border border-blue-400/30 text-[11px] font-bold font-tamil">
            <CheckCircle2 className="h-3 w-3 text-blue-700" />
            {isTa ? "உறுதியானது" : "Confirmed"}
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-900 border border-purple-400/30 text-[11px] font-bold font-tamil">
            <Truck className="h-3 w-3 text-purple-700" />
            {isTa ? "அனுப்பப்பட்டது" : "Shipped"}
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-900 border border-emerald-400/30 text-[11px] font-bold font-tamil">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            {isTa ? "டெலிவரி ஆனது" : "Delivered"}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-900 border border-rose-400/30 text-[11px] font-bold font-tamil">
            <XCircle className="h-3 w-3 text-rose-700" />
            {isTa ? "ரத்து" : "Cancelled"}
          </span>
        );
    }
  };

  const tabs = [
    { id: "all", labelTa: "அனைத்தும்", labelEn: "All", count: orders.length },
    { id: "pending", labelTa: "நிலுவை", labelEn: "Pending", count: orders.filter((o) => o.status === "pending").length },
    { id: "confirmed", labelTa: "உறுதியானது", labelEn: "Confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { id: "shipped", labelTa: "அனுப்பப்பட்டது", labelEn: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { id: "delivered", labelTa: "டெலிவரி", labelEn: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
  ];

  return (
    <div className="space-y-6">
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
          {isTa ? "ஆர்டர்கள் மேலாண்மை" : "Orders Management"}
        </h2>
        <p className="text-xs text-zinc-500 font-tamil mt-1">
          {isTa
            ? "வாசகர் ஆர்டர்களின் விவரங்கள், அஞ்சல் கண்காணிப்பு எண் பதிவு மற்றும் WhatsApp நேரடி தொடர்பு"
            : "Review customer book orders, update postal dispatch tracking numbers, and chat via WhatsApp"}
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-black/8 shadow-2xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-tamil transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#0A6847] text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <span>{isTa ? tab.labelTa : tab.labelEn}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-black/5 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTa
                ? "ஆர்டர் எண், வாடிக்கையாளர் பெயர், தொலைபேசி, அல்லது ஊர் பெயர் கொண்டு தேடுக..."
                : "Search by order #, customer name, phone, or city..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-black/8 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black/8 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-tamil">
                <th className="py-3.5 px-4">{isTa ? "ஆர்டர் எண் & தேதி" : "Order & Date"}</th>
                <th className="py-3.5 px-4">{isTa ? "வாடிக்கையாளர்" : "Customer"}</th>
                <th className="py-3.5 px-4">{isTa ? "நூல்கள்" : "Books Ordered"}</th>
                <th className="py-3.5 px-4">{isTa ? "மொத்த தொகை" : "Total Amount"}</th>
                <th className="py-3.5 px-4">{isTa ? "கட்டண முறை" : "Payment"}</th>
                <th className="py-3.5 px-4">{isTa ? "நிலை" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isTa ? "செயல்" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 text-xs text-zinc-800">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Number & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 font-mono">
                      #{order.orderNumber}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString(isTa ? "ta-IN" : "en-IN", {
                        dateStyle: "medium",
                      })}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 font-tamil">
                      {order.customerName}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-tamil flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      <span>{order.customerCity}, {order.customerState}</span>
                    </div>
                  </td>

                  {/* Books */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900 font-tamil max-w-xs truncate">
                      {order.items.map((it) => `${it.title} (×${it.quantity})`).join(", ")}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-tamil mt-0.5">
                      {order.items.reduce((sum, it) => sum + it.quantity, 0)} {isTa ? "நூல்கள்" : "items"}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 font-mono text-sm">
                      {formatINR(order.total)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-tamil">
                      {isTa ? "அஞ்சல்:" : "Ship:"} {formatINR(order.shipping)}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-semibold font-tamil">
                      {order.paymentMethod === "upi" ? "UPI GPay" : "WhatsApp COD"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {/* Direct WhatsApp Chat */}
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `வணக்கம் ${order.customerName}, மேதகு களஞ்சியத்தில் உங்களது ஆர்டர் #${order.orderNumber} தொடர்பாக தொடர்பு கொள்கிறோம்.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                        title={isTa ? "வாடிக்கையாளருடன் வாட்ஸ்அப்பில் பேசுக" : "Chat on WhatsApp"}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#0A6847] hover:text-white text-zinc-700 text-xs font-semibold font-tamil transition-colors"
                      >
                        {isTa ? "விவரம்" : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-tamil">
            <ShoppingBag className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">
              {isTa ? "ஆர்டர்கள் எதுவும் கண்டறியப்படவில்லை" : "No orders found"}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  {isTa ? "ஆர்டர் விவரம்" : "Order Breakdown"}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 font-mono mt-0.5">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-black/8 space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 uppercase font-tamil tracking-wide">
                {isTa ? "வாடிக்கையாளர் முகவரி விவரம்" : "Customer Contact"}
              </h4>
              <div className="text-sm font-bold text-zinc-900 font-tamil">
                {selectedOrder.customerName}
              </div>
              <div className="text-xs text-zinc-600 flex items-center gap-1.5 font-mono">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                <span>{selectedOrder.customerPhone}</span>
              </div>
              <div className="text-xs text-zinc-600 flex items-center gap-1.5 font-tamil">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                <span>{selectedOrder.customerCity}, {selectedOrder.customerState}</span>
              </div>
            </div>

            {/* Books List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 uppercase font-tamil tracking-wide">
                {isTa ? "ஆர்டர் செய்யப்பட்ட நூல்கள்" : "Ordered Titles"}
              </h4>
              <div className="divide-y divide-black/6 border border-black/8 rounded-2xl p-3 bg-white">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-900 font-tamil">{item.title}</span>
                      <span className="text-zinc-400 font-mono ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-800">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-tamil">
                  <span>{isTa ? "அஞ்சல் கட்டணம்" : "Shipping Fee"}</span>
                  <span className="font-mono">{formatINR(selectedOrder.shipping)}</span>
                </div>
                <div className="pt-2 flex items-center justify-between text-sm font-bold text-zinc-900 font-tamil">
                  <span>{isTa ? "மொத்தம்" : "Grand Total"}</span>
                  <span className="font-mono text-base text-[#0A6847]">
                    {formatINR(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Control */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 font-tamil block">
                {isTa ? "ஆர்டர் நிலையை மாற்றுக" : "Update Order Status"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-tamil transition-all ${
                        selectedOrder.status === st
                          ? "bg-[#0A6847] text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Postal Tracking Number updater */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-800" />
                <h4 className="text-xs font-bold text-amber-950 font-tamil">
                  {isTa ? "அஞ்சல் கண்காணிப்பு எண் (ST Courier / India Post)" : "Postal Dispatch Tracking"}
                </h4>
              </div>
              {selectedOrder.trackingNumber ? (
                <div className="text-xs text-amber-900 font-mono font-bold bg-white/70 p-2.5 rounded-xl border border-amber-300">
                  {selectedOrder.courierPartner || "ST Courier"} • {selectedOrder.trackingNumber}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. STC987654321"
                    className="flex-1 px-3 py-2 rounded-xl border border-black/15 bg-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTracking(selectedOrder.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold font-tamil"
                  >
                    {isTa ? "சேமி" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp Direct Action */}
            <a
              href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `வணக்கம் ${selectedOrder.customerName}, மேதகு களஞ்சியத்திலிருந்து உங்களது #${selectedOrder.orderNumber} ஆர்டர் அனுப்பப்பட்டது. கண்காணிப்பு எண்: ${
                  selectedOrder.trackingNumber || "STC10294"
                }. நன்றி!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-tamil transition-all shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{isTa ? "வாடிக்கையாளருக்கு WhatsApp செய்தி அனுப்புக" : "Notify Customer on WhatsApp"}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
