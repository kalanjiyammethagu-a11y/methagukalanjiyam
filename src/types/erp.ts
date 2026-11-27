/**
 * ERPNext / Frappe REST API Types & Integration Interfaces
 * Methagu Kalanjiyam Platform
 */

export interface ERPConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  company: string;
  defaultItemGroup: string;
  enabled: boolean;
  autoSyncOrders: boolean;
}

export interface ERPCustomer {
  doctype?: "Customer";
  name?: string;
  customer_name: string;
  customer_type?: "Individual" | "Company";
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
}

export interface ERPSalesOrderItem {
  item_code: string;
  item_name?: string;
  description?: string;
  qty: number;
  rate: number;
  amount: number;
  warehouse?: string;
}

export interface ERPSalesOrder {
  doctype?: "Sales Order";
  name?: string;
  customer: string;
  customer_name?: string;
  transaction_date: string; // YYYY-MM-DD
  delivery_date?: string;    // YYYY-MM-DD
  company: string;
  order_type?: string;
  currency?: string;
  items: ERPSalesOrderItem[];
  net_total?: number;
  total_taxes_and_charges?: number;
  grand_total?: number;
  remarks?: string;
  po_no?: string; // Website order number (e.g. MK-123456-7890)
}

export interface ERPItem {
  doctype?: "Item";
  name?: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom?: string;
  is_stock_item?: 0 | 1;
  standard_rate?: number;
  description?: string;
  image?: string;
}

export interface ERPHealthStatus {
  isConfigured: boolean;
  isReachable: boolean;
  isTunnelOffline: boolean;
  statusCode?: number;
  tunnelErrorCode?: number;
  tunnelMessage?: string;
  latencyMs?: number;
  loggedUser?: string;
  erpUrl: string;
  checkedAt: string;
}

export interface ERPBinStock {
  item_code: string;
  warehouse?: string;
  actual_qty: number;
  projected_qty?: number;
  reserved_qty?: number;
}

export interface ERPStockSyncItem {
  bookId: string;
  title: string;
  itemCode: string;
  previousStock: number;
  newStock: number;
  updated: boolean;
}


export interface ERPSyncQueueItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  itemCount: number;
  status: "pending" | "processing" | "synced" | "failed" | "queued_tunnel_offline";
  erpSalesOrderId?: string;
  erpCustomerId?: string;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  payload?: any;
}

export interface ERPAuditLogEntry {
  id: string;
  timestamp: string;
  action: "health_check" | "create_customer" | "create_sales_order" | "sync_item" | "flush_queue";
  status: "success" | "failed" | "offline_queued";
  message: string;
  details?: Record<string, any>;
}
