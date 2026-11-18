-- ============================================================
-- 008_RAZORPAY_INDEXES.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- Database Hardening for Payment Gateway Entities:
-- 1. Unique index on razorpay_order_id to eliminate full-table scans
-- 2. Unique index on razorpay_payment_id to prevent transaction replays
-- ============================================================

-- Ensure rapid lookup and single order per Razorpay order entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Enforce strict 1:1 relationship between Razorpay payment and internal order
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

