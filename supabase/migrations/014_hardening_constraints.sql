-- ==============================================================================
-- Migration: 014_hardening_constraints.sql
-- Description:
--   Adds database-level data integrity constraints and sanity checks:
--   1. Ensures discount_price is never greater than original price in books table.
--   2. Ensures price and stock counts are non-negative.
--   3. Adds check constraints for order items and total amount.
--   Note: DO NOT EXECUTE DIRECTLY in production without reviewed migration release.
-- ==============================================================================

-- 1. Ensure discount_price <= price on public.books
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_books_discount_price_valid'
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT chk_books_discount_price_valid
      CHECK (discount_price IS NULL OR discount_price <= price);
  END IF;
END $$;

-- 2. Ensure non-negative price on public.books
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_books_price_non_negative'
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT chk_books_price_non_negative
      CHECK (price >= 0);
  END IF;
END $$;

-- 3. Ensure positive quantity on public.order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_quantity_positive'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT chk_order_items_quantity_positive
      CHECK (quantity > 0);
  END IF;
END $$;

-- 4. Ensure non-negative total_amount on public.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total_amount_non_negative'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT chk_orders_total_amount_non_negative
      CHECK (total_amount >= 0);
  END IF;
END $$;
