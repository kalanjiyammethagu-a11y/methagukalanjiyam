-- ============================================================
-- 003_FUNCTIONS.SQL
-- Methagu Kalanjiyam Database Triggers & Search Functions
-- ============================================================

-- 1. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated ON books;
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_addresses_updated ON addresses;
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_cart_updated ON cart_items;
CREATE TRIGGER trg_cart_updated BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_blogs_updated ON blogs;
CREATE TRIGGER trg_blogs_updated BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Auto-generate human-friendly order number (MK-XXXXXXXX)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = 'MK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_number ON orders;
CREATE TRIGGER trg_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 3. Auto-generate Courier Tracking URL
CREATE OR REPLACE FUNCTION generate_tracking_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NOT NULL AND NEW.courier IS NOT NULL THEN
    CASE NEW.courier
      WHEN 'india_post' THEN
        NEW.tracking_url = 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ConsignmentNo=' || trim(NEW.tracking_number);
      WHEN 'st_courier' THEN
        NEW.tracking_url = 'https://www.stcourier.com/track-your-shipment?awb=' || trim(NEW.tracking_number);
      WHEN 'professional_courier' THEN
        NEW.tracking_url = 'https://www.tpcindia.com/track-consignment-detail.aspx?id=' || trim(NEW.tracking_number);
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tracking_url ON orders;
CREATE TRIGGER trg_tracking_url BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_url();

-- 4. Decrement Stock on Order Confirmation
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE books
    SET stock = stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND books.id = oi.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrement_stock ON orders;
CREATE TRIGGER trg_decrement_stock AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();

-- 5. Atomic Stock Reservation with Row Locking
CREATE OR REPLACE FUNCTION reserve_stock_for_checkout(
  order_book_items JSONB,
  hold_duration_minutes INT DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  current_stock INT;
  book_title TEXT;
BEGIN
  FOR item IN 
    SELECT * FROM jsonb_to_recordset(order_book_items) AS x(book_id UUID, quantity INT)
    ORDER BY book_id
  LOOP
    SELECT stock, title INTO current_stock, book_title
    FROM books
    WHERE id = item.book_id
    FOR UPDATE;

    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'BOOK_NOT_FOUND: Book ID % does not exist', item.book_id;
    END IF;

    IF current_stock < item.quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: "%" has only % copies left (requested %)', book_title, current_stock, item.quantity;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'reserved_until', now() + (hold_duration_minutes || ' minutes')::interval
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Maintain Category Book Counts
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories
      SET book_count = (SELECT count(*) FROM books WHERE category_id = NEW.category_id)
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories
      SET book_count = (SELECT count(*) FROM books WHERE category_id = OLD.category_id)
      WHERE id = OLD.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_category_count ON books;
CREATE TRIGGER trg_category_count AFTER INSERT OR UPDATE OR DELETE ON books
  FOR EACH ROW EXECUTE FUNCTION update_category_count();

-- 7. High-Performance Book Search Engine (Tamil, Tanglish, and Fuzzy)
CREATE OR REPLACE FUNCTION search_books(
  search_query TEXT DEFAULT NULL,
  category_slug TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT false,
  sort_by TEXT DEFAULT 'relevance',
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  author TEXT,
  price NUMERIC,
  discount_price NUMERIC,
  stock INT,
  is_in_stock BOOLEAN,
  cover_front TEXT,
  category_name TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.slug,
    b.author,
    b.price,
    b.discount_price,
    b.stock,
    b.is_in_stock,
    b.cover_front,
    c.name_ta AS category_name,
    CASE
      WHEN search_query IS NOT NULL AND trim(search_query) != '' THEN
        ts_rank(b.search_vector, websearch_to_tsquery('simple', search_query)) +
        similarity(b.title, search_query) * 0.5 +
        similarity(b.author, search_query) * 0.3
      ELSE 1.0
    END::REAL AS relevance
  FROM books b
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE
    (search_query IS NULL OR trim(search_query) = '' OR
      b.search_vector @@ websearch_to_tsquery('simple', search_query) OR
      similarity(b.title, search_query) > 0.15 OR
      similarity(b.author, search_query) > 0.15 OR
      b.transliteration_keywords && ARRAY[search_query])
    AND (category_slug IS NULL OR c.slug = category_slug)
    AND (min_price IS NULL OR b.price >= min_price)
    AND (max_price IS NULL OR b.price <= max_price)
    AND (NOT in_stock_only OR b.stock > 0)
  ORDER BY
    CASE sort_by
      WHEN 'price_asc' THEN b.price
      ELSE NULL
    END ASC NULLS LAST,
    CASE sort_by
      WHEN 'price_desc' THEN b.price
      ELSE NULL
    END DESC NULLS LAST,
    CASE sort_by
      WHEN 'newest' THEN b.created_at
      ELSE NULL
    END DESC NULLS LAST,
    relevance DESC,
    b.sort_order ASC
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- 8. Blog Search & Filter Function
CREATE OR REPLACE FUNCTION search_blogs(
  search_query TEXT DEFAULT NULL,
  filter_keyword TEXT DEFAULT NULL,
  filter_post_type TEXT DEFAULT NULL,
  page_size INT DEFAULT 12,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  post_type TEXT,
  excerpt TEXT,
  cover_image TEXT,
  gallery_images TEXT[],
  keywords TEXT[],
  reading_time_mins INT,
  published_at TIMESTAMPTZ,
  view_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.slug,
    b.post_type,
    b.excerpt,
    b.cover_image,
    b.gallery_images,
    b.keywords,
    b.reading_time_mins,
    b.published_at,
    b.view_count
  FROM blogs b
  WHERE b.is_published = true
    AND (filter_keyword IS NULL OR filter_keyword = ANY(b.keywords))
    AND (filter_post_type IS NULL OR b.post_type = filter_post_type)
    AND (search_query IS NULL OR trim(search_query) = '' OR
         b.search_vector @@ websearch_to_tsquery('simple', search_query) OR
         similarity(b.title, search_query) > 0.15)
  ORDER BY b.published_at DESC NULLS LAST
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- 9. Keyword Intersect Scoring for Related Articles
CREATE OR REPLACE FUNCTION get_related_blogs(
  current_blog_id UUID,
  post_keywords TEXT[],
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  cover_image TEXT,
  keywords TEXT[],
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.cover_image, b.keywords, b.published_at
  FROM blogs b
  WHERE b.id != current_blog_id
    AND b.is_published = true
    AND b.keywords && post_keywords
  ORDER BY cardinality(ARRAY(SELECT unnest(b.keywords) INTERSECT SELECT unnest(post_keywords))) DESC,
           b.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Materialized View for Monthly Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_analytics AS
SELECT
  date_trunc('month', o.created_at) AS month,
  count(*) AS total_orders,
  count(*) FILTER (WHERE o.status = 'pending') AS pending_orders,
  count(*) FILTER (WHERE o.status = 'dispatched' OR o.status = 'in_transit') AS in_transit_orders,
  count(*) FILTER (WHERE o.status = 'delivered') AS delivered_orders,
  count(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
  coalesce(sum(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_revenue,
  coalesce(sum(o.total_amount) FILTER (WHERE o.payment_status = 'pending'), 0) AS pending_revenue,
  count(DISTINCT o.user_id) AS unique_customers
FROM orders o
GROUP BY date_trunc('month', o.created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_analytics_month ON monthly_analytics (month);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_monthly_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
