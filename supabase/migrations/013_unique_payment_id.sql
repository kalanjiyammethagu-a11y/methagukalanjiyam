-- ==============================================================================
-- Migration: 013_unique_payment_id.sql
-- Description:
--   Enforces schema-level payment idempotency and prevents duplicate payment attribution:
--   1. Ensures a unique partial index exists on orders(razorpay_payment_id) where razorpay_payment_id IS NOT NULL.
--   2. Ensures a unique partial index exists on orders(razorpay_order_id) where razorpay_order_id IS NOT NULL.
--   Note: DO NOT EXECUTE DIRECTLY in production without reviewed migration release.
-- ==============================================================================

-- 1. Ensure unique partial index on razorpay_payment_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id_unique
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- 2. Ensure unique partial index on razorpay_order_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id_unique
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Comment for metadata and auditing
COMMENT ON INDEX idx_orders_razorpay_payment_id_unique IS
  'Guarantees that a single Razorpay payment ID cannot be attributed to multiple orders or replayed across transactions';
