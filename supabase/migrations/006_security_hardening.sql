-- ============================================================
-- 006_SECURITY_HARDENING.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- Database Hardening, Privilege Escalation Prevention & Atomic Orders
-- ============================================================

-- 1. Fix search_path on is_admin() to prevent search_path hijacking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Trigger function to prevent role escalation on profiles
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_role_escalation'
  ) THEN
    CREATE TRIGGER trg_prevent_role_escalation
      BEFORE UPDATE OF role ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.check_profile_role_update();
  END IF;
END $$;

-- 3. Harden RLS on profiles to forbid client role escalation
ALTER POLICY "Users can update own profile" ON public.profiles 
  WITH CHECK (
    auth.uid() = id AND (role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) OR public.is_admin())
  );

-- 4. Lock down orders & order_items against direct client-side tampering
ALTER POLICY "Users and guests can insert orders" ON public.orders WITH CHECK (public.is_admin());
ALTER POLICY "Users can insert order items" ON public.order_items WITH CHECK (public.is_admin());

-- 5. Audit Log Table for Sensitive Operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
  ) THEN
    CREATE POLICY "Admins can view audit logs"
      ON public.audit_logs FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Service role full access on audit_logs'
  ) THEN
    CREATE POLICY "Service role full access on audit_logs"
      ON public.audit_logs FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Atomic Transaction RPC for Order Creation & Inventory Lock
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'book_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      v_book_id := (v_item->>'book_id')::UUID;
      v_quantity := (v_item->>'quantity')::INT;

      IF v_quantity <= 0 THEN
        RAISE EXCEPTION 'Item quantity must be greater than zero';
      END IF;

      SELECT stock, title INTO v_current_stock, v_book_title
      FROM public.books
      WHERE id = v_book_id
      FOR UPDATE;

      IF FOUND THEN
        IF v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for book "%": requested %, available %', v_book_title, v_quantity, v_current_stock;
        ELSE
          UPDATE public.books
          SET stock = stock - v_quantity,
              updated_at = now()
          WHERE id = v_book_id;
        END IF;
      END IF;
    END IF;
  END LOOP;

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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_book_id := NULL;
    IF (v_item->>'book_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      v_book_id := (v_item->>'book_id')::UUID;
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

  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    p_user_id,
    'order_created',
    'orders',
    v_order_id::TEXT,
    jsonb_build_object(
      'order_number', p_order_number,
      'total_amount', p_total_amount,
      'is_guest', p_is_guest_checkout,
      'razorpay_order_id', p_razorpay_order_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
