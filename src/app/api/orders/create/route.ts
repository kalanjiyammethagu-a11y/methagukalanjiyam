export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validators/order";
import {
  calculateOrderSummary,
  createRazorpayOrder,
} from "@/lib/razorpay";
import { CreateOrderApiResponse } from "@/types/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Strict boundary validation with Zod
    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      items,
      shipping_address,
      customer_notes,
      is_guest_checkout,
      guest_phone,
      guest_email,
    } = parseResult.data;

    // 2. Server-side computation of prices, subtotal, shipping, and total amount in paise
    // NEVER trust prices from the client
    let summary;
    try {
      summary = calculateOrderSummary(items, shipping_address.state);
    } catch (calcError: any) {
      return NextResponse.json(
        { error: calcError.message || "Failed to calculate order amount" },
        { status: 400 }
      );
    }

    // 3. Resolve user ID if authenticated
    let userId: string | null = null;
    if (!is_guest_checkout) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Fall back to guest mode if session check fails
      }
    }

    // 4. Generate unique business order number
    const orderNumber = `MK-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // 5. Create Razorpay order via server SDK / REST API (amount in Paise)
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";

    const razorpayOrder = await createRazorpayOrder({
      amount: summary.amountInPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: {
        order_number: orderNumber,
        customer_phone: shipping_address.phone || guest_phone || "",
        customer_name: shipping_address.full_name || "",
        items_count: summary.items.length.toString(),
      },
    });

    if (!razorpayOrder || !razorpayOrder.id) {
      return NextResponse.json(
        { error: "Payment gateway order generation failed" },
        { status: 502 }
      );
    }

    // 6. Atomically persist Order and Order Items using PostgreSQL RPC
    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

    let orderRecord: { id: string; order_number: string } = {
      id: `mock-order-${Date.now()}`,
      order_number: orderNumber,
    };

    if (!isPlaceholderDb) {
      const adminSupabase = createAdminClient();

      const orderItemsPayload = summary.items.map((item) => ({
        book_id: item.book.id,
        title: item.book.title,
        price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
        cover_url: item.book.image || null,
      }));

      // Call atomic PostgreSQL function create_order_atomic
      const { data: rpcResult, error: rpcError } = await (adminSupabase.rpc as any)(
        "create_order_atomic",
        {
          p_order_number: orderNumber,
          p_user_id: userId,
          p_is_guest_checkout: is_guest_checkout,
          p_guest_phone: guest_phone || shipping_address.phone || null,
          p_guest_email: guest_email || null,
          p_subtotal: summary.subtotal,
          p_shipping_fee: summary.shippingFee,
          p_discount: 0,
          p_total_amount: summary.totalAmount,
          p_currency: "INR",
          p_razorpay_order_id: razorpayOrder.id,
          p_shipping_address: shipping_address,
          p_customer_notes: customer_notes || null,
          p_items: orderItemsPayload,
        }
      );

      if (rpcError || !rpcResult?.order_id) {
        console.error("Atomic order creation failed:", rpcError);
        return NextResponse.json(
          {
            error:
              rpcError?.message ||
              "Failed to atomically persist order and allocate inventory",
          },
          { status: 400 }
        );
      }

      orderRecord = {
        id: rpcResult.order_id,
        order_number: rpcResult.order_number,
      };
    }

    const responsePayload: CreateOrderApiResponse = {
      order_id: orderRecord.id,
      order_number: orderRecord.order_number,
      razorpay_order_id: razorpayOrder.id,
      amount: summary.amountInPaise,
      currency: "INR",
      key_id: keyId,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: any) {
    console.error("API /api/orders/create exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
