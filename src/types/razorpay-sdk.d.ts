/**
 * Ambient type declaration for razorpay npm package
 */
declare module "razorpay" {
  export interface RazorpayConfig {
    key_id: string;
    key_secret: string;
    headers?: Record<string, string>;
  }

  export interface OrderCreationParams {
    amount: number | string;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    partial_payment?: boolean;
    [key: string]: unknown;
  }

  export interface RazorpayOrderResponse {
    id: string;
    entity: "order";
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string | null;
    offer_id: string | null;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  }

  export interface OrdersInstance {
    create(
      params: OrderCreationParams,
      callback?: (err: Error | null, order: RazorpayOrderResponse) => void
    ): Promise<RazorpayOrderResponse>;
    fetch(orderId: string): Promise<RazorpayOrderResponse>;
    all(params?: Record<string, unknown>): Promise<{ items: RazorpayOrderResponse[] }>;
  }

  export interface PaymentsInstance {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
    refund(paymentId: string, params?: Record<string, unknown>): Promise<any>;
  }

  export default class Razorpay {
    constructor(options: RazorpayConfig);
    orders: OrdersInstance;
    payments: PaymentsInstance;
    static validateWebhookSignature(body: string, signature: string, secret: string): boolean;
    static validatePaymentVerification(
      params: { order_id: string; payment_id: string },
      signature: string,
      secret: string
    ): boolean;
  }
}
