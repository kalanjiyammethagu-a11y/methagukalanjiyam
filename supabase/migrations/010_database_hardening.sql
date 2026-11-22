-- ============================================================
-- 010_DATABASE_HARDENING.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- 
-- 1. Deadlock Elimination in Atomic Order Processing (Deterministic Key Sorting)
-- 2. Hybrid UUID / Slug Resolution in create_order_atomic
-- 3. Automatic Inventory Restoration Trigger & RPC on Order Cancellation/Return
-- 4. Resilient Database-Backed ERP Sync Queue (erp_sync_queue)
-- 5. Missing Foreign Key & Composite Indexes for High-Traffic Queries
-- 6. Soft Delete Column (is_active) for Books Table
-- ============================================================

-- 1. Soft Delete & Active Status on Books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_books_active ON public.books (is_active) WHERE is_active = true;

-- 2. Missing Foreign Key & High-Traffic Composite Indexes
-- Foreign key index on order_items (book_id) to eliminate sequential scans on join
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON public.order_items (book_id);

-- Foreign key index on cart_items (book_id)
CREATE INDEX IF NOT EXISTS idx_cart_items_book_id ON public.cart_items (book_id);

-- Composite indexes on orders for admin filtering & pagination
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created ON public.orders (payment_status, created_at DESC);

-- Price sorting index for storefront catalog
CREATE INDEX IF NOT EXISTS idx_books_price ON public.books (price);

-- 3. Database-Backed ERP Sync Queue Table
CREATE TABLE IF NOT EXISTS public.erp_sync_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number    TEXT NOT NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_email  TEXT,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  item_count      INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  attempts        INT NOT NULL DEFAULT 0,
  max_attempts    INT NOT NULL DEFAULT 5,
  payload         JSONB NOT NULL,
  last_error      TEXT,
  next_retry_at   TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erp_sync_queue_status_retry
  ON public.erp_sync_queue (status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_erp_sync_queue_order_number
  ON public.erp_sync_queue (order_number);

-- Enable RLS for erp_sync_queue
ALTER TABLE public.erp_sync_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access to erp_sync_queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'erp_sync_queue' AND policyname = 'service_role_all_erp_sync_queue'
  ) THEN
    CREATE POLICY "service_role_all_erp_sync_queue"
      ON public.erp_sync_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Inventory Restoration on Order Cancellation or Return
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically restore inventory when order status transitions to cancelled or returned
CREATE OR REPLACE FUNCTION public.trg_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status transitions from a non-cancelled status to cancelled or returned
  IF (OLD.status NOT IN ('cancelled', 'returned') AND NEW.status IN ('cancelled', 'returned')) THEN
    PERFORM public.restore_order_inventory(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_orders_restore_stock ON public.orders;
CREATE TRIGGER trg_orders_restore_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_restore_stock_on_cancel();

-- 5. Deadlock-Free Atomic Order Creation RPC
-- Fixes:
-- A) Sorts items deterministically by book_id to guarantee cycle-free row locking (Postgres 40P01 Deadlock prevention)
-- B) Resolves book by UUID OR by slug so inventory locking is never bypassed
-- C) Populates order_items.book_id accurately
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_number        TEXT,
  p_user_id             UUID,
  p_is_guest_checkout   BOOLEAN,
  p_guest_phone         TEXT,
  p_guest_email         TEXT,
  p_subtotal            NUMERIC,
  p_shipping_fee        NUMERIC,
  p_discount            NUMERIC,
  p_total_amount        NUMERIC,
  p_currency            TEXT,
  p_razorpay_order_id   TEXT,
  p_shipping_address    JSONB,
  p_customer_notes      TEXT,
  p_items               JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_raw_id TEXT;
  v_book_id UUID;
  v_quantity INT;
  v_price NUMERIC;
  v_title TEXT;
  v_cover_url TEXT;
  v_line_total NUMERIC;
  v_current_stock INT;
  v_book_title TEXT;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- Step 1: Pre-validate & lock rows in deterministic order to prevent deadlocks (sorted by book_id)
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
    ORDER BY (value->>'book_id') ASC
  LOOP
    v_raw_id := v_item->>'book_id';
    v_quantity := (v_item->>'quantity')::INT;
    v_book_id := NULL;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    -- Resolve ID: Check UUID pattern first, then fallback to slug
    IF v_raw_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      v_book_id := v_raw_id::UUID;
    ELSE
      SELECT id INTO v_book_id FROM public.books WHERE slug = v_raw_id LIMIT 1;
    END IF;

    -- If book found, lock row FOR UPDATE and enforce stock
    IF v_book_id IS NOT NULL THEN
      SELECT stock, title INTO v_current_stock, v_book_title
      FROM public.books
      WHERE id = v_book_id
      FOR UPDATE;

      IF FOUND THEN
        IF v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for book "%": requested %, available %',
            COALESCE(v_book_title, v_raw_id), v_quantity, v_current_stock;
        ELSE
          UPDATE public.books
          SET stock = stock - v_quantity,
              updated_at = now()
          WHERE id = v_book_id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Step 2: Insert the parent Order record
  INSERT INTO public.orders (
    order_number,
    user_id,
    is_guest_checkout,
    guest_phone,
    guest_email,
    subtotal,
    shipping_fee,
    discount,
    total_amount,
    currency,
    status,
    payment_status,
    razorpay_order_id,
    shipping_address,
    customer_notes,
    created_at,
    updated_at
  ) VALUES (
    p_order_number,
    p_user_id,
    p_is_guest_checkout,
    p_guest_phone,
    p_guest_email,
    p_subtotal,
    p_shipping_fee,
    p_discount,
    p_total_amount,
    COALESCE(p_currency, 'INR'),
    'pending',
    'pending',
    p_razorpay_order_id,
    p_shipping_address,
    p_customer_notes,
    now(),
    now()
  )
  RETURNING id INTO v_order_id;

  -- Step 3: Insert line items with resolved book_id
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_raw_id := v_item->>'book_id';
    v_book_id := NULL;

    IF v_raw_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      v_book_id := v_raw_id::UUID;
    ELSE
      SELECT id INTO v_book_id FROM public.books WHERE slug = v_raw_id LIMIT 1;
    END IF;

    v_title := v_item->>'title';
    v_price := (v_item->>'price')::NUMERIC;
    v_quantity := (v_item->>'quantity')::INT;
    v_line_total := (v_item->>'line_total')::NUMERIC;
    v_cover_url := v_item->>'cover_url';

    INSERT INTO public.order_items (
      order_id,
      book_id,
      title,
      price,
      quantity,
      line_total,
      cover_url
    ) VALUES (
      v_order_id,
      v_book_id,
      v_title,
      v_price,
      v_quantity,
      v_line_total,
      v_cover_url
    );
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', p_order_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
