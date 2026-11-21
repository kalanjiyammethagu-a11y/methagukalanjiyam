"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  Phone,
  MapPin,
  XCircle,
  X,
  Loader2,
  Server,
  ChevronRight,
} from "lucide-react";
import { mockOrders } from "@/data/admin-mock";
import type { AdminOrder, OrderStatus } from "@/types/admin";
import { formatINR } from "@/lib/utils";

function mapSupabaseOrder(o: any): AdminOrder {
  const addr = o.shipping_address || {};
  return {
    id: o.id,
    orderNumber: o.order_number,
    customerName: addr.full_name || o.guest_phone || "Customer",
    customerPhone: addr.phone || o.guest_phone || "",
    customerCity: addr.city || "Tamil Nadu",
    customerState: addr.state || "Tamil Nadu",
    items: (o.order_items || []).map((oi: any) => ({
      bookId: oi.book_id || oi.id,
      title: oi.title,
      titleEn: oi.title,
      quantity: oi.quantity,
      price: Number(oi.price),
    })),
    subtotal: Number(o.subtotal || 0),
    shipping: Number(o.shipping_fee || 0),
    total: Number(o.total_amount || 0),
    status: (o.status || "pending") as OrderStatus,
    paymentMethod: o.payment_status === "paid" ? "upi" : "whatsapp_cod",
    trackingNumber: o.tracking_number || undefined,
    courierPartner: o.courier || undefined,
    notes: o.customer_notes || o.admin_notes || undefined,
    createdAt: o.created_at || new Date().toISOString(),
    updatedAt: o.updated_at || new Date().toISOString(),
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Selected order modal
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrder | null>(null);
  const [trackingInput, setTrackingInput] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders.map(mapSupabaseOrder));
          return;
        }
      }
    } catch {}
    setOrders(mockOrders);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // Lock body scroll and dismiss on Escape
  React.useEffect(() => {
    if (!selectedOrder) return;
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
  }, [selectedOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Order status updated to ${newStatus}`);
      } else {
        showToast("Error updating order status in database");
      }
    } catch {
      showToast("Network error updating order");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    if (!trackingInput.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          trackingNumber: trackingInput.trim(),
          courier: "ST Courier",
          status: "shipped",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  trackingNumber: trackingInput.trim(),
                  courierPartner: "ST Courier",
                  status: "shipped",
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
                  trackingNumber: trackingInput.trim(),
                  courierPartner: "ST Courier",
                  status: "shipped",
                }
              : null
          );
        }
        showToast(`Tracking ID saved: ${trackingInput}`);
        setTrackingInput("");
      } else {
        showToast("Error saving tracking ID to database");
      }
    } catch {
      showToast("Network error saving tracking");
    } finally {
      setUpdating(false);
    }
  };

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
            <Clock className="h-3 w-3 text-amber-700" />
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3 text-blue-700" />
            Confirmed
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-300 text-[11px] font-bold">
            <Truck className="h-3 w-3 text-purple-700" />
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-bold">
            <XCircle className="h-3 w-3 text-rose-700" />
            Cancelled
          </span>
        );
    }
  };

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "pending", label: "Pending", count: orders.filter((o) => o.status === "pending").length },
    { id: "confirmed", label: "Confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { id: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { id: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
  ];

  return (
    <div className="space-y-6">
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
          Orders Management
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Review customer book orders, update postal dispatch tracking numbers, and chat via WhatsApp
        </p>
      </div>

      {/* ERP Outbox Integration Link */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Server className="h-4 w-4" />
          </span>
          <span className="text-gray-700">
            <strong className="text-gray-900 font-bold">ERPNext Auto-Sync Active:</strong> Sales orders and customer accounts are synchronized with <code className="bg-emerald-100/60 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-[11px]">erp.methagukalanjiyam.in</code>.
          </span>
        </div>
        <Link
          href="/admin/erp"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors shrink-0 shadow-2xs"
        >
          <span>Open ERP Sync Dashboard</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#0A6847] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, phone, or city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Books Ordered</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order Number & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 font-mono">
                        #{order.orderNumber}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{order.customerCity}, {order.customerState}</span>
                      </div>
                    </td>

                    {/* Books */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 max-w-xs truncate">
                        {order.items.map((it) => `${it.titleEn || it.title} (×${it.quantity})`).join(", ")}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {order.items.reduce((sum, it) => sum + it.quantity, 0)} items
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 font-mono text-sm">
                        {formatINR(order.total)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Ship: {formatINR(order.shipping)}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-semibold">
                        {order.paymentMethod === "upi" ? "UPI / Online" : "WhatsApp COD"}
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
                            `Hello ${order.customerName}, this is regarding your Methagu Kalanjiyam order #${order.orderNumber}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-700 text-xs font-semibold transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Order Breakdown
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-mono mt-0.5">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Customer Contact
              </h4>
              <div className="text-sm font-bold text-gray-900">
                {selectedOrder.customerName}
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5 font-mono">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>{selectedOrder.customerPhone}</span>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span>{selectedOrder.customerCity}, {selectedOrder.customerState}</span>
              </div>
            </div>

            {/* Books List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Ordered Titles
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl p-3 bg-white">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{item.titleEn || item.title}</span>
                      <span className="text-gray-400 font-mono ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-800">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Shipping Fee</span>
                  <span className="font-mono">{formatINR(selectedOrder.shipping)}</span>
                </div>
                <div className="pt-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-[#0A6847]">
                    {formatINR(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Control */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Update Order Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                        selectedOrder.status === st
                          ? "bg-[#0A6847] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Postal Tracking Number updater */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-800" />
                <h4 className="text-xs font-bold text-amber-950">
                  Postal Dispatch Tracking (ST Courier / India Post)
                </h4>
              </div>
              {selectedOrder.trackingNumber ? (
                <div className="text-xs text-amber-900 font-mono font-bold bg-white p-2.5 rounded-xl border border-amber-200">
                  {selectedOrder.courierPartner || "ST Courier"} • {selectedOrder.trackingNumber}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. STC987654321"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleSaveTracking(selectedOrder.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp Direct Action */}
            <a
              href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello ${selectedOrder.customerName}, your Methagu Kalanjiyam order #${selectedOrder.orderNumber} has been dispatched. Tracking number: ${
                  selectedOrder.trackingNumber || "STC10294"
                }. Thank you!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Notify Customer on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
