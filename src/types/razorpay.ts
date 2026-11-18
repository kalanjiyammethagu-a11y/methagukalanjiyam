/**
 * Razorpay Payment Gateway Type Definitions
 * Methagu Kalanjiyam E-Commerce Platform
 */

export type RazorpayCurrency = "INR";

export interface RazorpayOrderCreateOptions {
  amount: number; // In paise (₹1 = 100 paise)
  currency?: RazorpayCurrency;
  receipt?: string;
  notes?: Record<string, string>;
  partial_payment?: boolean;
}

export interface RazorpayOrder {
  id: string; // e.g. "order_EKwxwAgItmmXdp"
  entity: "order";
  amount: number; // in paise
  amount_paid: number;
  amount_due: number;
  currency: RazorpayCurrency;
  receipt: string | null;
  offer_id: string | null;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
  method?: "upi" | "card" | "netbanking" | "wallet";
}

export interface RazorpayTheme {
  color?: string;
  backdrop_color?: string;
  hide_topbar?: boolean;
}

export interface RazorpayModalOptions {
  backdropclose?: boolean;
  escape?: boolean;
  handleback?: boolean;
  confirm_close?: boolean;
  ondismiss?: () => void;
  animation?: boolean;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: RazorpayCurrency;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler?: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: RazorpayTheme;
  modal?: RazorpayModalOptions;
  retry?: {
    enabled: boolean;
    max_count?: number;
  };
  config?: {
    display?: {
      blocks?: Record<
        string,
        {
          name: string;
          instruments: Array<{
            method: string;
            wallets?: string[];
            banks?: string[];
            apps?: string[];
          }>;
        }
      >;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
}

export interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: RazorpayPaymentFailureResponse) => void): void;
  close(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

// Webhook Event Types
export type RazorpayWebhookEventType =
  | "payment.authorized"
  | "payment.captured"
  | "payment.failed"
  | "order.paid"
  | "refund.created"
  | "refund.processed"
  | "refund.failed";

export interface RazorpayPaymentEntity {
  id: string;
  entity: "payment";
  amount: number;
  currency: RazorpayCurrency;
  status: "captured" | "failed" | "authorized" | "refunded";
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: "card" | "netbanking" | "wallet" | "emi" | "upi";
  amount_refunded: number;
  refund_status: "null" | "partial" | "full" | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  created_at: number;
}

export interface RazorpayRefundEntity {
  id: string;
  entity: "refund";
  amount: number;
  currency: RazorpayCurrency;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  status: "pending" | "processed" | "failed";
  speed_processed: "normal" | "optimum";
  speed_requested: "normal" | "optimum";
  created_at: number;
}

export interface RazorpayWebhookPayload<T = RazorpayPaymentEntity> {
  entity: "event";
  account_id: string;
  event: RazorpayWebhookEventType;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrder;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
  };
  created_at: number;
}

// Internal API Contract Types
export interface CreateOrderApiResponse {
  order_id: string;
  order_number: string;
  razorpay_order_id: string;
  amount: number; // in paise
  currency: RazorpayCurrency;
  key_id: string;
}

export interface VerifyPaymentApiRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentApiResponse {
  success: boolean;
  message: string;
  order_id: string;
  order_number: string;
}
