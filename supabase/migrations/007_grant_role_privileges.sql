-- ============================================================
-- 007_GRANT_ROLE_PRIVILEGES.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- PostgREST / Supabase Role Permissions (anon, authenticated, service_role)
-- ============================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant read access on public catalog and content tables
GRANT SELECT ON public.categories TO anon, authenticated, service_role;
GRANT SELECT ON public.books TO anon, authenticated, service_role;
GRANT SELECT ON public.blogs TO anon, authenticated, service_role;
GRANT SELECT ON public.blog_books TO anon, authenticated, service_role;
GRANT SELECT ON public.supporters TO anon, authenticated, service_role;
GRANT SELECT ON public.videos TO anon, authenticated, service_role;
GRANT SELECT ON public.site_settings TO anon, authenticated, service_role;

-- Grant table access on user tables (guarded strictly by RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated, service_role;

-- Orders and Order items: SELECT for authenticated (RLS filters own orders), ALL for service_role
GRANT SELECT ON public.orders TO authenticated, anon;
GRANT SELECT ON public.order_items TO authenticated, anon;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- Sequences usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

