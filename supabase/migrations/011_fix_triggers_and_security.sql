-- ==============================================================================
-- Migration: 011_fix_triggers_and_security.sql
-- Description:
--   1. Drop legacy colliding trigger trg_decrement_stock (prevents double decrement)
--   2. Enforce strict SECURITY DEFINER search_path = public, pg_temp
--   3. Revoke public/anon/authenticated execution on atomic stock RPCs
--   4. Add missing foreign key & lookup indexes for order_items and orders
--   5. Provide cancel_stale_pending_orders RPC for automated stock recovery
-- ==============================================================================

-- 1. Drop Legacy Double-Decrement Trigger
-- create_order_atomic already decrements inventory safely during checkout creation.
-- The legacy trigger on status change to 'confirmed' resulted in a double deduction.
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.orders;
DROP FUNCTION IF EXISTS public.decrement_stock_on_order();

-- 2. Performance Indexes on Foreign Keys
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON public.order_items(book_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at);

-- 3. Hardened Inventory Restoration Function (Search Path Protected)
CREATE OR REPLACE FUNCTION public.restore_order_inventory(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT book_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id AND book_id IS NOT NULL AND quantity > 0
  LOOP
    UPDATE public.books
    SET stock = stock + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.book_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.restore_order_inventory(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_order_inventory(UUID) TO service_role;

-- 4. Hardened Status Trigger for Cancel/Return Stock Restoration
CREATE OR REPLACE FUNCTION public.trg_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status NOT IN ('cancelled', 'returned') AND NEW.status IN ('cancelled', 'returned')) THEN
    PERFORM public.restore_order_inventory(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_orders_restore_stock ON public.orders;
CREATE TRIGGER trg_orders_restore_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_restore_stock_on_cancel();

-- 5. Revoke Public Execution on create_order_atomic (Service Role Only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_order_atomic'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_order_atomic(TEXT, UUID, BOOLEAN, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB, JSONB, TEXT) FROM PUBLIC, anon, authenticated;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_order_atomic(TEXT, UUID, BOOLEAN, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB, JSONB, TEXT) TO service_role;';
  END IF;
END $$;

-- 6. Cancel Stale Pending Orders (Release Inventory Held by Abandoned Checkouts)
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders(p_older_than_minutes INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  v_cancelled_count INT := 0;
  v_order RECORD;
BEGIN
  FOR v_order IN
    SELECT id, order_number
    FROM public.orders
    WHERE status = 'pending'
      AND created_at < (now() - (p_older_than_minutes || ' minutes')::interval)
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.orders
    SET status = 'cancelled',
        notes = coalesce(notes, '') || ' [தானியங்கி ரத்து: கட்டண நேரம் முடிந்தது]',
        updated_at = now()
    WHERE id = v_order.id;

    -- Note: trg_orders_restore_stock automatically restores inventory!
    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.cancel_stale_pending_orders(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stale_pending_orders(INT) TO service_role;
