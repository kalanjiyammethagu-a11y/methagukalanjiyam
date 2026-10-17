-- ============================================================
-- 002_RLS_POLICIES.SQL
-- Methagu Kalanjiyam Row Level Security Policies
-- ============================================================

-- Enable RLS on all user/data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ============================================================
-- CATEGORIES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin());

-- ============================================================
-- BOOKS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view books" ON books;
CREATE POLICY "Public can view books"
  ON books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage books" ON books;
CREATE POLICY "Admins can manage books"
  ON books FOR ALL
  USING (is_admin());

-- ============================================================
-- ADDRESSES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- ORDERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users and guests can insert orders" ON orders;
CREATE POLICY "Users and guests can insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR is_admin());

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (is_admin());

-- ============================================================
-- ORDER ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  USING (is_admin());

-- ============================================================
-- CART ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- BLOGS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
CREATE POLICY "Public can view published blogs"
  ON blogs FOR SELECT
  USING (is_published = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage blogs" ON blogs;
CREATE POLICY "Admins can manage blogs"
  ON blogs FOR ALL
  USING (is_admin());

-- ============================================================
-- BLOG ↔ BOOK TAGS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view blog books" ON blog_books;
CREATE POLICY "Public can view blog books"
  ON blog_books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage blog books" ON blog_books;
CREATE POLICY "Admins can manage blog books"
  ON blog_books FOR ALL
  USING (is_admin());

-- ============================================================
-- SUPPORTERS & VIDEOS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view active supporters" ON supporters;
CREATE POLICY "Public can view active supporters"
  ON supporters FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage supporters" ON supporters;
CREATE POLICY "Admins can manage supporters"
  ON supporters FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Public can view active videos" ON videos;
CREATE POLICY "Public can view active videos"
  ON videos FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage videos" ON videos;
CREATE POLICY "Admins can manage videos"
  ON videos FOR ALL
  USING (is_admin());

-- ============================================================
-- SITE SETTINGS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (is_admin());
