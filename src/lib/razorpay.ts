import crypto from "crypto";
import { allBooks, type BookItem } from "@/data/books";
import type {
  RazorpayOrder,
  RazorpayOrderCreateOptions,
} from "@/types/razorpay";
export { verifyPaymentSignature, verifyWebhookSignature } from "./crypto";

/**
 * Validates server-side Razorpay credentials
 */
export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  return { keyId, keySecret };
}

/**
 * Returns an instance of Razorpay SDK or a compatible REST client
 */
export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCredentials();

  try {
    // Attempt to load official Razorpay SDK if available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RazorpayModule = require("razorpay");
    const RazorpayConstructor = RazorpayModule.default || RazorpayModule;
    return new RazorpayConstructor({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch {
    // Fallback to Razorpay REST client if package is not yet installed in node_modules
    return {
      orders: {
        create: async (params: RazorpayOrderCreateOptions): Promise<RazorpayOrder> => {
          return createRazorpayOrderViaRest(params, keyId, keySecret);
        },
      },
    };
  }
}

/**
 * Directly calls Razorpay Orders REST API with HTTP Basic Authentication
 */
async function createRazorpayOrderViaRest(
  options: RazorpayOrderCreateOptions,
  keyId: string,
  keySecret: string
): Promise<RazorpayOrder> {
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: options.amount,
      currency: options.currency || "INR",
      receipt: options.receipt,
      notes: options.notes,
      partial_payment: options.partial_payment || false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Razorpay order creation failed: ${data?.error?.description || response.statusText}`
    );
  }

  return data as RazorpayOrder;
}

/**
 * Helper to create a Razorpay order with amounts in paise
 */
export async function createRazorpayOrder(
  options: RazorpayOrderCreateOptions
): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayCredentials();

  // Graceful development mode fallback for local testing with placeholder credentials
  if (
    keyId.includes("placeholder") ||
    keySecret === "placeholder" ||
    process.env.NODE_ENV === "test"
  ) {
    return {
      id: `order_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      entity: "order",
      amount: options.amount,
      amount_paid: 0,
      amount_due: options.amount,
      currency: options.currency || "INR",
      receipt: options.receipt || null,
      offer_id: null,
      status: "created",
      attempts: 0,
      notes: options.notes || {},
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: options.amount,
    currency: options.currency || "INR",
    receipt: options.receipt,
    notes: options.notes,
    partial_payment: options.partial_payment,
  });

  return order as RazorpayOrder;
}

export interface CalculatedOrderItem {
  book: BookItem;
  quantity: number;
  unitPrice: number; // in Rupees
  lineTotal: number; // in Rupees
}

export interface CalculatedOrderSummary {
  items: CalculatedOrderItem[];
  subtotal: number; // in Rupees
  shippingFee: number; // in Rupees (₹60 for TN, ₹100 for Other India)
  totalAmount: number; // in Rupees
  amountInPaise: number; // in Paise (totalAmount * 100)
}

/**
 * Calculates order amounts server-side from database if connected, falling back to static catalog.
 * Never trusts prices sent from the client.
 * Shipping rule: Tamil Nadu = ₹60, Other India = ₹100
 */
export async function calculateOrderSummaryAsync(
  requestedItems: Array<{ book_id: string; quantity: number }>,
  state: string
): Promise<CalculatedOrderSummary> {
  if (!requestedItems || requestedItems.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // 1. Try to fetch from Supabase database first
  const dbBooksMap = new Map<string, BookItem>();
  try {
    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isPlaceholderDb) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const rawIds = requestedItems.map((i) => i.book_id);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const uuidList = rawIds.filter((id) => uuidRegex.test(id));
      const slugList = rawIds.filter((id) => !uuidRegex.test(id));

      let query = (adminSupabase.from("books") as any).select("*");
      if (uuidList.length > 0 && slugList.length > 0) {
        query = query.or(`id.in.(${uuidList.join(",")}),slug.in.(${slugList.map((s) => `"${s}"`).join(",")})`);
      } else if (uuidList.length > 0) {
        query = query.in("id", uuidList);
      } else if (slugList.length > 0) {
        query = query.in("slug", slugList);
      }

      const { data: dbRows, error } = await query;

      if (!error && dbRows && dbRows.length > 0) {
        for (const row of dbRows) {
          const item: BookItem = {
            id: row.id,
            title: row.title,
            titleEn: row.title,
            author: row.author,
            authorEn: row.author,
            price: Number(row.price),
            discountPrice: row.discount_price ? Number(row.discount_price) : null,
            categoryTa: "வரலாறு",
            categoryEn: "History",
            categorySlug: "history",
            image: row.cover_front || "/images/books/book-placeholder.webp",
            stock: Number(row.stock),
            slug: row.slug,
            descriptionTa: row.description || "",
            descriptionEn: row.description || "",
          };
          dbBooksMap.set(row.id, item);
          dbBooksMap.set(row.slug, item);
        }
      }
    }
  } catch {
    // Database lookup failed, fall back to allBooks
  }

  const items: CalculatedOrderItem[] = [];
  let subtotal = 0;

  for (const item of requestedItems) {
    const book =
      dbBooksMap.get(item.book_id) ||
      allBooks.find((b) => b.id === item.book_id || b.slug === item.book_id);

    if (!book) {
      throw new Error(`Book with id '${item.book_id}' not found`);
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for book '${book.title}'`);
    }

    if (book.stock < item.quantity) {
      throw new Error(`Insufficient stock for '${book.title}'. Available: ${book.stock}`);
    }

    const unitPrice = book.discountPrice ?? book.price;
    const lineTotal = unitPrice * item.quantity;

    subtotal += lineTotal;
    items.push({
      book,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  // Shipping calculation: Tamil Nadu = ₹60, Other India = ₹100
  const normalizedState = (state || "").trim().toLowerCase();
  const isTamilNadu =
    normalizedState === "tamil nadu" ||
    normalizedState === "tamilnadu" ||
    normalizedState === "tn" ||
    normalizedState === "தமிழ்நாடு";

  const shippingFee = isTamilNadu ? 60 : 100;
  const totalAmount = subtotal + shippingFee;
  const amountInPaise = Math.round(totalAmount * 100);

  return {
    items,
    subtotal,
    shippingFee,
    totalAmount,
    amountInPaise,
  };
}

/**
 * Calculates order amounts server-side from static books data
 * Never trusts prices sent from the client
 * Shipping rule: Tamil Nadu = ₹60, Other India = ₹100
 */
export function calculateOrderSummary(
  requestedItems: Array<{ book_id: string; quantity: number }>,
  state: string
): CalculatedOrderSummary {
  if (!requestedItems || requestedItems.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const items: CalculatedOrderItem[] = [];
  let subtotal = 0;

  for (const item of requestedItems) {
    const book = allBooks.find((b) => b.id === item.book_id || b.slug === item.book_id);

    if (!book) {
      throw new Error(`Book with id '${item.book_id}' not found`);
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for book '${book.title}'`);
    }

    if (book.stock < item.quantity) {
      throw new Error(`Insufficient stock for '${book.title}'. Available: ${book.stock}`);
    }

    const unitPrice = book.discountPrice ?? book.price;
    const lineTotal = unitPrice * item.quantity;

    subtotal += lineTotal;
    items.push({
      book,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  // Shipping calculation: Tamil Nadu = ₹60, Other India = ₹100
  const normalizedState = (state || "").trim().toLowerCase();
  const isTamilNadu =
    normalizedState === "tamil nadu" ||
    normalizedState === "tamilnadu" ||
    normalizedState === "tn" ||
    normalizedState === "தமிழ்நாடு";

  const shippingFee = isTamilNadu ? 60 : 100;
  const totalAmount = subtotal + shippingFee;
  const amountInPaise = Math.round(totalAmount * 100);

  return {
    items,
    subtotal,
    shippingFee,
    totalAmount,
    amountInPaise,
  };
}
