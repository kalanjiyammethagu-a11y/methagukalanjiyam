/**
 * Resilient Frappe / ERPNext REST API Client
 * Methagu Kalanjiyam Platform
 */

import {
  ERPConfig,
  ERPCustomer,
  ERPSalesOrder,
  ERPItem,
  ERPHealthStatus,
} from "@/types/erp";

export class ERPNextClient {
  private config: ERPConfig;

  constructor(customConfig?: Partial<ERPConfig>) {
    this.config = {
      url: customConfig?.url || process.env.ERP_URL || "https://erp.methagukalanjiyam.in",
      apiKey: customConfig?.apiKey || process.env.ERP_API_KEY || "",
      apiSecret: customConfig?.apiSecret || process.env.ERP_API_SECRET || "",
      company: customConfig?.company || process.env.ERP_COMPANY || "Methagu Kalanjiyam",
      defaultItemGroup: customConfig?.defaultItemGroup || process.env.ERP_DEFAULT_ITEM_GROUP || "Books",
      enabled: customConfig?.enabled ?? (Boolean(process.env.ERP_API_KEY && process.env.ERP_API_SECRET) && process.env.ERP_ENABLED !== "false"),
      autoSyncOrders: customConfig?.autoSyncOrders ?? (process.env.ERP_AUTO_SYNC_ORDERS !== "false"),
    };

    // Remove any trailing slash from URL
    if (this.config.url.endsWith("/")) {
      this.config.url = this.config.url.slice(0, -1);
    }
  }

  public getConfig(): ERPConfig {
    return { ...this.config };
  }

  private getAuthHeader(): string {
    return `token ${this.config.apiKey}:${this.config.apiSecret}`;
  }

  /**
   * Diagnostic health check that tests connectivity and accurately identifies
   * Cloudflare Tunnel outages (e.g. Error 1033) vs normal offline vs live Frappe.
   */
  public async checkHealth(): Promise<ERPHealthStatus> {
    const checkedAt = new Date().toISOString();
    const startTime = Date.now();

    if (!this.config.url || !this.config.apiKey || !this.config.apiSecret) {
      return {
        isConfigured: false,
        isReachable: false,
        isTunnelOffline: false,
        erpUrl: this.config.url,
        tunnelMessage: "ERP credentials or URL are missing in configuration.",
        checkedAt,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const endpoint = `${this.config.url}/api/method/frappe.auth.get_logged_user`;
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      // Handle HTTP 530 (Cloudflare Tunnel error)
      if (res.status === 530) {
        const text = await res.text();
        const isTunnelError = text.includes("Cloudflare Tunnel error") || text.includes("1033");

        return {
          isConfigured: true,
          isReachable: false,
          isTunnelOffline: true,
          statusCode: 530,
          tunnelErrorCode: 1033,
          tunnelMessage: isTunnelError
            ? "Cloudflare Tunnel Error 1033: The tunnel connector (cloudflared) is currently stopped or unreachable on the ERP host server."
            : "Cloudflare Origin Error 530: Unable to reach origin server.",
          latencyMs,
          erpUrl: this.config.url,
          checkedAt,
        };
      }

      // Handle successful authentication
      if (res.status === 200) {
        let loggedUser = "Authenticated User";
        try {
          const data = await res.json();
          loggedUser = data.message || "Administrator";
        } catch {}

        return {
          isConfigured: true,
          isReachable: true,
          isTunnelOffline: false,
          statusCode: 200,
          latencyMs,
          loggedUser,
          erpUrl: this.config.url,
          checkedAt,
        };
      }

      // Handle other HTTP errors (401, 403, 502, etc.)
      const errorText = await res.text().catch(() => "");
      return {
        isConfigured: true,
        isReachable: false,
        isTunnelOffline: res.status >= 502 && res.status <= 504,
        statusCode: res.status,
        tunnelMessage: `ERP responded with HTTP ${res.status}: ${errorText.slice(0, 200) || res.statusText}`,
        latencyMs,
        erpUrl: this.config.url,
        checkedAt,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === "AbortError";

      return {
        isConfigured: true,
        isReachable: false,
        isTunnelOffline: false,
        tunnelMessage: isAbort
          ? "Connection to ERP timed out after 8 seconds."
          : `Network error reaching ERP: ${err.message || String(err)}`,
        latencyMs,
        erpUrl: this.config.url,
        checkedAt,
      };
    }
  }

  /**
   * Find existing customer in ERPNext by mobile number or email
   */
  public async findCustomer(query: {
    phone?: string;
    email?: string;
    name?: string;
  }): Promise<ERPCustomer | null> {
    if (!query.phone && !query.email && !query.name) return null;

    try {
      const filters: any[] = [];
      if (query.phone) {
        filters.push(["mobile_no", "=", query.phone]);
      } else if (query.email) {
        filters.push(["email_id", "=", query.email]);
      } else if (query.name) {
        filters.push(["customer_name", "=", query.name]);
      }

      const params = new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(["name", "customer_name", "mobile_no", "email_id"]),
        limit_page_length: "1",
      });

      const res = await fetch(`${this.config.url}/api/resource/Customer?${params.toString()}`, {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new customer in ERPNext
   */
  public async createCustomer(customer: ERPCustomer): Promise<ERPCustomer> {
    const payload = {
      doctype: "Customer",
      customer_name: customer.customer_name,
      customer_type: customer.customer_type || "Individual",
      customer_group: customer.customer_group || "Individual",
      territory: customer.territory || "India",
      mobile_no: customer.mobile_no || undefined,
      email_id: customer.email_id || undefined,
    };

    const res = await fetch(`${this.config.url}/api/resource/Customer`, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create ERP Customer (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.data;
  }

  /**
   * Find or create customer
   */
  public async findOrCreateCustomer(customer: ERPCustomer): Promise<ERPCustomer> {
    const existing = await this.findCustomer({
      phone: customer.mobile_no,
      email: customer.email_id,
      name: customer.customer_name,
    });

    if (existing) {
      return existing;
    }

    return await this.createCustomer(customer);
  }

  /**
   * Create Sales Order in ERPNext
   */
  public async createSalesOrder(salesOrder: ERPSalesOrder): Promise<any> {
    const today = new Date().toISOString().split("T")[0];

    const payload = {
      doctype: "Sales Order",
      customer: salesOrder.customer,
      transaction_date: salesOrder.transaction_date || today,
      delivery_date: salesOrder.delivery_date || today,
      company: salesOrder.company || this.config.company,
      order_type: salesOrder.order_type || "Sales",
      currency: salesOrder.currency || "INR",
      po_no: salesOrder.po_no,
      remarks: salesOrder.remarks,
      items: salesOrder.items.map((it) => ({
        item_code: it.item_code,
        item_name: it.item_name || it.item_code,
        description: it.description || it.item_name || it.item_code,
        qty: it.qty,
        rate: it.rate,
        amount: it.amount || it.qty * it.rate,
      })),
    };

    const res = await fetch(`${this.config.url}/api/resource/Sales Order`, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create ERP Sales Order (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.data;
  }

  /**
   * Sync a book into ERP Item master
   */
  public async syncItem(item: ERPItem): Promise<any> {
    const itemCode = item.item_code.trim();

    // Check if item exists
    const checkRes = await fetch(
      `${this.config.url}/api/resource/Item/${encodeURIComponent(itemCode)}`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      }
    );

    const payload = {
      doctype: "Item",
      item_code: itemCode,
      item_name: item.item_name,
      item_group: item.item_group || this.config.defaultItemGroup,
      stock_uom: item.stock_uom || "Nos",
      is_stock_item: item.is_stock_item ?? 1,
      standard_rate: item.standard_rate || 0,
      description: item.description || item.item_name,
    };

    if (checkRes.ok) {
      // Update existing
      const updateRes = await fetch(
        `${this.config.url}/api/resource/Item/${encodeURIComponent(itemCode)}`,
        {
          method: "PUT",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!updateRes.ok) {
        throw new Error(`Failed to update ERP Item ${itemCode}: ${await updateRes.text()}`);
      }
      return (await updateRes.json()).data;
    } else {
      // Create new
      const createRes = await fetch(`${this.config.url}/api/resource/Item`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        throw new Error(`Failed to create ERP Item ${itemCode}: ${await createRes.text()}`);
      }
      return (await createRes.json()).data;
    }
  }

  /**
   * Fetch recent items from ERP
   */
  public async fetchItems(limit = 20): Promise<ERPItem[]> {
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "item_code", "item_name", "item_group", "standard_rate", "stock_uom"]),
      limit_page_length: String(limit),
      order_by: "creation desc",
    });

    const res = await fetch(`${this.config.url}/api/resource/Item?${params.toString()}`, {
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch items (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    return data.data || [];
  }
}

// Global singleton instance
let defaultClient: ERPNextClient | null = null;

export function getERPClient(): ERPNextClient {
  if (!defaultClient) {
    defaultClient = new ERPNextClient();
  }
  return defaultClient;
}
