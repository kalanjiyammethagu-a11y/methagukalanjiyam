import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validators/order";
import { VerifyPaymentApiResponse } from "@/types/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate payload with strict Zod schema
    const parseResult = verifyPaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid payment verification data",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      parseResult.data;

    // 2. Cryptographic signature check (timing-safe HMAC SHA-256)
    const isValid = verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

    if (!isValid) {
      console.warn(
        `Signature verification failed for order ${razorpay_order_id} and payment ${razorpay_payment_id}`
      );

      // Record failed payment attempt in database
      if (!isPlaceholderDb) {
        try {
          const adminSupabase = createAdminClient();
          await (adminSupabase.from("orders") as any)
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", razorpay_order_id);

          await (adminSupabase.from("audit_logs") as any).insert({
            action: "payment_verification_failed",
            resource_type: "orders",
            resource_id: razorpay_order_id,
            metadata: {
              razorpay_payment_id,
              razorpay_order_id,
              reason: "Invalid cryptographic signature",
            },
          });
        } catch (dbErr) {
          console.warn("Could not log failed payment status to DB:", dbErr);
        }
      }

      return NextResponse.json(
        {
          error: "Invalid payment signature. Transaction could not be verified.",
        },
        { status: 400 }
      );
    }

    // 3. Update order in Supabase
    let orderId = `order-${Date.now()}`;
    let orderNumber = `MK-TEST-${Date.now().toString().slice(-4)}`;

    if (!isPlaceholderDb) {
      const adminSupabase = createAdminClient();

      // Fetch existing order
      const { data: order, error: orderFetchError } = await (adminSupabase
        .from("orders") as any)
        .select("id, order_number, status, payment_status, razorpay_payment_id")
        .eq("razorpay_order_id", razorpay_order_id)
        .single();

      if (orderFetchError || !order) {
        console.error("Order fetch error during verify:", orderFetchError);
        return NextResponse.json(
          { error: "Matching order record not found in database" },
          { status: 404 }
        );
      }

      orderId = order.id;
      orderNumber = order.order_number;

      // Idempotency & Replay Attack Defense
      if (order.payment_status === "paid") {
        if (order.razorpay_payment_id === razorpay_payment_id) {
          // Idempotent duplicate verification: already verified with same payment ID
          return NextResponse.json(
            {
              success: true,
              message: "Payment already verified and order confirmed.",
              order_id: orderId,
              order_number: orderNumber,
            },
            { status: 200 }
          );
        } else {
          // Replay attempt: Order already paid with a DIFFERENT payment ID
          console.warn(
            `Replay attack prevented: Order ${order.id} is already paid with ${order.razorpay_payment_id}, rejected new payment ${razorpay_payment_id}`
          );
          return NextResponse.json(
            { error: "Order is already paid with a different payment reference" },
            { status: 409 }
          );
        }
      }

      // Update order state to paid and confirmed
      const { error: updateError } = await (adminSupabase.from("orders") as any)
        .update({
          payment_status: "paid",
          status: "confirmed",
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("Order update error on payment success:", updateError);
        return NextResponse.json(
          { error: "Failed to update order status" },
          { status: 500 }
        );
      }

      // Record audit log for successful payment confirmation
      await (adminSupabase.from("audit_logs") as any).insert({
        action: "order_payment_verified",
        resource_type: "orders",
        resource_id: order.id,
        metadata: {
          order_number: orderNumber,
          razorpay_payment_id,
          razorpay_order_id,
        },
      });
    }

    const responsePayload: VerifyPaymentApiResponse = {
      success: true,
      message: "Payment successfully verified and order confirmed.",
      order_id: orderId,
      order_number: orderNumber,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error("API /api/orders/verify exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
