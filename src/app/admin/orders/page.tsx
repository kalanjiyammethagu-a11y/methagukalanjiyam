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
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  History,
  Package,
} from "lucide-react";
import { mockOrders } from "@/data/admin-mock";
import type { AdminOrder, OrderStatus } from "@/types/admin";
import { formatINR } from "@/lib/utils";
import {
  COURIER_OPTIONS,
  SHIPMENT_STATUSES,
  ST_COURIER_DEFAULT_NAME,
  buildBilingualWhatsAppTrackingUrl,
  findDuplicateTrackingOrders,
  mapLegacyCourierToName,
  normalizeShipmentStatus,
  resolveCourierTrackingUrl,
  validateTrackingId,
  type ShipmentStatus,
} from "@/lib/tracking";

function mapSupabaseOrder(o: any): AdminOrder {
  const addr = o.shipping_address || {};
  const trackingId = (o.tracking_id || o.tracking_number || "").trim() || undefined;
  const courierName = o.courier_name || mapLegacyCourierToName(o.courier) || ST_COURIER_DEFAULT_NAME;
  const shipmentStatus = normalizeShipmentStatus(o.shipment_status, o.status, trackingId);
  const rawOrderStatus = o.status === "dispatched" ? "shipped" : o.status || "pending";

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
    status: rawOrderStatus as OrderStatus,
    paymentMethod: o.payment_status === "paid" ? "upi" : "whatsapp_cod",
    trackingNumber: trackingId,
    courierPartner: courierName,
    courierName,
    trackingId,
    shipmentStatus,
    trackingUrl: o.tracking_url || resolveCourierTrackingUrl(courierName),
    shippedAt: o.shipped_at || o.dispatched_at || null,
    estimatedDeliveryDate: o.estimated_delivery_date || null,
    customerNoteEn: o.customer_note_en || (o.customer_notes && !/[\u0B80-\u0BFF]/.test(o.customer_notes) ? o.customer_notes : null),
    customerNoteTa: o.customer_note_ta || (o.customer_notes && /[\u0B80-\u0BFF]/.test(o.customer_notes) ? o.customer_notes : null),
    internalNote: o.internal_note || o.admin_notes || null,
    shipmentEvents: Array.isArray(o.order_shipment_events) ? o.order_shipment_events : [],
    notes: o.customer_notes || o.admin_notes || undefined,
    createdAt: o.created_at || new Date().toISOString(),
    updatedAt: o.updated_at || new Date().toISOString(),
  };
}

function getShipmentBadgeStyle(status: ShipmentStatus): string {
  switch (status) {
    case "Delivered":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "Out for Delivery":
      return "bg-teal-50 text-teal-800 border-teal-300";
    case "In Transit":
    case "Shipped":
      return "bg-purple-50 text-purple-800 border-purple-300";
    case "Packed":
      return "bg-blue-50 text-blue-800 border-blue-300";
    case "Delivery Failed":
    case "Returned":
      return "bg-rose-50 text-rose-800 border-rose-300";
    default:
      return "bg-amber-50 text-amber-800 border-amber-300";
  }
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const match = String(iso).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [shipmentFilter, setShipmentFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = React.useState<string | null>(null);

  // Selected order modal + Shipping & Tracking form state
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrder | null>(null);
  const [courierInput, setCourierInput] = React.useState<string>(ST_COURIER_DEFAULT_NAME);
  const [trackingInput, setTrackingInput] = React.useState("");
  const [shipmentStatusInput, setShipmentStatusInput] = React.useState<ShipmentStatus>("Processing");
  const [shippedAtInput, setShippedAtInput] = React.useState("");
  const [etaInput, setEtaInput] = React.useState("");
  const [customerNoteEnInput, setCustomerNoteEnInput] = React.useState("");
  const [customerNoteTaInput, setCustomerNoteTaInput] = React.useState("");
  const [internalNoteInput, setInternalNoteInput] = React.useState("");
  const [eventNoteInput, setEventNoteInput] = React.useState("");
  const [trackingFormError, setTrackingFormError] = React.useState<string | null>(null);
  const [saveWarnings, setSaveWarnings] = React.useState<string[]>([]);
  const [updating, setUpdating] = React.useState(false);

  const populateTrackingForm = React.useCallback((order: AdminOrder) => {
    setCourierInput(order.courierName || ST_COURIER_DEFAULT_NAME);
    setTrackingInput(order.trackingId || order.trackingNumber || "");
    setShipmentStatusInput(order.shipmentStatus || "Processing");
    setShippedAtInput(toDateInputValue(order.shippedAt));
    setEtaInput(toDateInputValue(order.estimatedDeliveryDate));
    setCustomerNoteEnInput(order.customerNoteEn || "");
    setCustomerNoteTaInput(order.customerNoteTa || "");
    setInternalNoteInput(order.internalNote || "");
    setEventNoteInput("");
    setTrackingFormError(null);
    setSaveWarnings([]);
  }, []);

  const openOrderModal = React.useCallback(
    (order: AdminOrder) => {
      setSelectedOrder(order);
      populateTrackingForm(order);
    },
    [populateTrackingForm]
  );

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyTracking = async (value: string, idKey: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedOrderId(idKey);
      showToast(`Copied tracking ID: ${value}`);
      setTimeout(() => setCopiedOrderId((prev) => (prev === idKey ? null : prev)), 2000);
    } catch {
      showToast("Copy failed — select tracking ID manually");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.order) {
        const mapped = mapSupabaseOrder(data.order);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? mapped : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(mapped);
          populateTrackingForm(mapped);
        }
        showToast(`Order status updated to ${newStatus}`);
      } else {
        showToast(data.error || "Error updating order status in database");
      }
    } catch {
      showToast("Network error updating order");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const validation = validateTrackingId(trackingInput);
    if (!validation.valid) {
      setTrackingFormError(validation.error || "Invalid tracking ID format");
      return;
    }

    setTrackingFormError(null);
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          courierName: courierInput || ST_COURIER_DEFAULT_NAME,
          trackingId: validation.value || null,
          shipmentStatus: shipmentStatusInput,
          shippedAt: shippedAtInput ? `${shippedAtInput}T00:00:00.000Z` : "",
          estimatedDeliveryDate: etaInput || "",
          customerNoteEn: customerNoteEnInput,
          customerNoteTa: customerNoteTaInput,
          internalNote: internalNoteInput,
          eventNote: eventNoteInput,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTrackingFormError(data.error || "Failed to save tracking update.");
        showToast(data.error || "Error saving tracking info");
        return;
      }

      if (data.order) {
        const mapped = mapSupabaseOrder(data.order);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? mapped : o)));
        setSelectedOrder(mapped);
        populateTrackingForm(mapped);
      }

      const apiWarnings: string[] = Array.isArray(data.warnings)
        ? data.warnings.map((w: any) => String(w.message))
        : [];
      setSaveWarnings(apiWarnings);

      showToast(
        validation.value
          ? `Saved tracking (${shipmentStatusInput}): ${validation.value}`
          : `Shipment status updated to ${shipmentStatusInput}`
      );
    } catch {
      showToast("Network error saving shipment tracking");
    } finally {
      setUpdating(false);
    }
  };

  // Duplicate warning preview in real-time before/after saving (warn only, never blocks)
  const liveDuplicates = React.useMemo(() => {
    if (!selectedOrder) return [];
    return findDuplicateTrackingOrders(trackingInput, selectedOrder.id, orders);
  }, [selectedOrder, trackingInput, orders]);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    const tid = (o.trackingId || o.trackingNumber || "").toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.customerCity.toLowerCase().includes(q) ||
      tid.includes(q) ||
      o.shipmentStatus.toLowerCase().includes(q);

    const matchesTab = activeTab === "all" || o.status === activeTab;
    const matchesShipment =
      shipmentFilter === "all" ||
      (shipmentFilter === "unassigned"
        ? !(o.trackingId || o.trackingNumber)
        : o.shipmentStatus === shipmentFilter);

    return matchesSearch && matchesTab && matchesShipment;
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
          Orders & ST Courier Tracking
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Review book orders, assign ST Courier tracking IDs, manage shipment milestones, and notify customers on WhatsApp
        </p>
      </div>

      {/* ERP Outbox Integration Link */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Server className="h-4 w-4" />
          </span>
          <span className="text-gray-700">
            <strong className="text-gray-900 font-bold">ERPNext Auto-Sync Active:</strong> Sales orders and customer accounts are synchronized with{" "}
            <code className="bg-emerald-100/60 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-[11px]">
              erp.methagukalanjiyam.in
            </code>.
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

        {/* Search Input + Shipment Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, tracking ID, customer name, phone, or city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
            />
          </div>
          <div className="sm:w-56">
            <select
              aria-label="Filter by shipment status"
              value={shipmentFilter}
              onChange={(e) => setShipmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
            >
              <option value="all">All Shipment Statuses</option>
              <option value="unassigned">Missing Tracking ID</option>
              {SHIPMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
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
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">Tracking ID</th>
                <th className="py-3.5 px-4">Shipment Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const tid = order.trackingId || order.trackingNumber;
                  const dupMatches = findDuplicateTrackingOrders(tid, order.id, orders);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openOrderModal(order)}
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
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>
                            {order.customerCity}, {order.customerState}
                          </span>
                        </div>
                      </td>

                      {/* Books */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 max-w-[180px] truncate">
                          {order.items
                            .map((it) => `${it.titleEn || it.title} (×${it.quantity})`)
                            .join(", ")}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {order.items.reduce((sum, it) => sum + it.quantity, 0)} items ·{" "}
                          {order.paymentMethod === "upi" ? "UPI" : "COD/WA"}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 font-mono text-sm">
                          {formatINR(order.total)}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                      {/* Tracking ID Column */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {tid ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                                {tid}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(tid, order.id)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                title="Copy Tracking ID"
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {order.courierName || ST_COURIER_DEFAULT_NAME}
                              {dupMatches.length > 0 && (
                                <span
                                  className="ml-1.5 inline-flex items-center gap-0.5 text-amber-700 font-semibold"
                                  title={`Duplicate tracking on #${dupMatches.map((d) => d.orderNumber).join(", #")}`}
                                >
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Dup
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Not assigned</span>
                        )}
                      </td>

                      {/* Shipment Status Column */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${getShipmentBadgeStyle(
                            order.shipmentStatus
                          )}`}
                        >
                          <Package className="h-3 w-3 shrink-0" />
                          <span>{order.shipmentStatus}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={buildBilingualWhatsAppTrackingUrl({
                              customerName: order.customerName,
                              customerPhone: order.customerPhone,
                              orderNumber: order.orderNumber,
                              trackingId: tid,
                              courierName: order.courierName,
                              shipmentStatus: order.shipmentStatus,
                              trackingUrl: order.trackingUrl,
                              customerNoteEn: order.customerNoteEn,
                              customerNoteTa: order.customerNoteTa,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                            title="Send bilingual WhatsApp update"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openOrderModal(order)}
                            className="px-3 py-2 sm:px-2.5 sm:py-1 min-h-[44px] sm:min-h-[32px] rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal with Shipping & Tracking Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Order Breakdown & Shipment
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-mono mt-0.5">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setSelectedOrder(null)}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Customer Contact
              </h4>
              <div className="text-sm font-bold text-gray-900">{selectedOrder.customerName}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5 font-mono">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>{selectedOrder.customerPhone}</span>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {selectedOrder.customerCity}, {selectedOrder.customerState}
                </span>
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

            {/* Order Status Quick Controls */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Update Order Status</label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
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

            {/* Shipping & Tracking Panel */}
            <form
              onSubmit={handleSaveTracking}
              className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-800" />
                  <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                    Shipping & Tracking (ST Courier)
                  </h4>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getShipmentBadgeStyle(
                    shipmentStatusInput
                  )}`}
                >
                  {shipmentStatusInput}
                </span>
              </div>

              {(liveDuplicates.length > 0 || saveWarnings.length > 0) && (
                <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Duplicate Tracking ID Warning (Non-blocking)</p>
                    {liveDuplicates.length > 0 && (
                      <p>
                        This tracking ID is already attached to order(s):{" "}
                        {liveDuplicates.map((d) => `#${d.orderNumber}`).join(", ")}.
                      </p>
                    )}
                    {saveWarnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {trackingFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {trackingFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Courier Partner
                  </label>
                  <select
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 min-h-[40px]"
                  >
                    {COURIER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Shipment Status
                  </label>
                  <select
                    value={shipmentStatusInput}
                    onChange={(e) => setShipmentStatusInput(e.target.value as ShipmentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 min-h-[40px]"
                  >
                    {SHIPMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Tracking ID (5–30 chars, letters/digits/hyphen)
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => {
                      setTrackingInput(e.target.value);
                      setTrackingFormError(null);
                    }}
                    onBlur={() => setTrackingInput((prev) => prev.trim())}
                    placeholder="e.g. ST-TN-29834756 or STC987654321"
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono min-h-[40px]"
                  />
                  <button
                    type="button"
                    disabled={!trackingInput.trim()}
                    onClick={() => handleCopyTracking(trackingInput.trim(), "modal")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-bold text-gray-700 min-h-[40px] cursor-pointer"
                  >
                    {copiedOrderId === "modal" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy Tracking ID</span>
                  </button>
                  <a
                    href={resolveCourierTrackingUrl(courierInput)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold min-h-[40px]"
                  >
                    <span>Track on ST Courier</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Shipped Date
                  </label>
                  <input
                    type="date"
                    value={shippedAtInput}
                    onChange={(e) => setShippedAtInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Estimated Delivery Date (ETA)
                  </label>
                  <input
                    type="date"
                    value={etaInput}
                    onChange={(e) => setEtaInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs min-h-[40px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Customer Note (English)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNoteEnInput}
                    onChange={(e) => setCustomerNoteEnInput(e.target.value)}
                    placeholder="Visible to customer on order page..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1 font-tamil">
                    Customer Note (தமிழ்)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNoteTaInput}
                    onChange={(e) => setCustomerNoteTaInput(e.target.value)}
                    placeholder="வாடிக்கையாளருக்குக் காட்டப்படும் குறிப்பு..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-tamil leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Event Timeline Note (optional)
                  </label>
                  <input
                    type="text"
                    value={eventNoteInput}
                    onChange={(e) => setEventNoteInput(e.target.value)}
                    placeholder="e.g. Handed over at Chennai ST Courier hub"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-rose-800 block mb-1">
                    Internal Note (Admin Only — hidden from customer)
                  </label>
                  <input
                    type="text"
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Private staff dispatch remarks"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs min-h-[40px]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085237] disabled:opacity-60 text-white text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                >
                  {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Tracking & Log Event</span>
                </button>

                <a
                  href={buildBilingualWhatsAppTrackingUrl({
                    customerName: selectedOrder.customerName,
                    customerPhone: selectedOrder.customerPhone,
                    orderNumber: selectedOrder.orderNumber,
                    trackingId: trackingInput.trim() || selectedOrder.trackingId,
                    courierName: courierInput || selectedOrder.courierName,
                    shipmentStatus: shipmentStatusInput,
                    trackingUrl: resolveCourierTrackingUrl(courierInput),
                    customerNoteEn: customerNoteEnInput,
                    customerNoteTa: customerNoteTaInput,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm min-h-[44px]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send WhatsApp Update (TA + EN)</span>
                </a>
              </div>
            </form>

            {/* Shipment Event History Timeline */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500" />
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Shipment Event History ({selectedOrder.shipmentEvents?.length || 0})
                </h4>
              </div>
              {selectedOrder.shipmentEvents && selectedOrder.shipmentEvents.length > 0 ? (
                <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 bg-gray-50/60">
                  {selectedOrder.shipmentEvents.map((ev) => (
                    <div key={ev.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-900">{ev.status}</span>
                        {ev.note && <p className="text-gray-600">{ev.note}</p>}
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 shrink-0">
                        {new Date(ev.created_at).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No logged shipment events yet. Saving a tracking update will record an append-only event.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
