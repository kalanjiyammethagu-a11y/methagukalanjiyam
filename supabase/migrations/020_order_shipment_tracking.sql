-- ============================================================
-- 020_ORDER_SHIPMENT_TRACKING.SQL
-- Task D: ST Courier Shipment Tracking + Append-Only Event Audit Trail
-- Non-destructive migration: adds courier/tracking columns on public.orders,
-- creates append-only public.order_shipment_events with strict RLS,
-- and safely backfills legacy courier/tracking fields.
-- NOTE: Do NOT execute directly against production without review.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend public.orders with structured shipment tracking columns
-- ------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name TEXT NOT NULL DEFAULT 'ST Courier',
  ADD COLUMN IF NOT EXISTS tracking_id TEXT,
  ADD COLUMN IF NOT EXISTS shipment_status TEXT NOT NULL DEFAULT 'Processing',
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS customer_note_en TEXT,
  ADD COLUMN IF NOT EXISTS customer_note_ta TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT;

-- Allowed shipment lifecycle states (admin-managed, no automated polling)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_shipment_status;
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_shipment_status CHECK (
    shipment_status IN (
      'Processing',
      'Packed',
      'Shipped',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Delivery Failed',
      'Returned'
    )
  );

-- Light non-strict format guard when tracking_id is present (trimmed 5..30 chars, alphanumeric + hyphen)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_tracking_id_format;
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_tracking_id_format CHECK (
    tracking_id IS NULL
    OR btrim(tracking_id) = ''
    OR btrim(tracking_id) ~ '^[A-Za-z0-9-]{5,30}$'
  );

-- Non-unique indexes (duplicate tracking IDs warn in admin UI but are not blocked)
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id
  ON public.orders (lower(btrim(tracking_id)))
  WHERE tracking_id IS NOT NULL AND btrim(tracking_id) <> '';

CREATE INDEX IF NOT EXISTS idx_orders_shipment_status_created
  ON public.orders (shipment_status, created_at DESC);

-- Safe non-destructive backfill from legacy columns
UPDATE public.orders
SET
  tracking_id = COALESCE(NULLIF(btrim(tracking_id), ''), NULLIF(btrim(tracking_number), '')),
  courier_name = COALESCE(
    NULLIF(btrim(courier_name), ''),
    CASE courier::text
      WHEN 'india_post' THEN 'India Post'
      WHEN 'professional_courier' THEN 'Professional Courier'
      ELSE 'ST Courier'
    END
  ),
  shipped_at = COALESCE(shipped_at, dispatched_at),
  shipment_status = CASE
    WHEN delivered_at IS NOT NULL OR status::text = 'delivered' THEN 'Delivered'
    WHEN status::text = 'returned' THEN 'Returned'
    WHEN dispatched_at IS NOT NULL
      OR status::text = 'dispatched'
      OR NULLIF(btrim(COALESCE(tracking_id, tracking_number)), '') IS NOT NULL
    THEN 'Shipped'
    ELSE COALESCE(NULLIF(shipment_status, ''), 'Processing')
  END,
  customer_note_ta = COALESCE(
    customer_note_ta,
    CASE
      WHEN customer_notes IS NOT NULL AND btrim(customer_notes) ~ ('[' || chr(2944) || '-' || chr(3071) || ']')
      THEN btrim(customer_notes)
      ELSE NULL
    END
  ),
  customer_note_en = COALESCE(
    customer_note_en,
    CASE
      WHEN customer_notes IS NOT NULL AND NOT (btrim(customer_notes) ~ ('[' || chr(2944) || '-' || chr(3071) || ']'))
      THEN btrim(customer_notes)
      ELSE NULL
    END
  ),
  internal_note = COALESCE(internal_note, NULLIF(btrim(admin_notes), ''))
WHERE true;

-- ------------------------------------------------------------
-- 2. Append-Only Shipment Events Audit Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_shipment_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (
    status IN (
      'Processing',
      'Packed',
      'Shipped',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Delivery Failed',
      'Returned'
    )
  ),
  note       TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_shipment_events_order_created
  ON public.order_shipment_events (order_id, created_at ASC);

-- Enforce strict append-only immutability on existing event rows
CREATE OR REPLACE FUNCTION public.prevent_order_shipment_event_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'order_shipment_events is append-only; updates are not permitted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_shipment_events_no_update ON public.order_shipment_events;
CREATE TRIGGER trg_order_shipment_events_no_update
  BEFORE UPDATE ON public.order_shipment_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_order_shipment_event_update();

-- ------------------------------------------------------------
-- 3. Row-Level Security (RLS) on order_shipment_events
-- ------------------------------------------------------------
ALTER TABLE public.order_shipment_events ENABLE ROW LEVEL SECURITY;

-- Public & unauthenticated users: NO write policies exist; only owner SELECT or Admin SELECT.
DROP POLICY IF EXISTS "Customers and admins can view order shipment events" ON public.order_shipment_events;
CREATE POLICY "Customers and admins can view order shipment events"
  ON public.order_shipment_events
  FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_shipment_events.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert order shipment events" ON public.order_shipment_events;
CREATE POLICY "Admins can insert order shipment events"
  ON public.order_shipment_events
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role full access order shipment events" ON public.order_shipment_events;
CREATE POLICY "Service role full access order shipment events"
  ON public.order_shipment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: public.orders already enforces RLS (`auth.uid() = user_id OR is_admin()` for SELECT).
-- Server API projections must omit `internal_note` and `admin_notes` on all customer responses.

-- ------------------------------------------------------------
-- ROLLBACK NOTES (Manual execution only)
-- ------------------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_order_shipment_events_no_update ON public.order_shipment_events;
-- DROP FUNCTION IF EXISTS public.prevent_order_shipment_event_update();
-- DROP TABLE IF EXISTS public.order_shipment_events;
-- ALTER TABLE public.orders
--   DROP CONSTRAINT IF EXISTS chk_orders_shipment_status,
--   DROP CONSTRAINT IF EXISTS chk_orders_tracking_id_format,
--   DROP COLUMN IF EXISTS courier_name,
--   DROP COLUMN IF EXISTS tracking_id,
--   DROP COLUMN IF EXISTS shipment_status,
--   DROP COLUMN IF EXISTS shipped_at,
--   DROP COLUMN IF EXISTS estimated_delivery_date,
--   DROP COLUMN IF EXISTS customer_note_en,
--   DROP COLUMN IF EXISTS customer_note_ta,
--   DROP COLUMN IF EXISTS internal_note;
