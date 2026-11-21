export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { RazorpayWebhookPayload } from "@/types/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract signature from X-Razorpay-Signature header
    const signature =
      req.headers.get("x-razorpay-signature") ||
      req.headers.get("X-Razorpay-Signature");

    if (!signature) {
      console.warn("Webhook rejected: Missing X-Razorpay-Signature header");
      return NextResponse.json(
        { error: "Missing webhook signature header" },
        { status: 400 }
      );
    }

    // 2. Read raw request body as string for cryptographic verification
    const rawBody = await req.text();

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured on server");
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 }
      );
    }

    const isVerified = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isVerified) {
      console.warn("Webhook rejected: Invalid HMAC signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 3. Parse JSON payload
    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    // 4. Derive unique event ID for idempotency deduplication
    const eventId =
      req.headers.get("x-razorpay-event-id") ||
      (payload as any).id ||
      `${payload.event}_${payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id || "evt"}_${payload.created_at}`;

    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

    const adminSupabase = isPlaceholderDb ? null : createAdminClient();

    if (adminSupabase) {
      // 5. Check if event has already been processed (Idempotency guarantee)
      const { data: existingEvent, error: checkError } = await (adminSupabase
        .from("razorpay_events") as any)
        .select("id, event_id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (checkError) {
        console.error("Error querying razorpay_events table:", checkError);
      }

      if (existingEvent) {
        // Event already processed; respond 200 OK immediately
        return NextResponse.json(
          {
            received: true,
            duplicate: true,
            message: `Event ${eventId} has already been processed`,
          },
          { status: 200 }
        );
      }
    }

    // 6. Handle event domain state transitions
    const { event, payload: data } = payload;

    if (adminSupabase) {
      switch (event) {
        case "payment.captured": {
          const payment = data.payment?.entity;
          if (payment && payment.order_id) {
            const { data: order } = await (adminSupabase
              .from("orders") as any)
              .select("id, order_number, status, payment_status, total_amount, shipping_address, guest_phone, guest_email, order_items (*)")
              .eq("razorpay_order_id", payment.order_id)
              .maybeSingle();

            if (!order) {
              console.warn(
                `Webhook payment.captured received for unknown razorpay_order_id: ${payment.order_id}. Returning 404 for Razorpay retry.`
              );
              return NextResponse.json(
                { error: "Order not found in database; awaiting retry" },
                { status: 404 }
              );
            }

            await (adminSupabase.from("orders") as any)
              .update({
                payment_status: "paid",
                status: order.status === "pending" ? "confirmed" : order.status,
                razorpay_payment_id: payment.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            await (adminSupabase.from("audit_logs") as any).insert({
              action: "webhook_payment_captured",
              resource_type: "orders",
              resource_id: order.id,
              metadata: {
                event_id: eventId,
                payment_id: payment.id,
                order_id: payment.order_id,
                amount: payment.amount,
                method: payment.method,
              },
            });

            // Enqueue for ERPNext synchronization (non-blocking)
            try {
              const { enqueueOrderSync } = await import("@/lib/erp/sync-queue");
              await enqueueOrderSync({
                orderId: order.id,
                orderNumber: order.order_number,
                customerName: order.shipping_address?.full_name || "Customer",
                customerPhone: order.shipping_address?.phone || order.guest_phone,
                customerEmail: order.guest_email,
                shippingAddress: order.shipping_address,
                totalAmount: order.total_amount || (payment.amount ? payment.amount / 100 : 0),
                items: (order.order_items || []).map((it: any) => ({
                  book_id: it.book_id,
                  title: it.title,
                  price: it.price,
                  quantity: it.quantity,
                })),
              });
            } catch (erpQueueErr) {
              console.warn("ERP auto-sync webhook enqueue notice:", erpQueueErr);
            }
          }
          break;
        }

        case "payment.failed": {
          const payment = data.payment?.entity;
          if (payment && payment.order_id) {
            // Guard: Never downgrade an already paid/confirmed order on late/out-of-order failure webhook
            const { data: updatedOrders } = await (adminSupabase.from("orders") as any)
              .update({
                payment_status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("razorpay_order_id", payment.order_id)
              .neq("payment_status", "paid")
              .select("id");

            if (updatedOrders && updatedOrders.length > 0) {
              await (adminSupabase.from("audit_logs") as any).insert({
                action: "webhook_payment_failed",
                resource_type: "orders",
                resource_id: payment.order_id,
                metadata: {
                  event_id: eventId,
                  payment_id: payment.id,
                  error_code: payment.error_code,
                  error_description: payment.error_description,
                },
              });
            } else {
              console.info(
                `Ignored payment.failed webhook for ${payment.order_id} because order is already paid or not found.`
              );
            }
          }
          break;
        }

        case "refund.created":
        case "refund.processed": {
          const refund = data.refund?.entity;
          const payment = data.payment?.entity;
          const paymentId = refund?.payment_id || payment?.id;

          if (paymentId) {
            const { data: order } = await (adminSupabase
              .from("orders") as any)
              .select("id, total_amount, payment_status")
              .eq("razorpay_payment_id", paymentId)
              .maybeSingle();

            if (order) {
              const refundAmountPaise = refund?.amount || 0;
              const orderTotalPaise = Math.round(Number(order.total_amount) * 100);
              const isFullRefund = refundAmountPaise >= orderTotalPaise;
              const newStatus = isFullRefund ? "refunded" : "partially_refunded";

              await (adminSupabase.from("orders") as any)
                .update({
                  payment_status: newStatus,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

              await (adminSupabase.from("audit_logs") as any).insert({
                action: "webhook_refund_processed",
                resource_type: "orders",
                resource_id: order.id,
                metadata: {
                  event_id: eventId,
                  refund_id: refund?.id,
                  refund_amount_paise: refundAmountPaise,
                  order_total_paise: orderTotalPaise,
                  is_full_refund: isFullRefund,
                },
              });
            }
          }
          break;
        }

        case "order.paid": {
          const orderEntity = data.order?.entity;
          if (orderEntity && orderEntity.id) {
            const { data: order } = await (adminSupabase
              .from("orders") as any)
              .select("id, status, payment_status")
              .eq("razorpay_order_id", orderEntity.id)
              .maybeSingle();

            if (!order) {
              console.warn(
                `Webhook order.paid received for unknown razorpay_order_id: ${orderEntity.id}. Returning 404 for Razorpay retry.`
              );
              return NextResponse.json(
                { error: "Order not found in database; awaiting retry" },
                { status: 404 }
              );
            }

            await (adminSupabase.from("orders") as any)
              .update({
                payment_status: "paid",
                status: order.status === "pending" ? "confirmed" : order.status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
          break;
        }

        default:
          break;
      }

      // 7. Persist event to razorpay_events table for idempotency and audit logs
      const { error: insertEventError } = await (adminSupabase
        .from("razorpay_events") as any)
        .insert({
          event_id: eventId,
          event_type: event,
          payload: payload as any,
          processed_at: new Date().toISOString(),
        });

      if (insertEventError) {
        console.error("Failed to record webhook event in audit table:", insertEventError);
      }
    }

    return NextResponse.json(
      {
        received: true,
        event,
        eventId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/webhooks/razorpay exception:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}
