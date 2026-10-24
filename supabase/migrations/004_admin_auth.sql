-- Secure admin access and align RLS with Supabase Auth
-- Admins sign in with a one-time email code; only active admin_users can manage data.

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users a
    WHERE a.active IS TRUE
      AND (
        a.user_id = auth.uid()
        OR lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_active_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users a
    WHERE a.active IS TRUE
      AND lower(a.email) = lower(coalesce(check_email, ''))
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin_email(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.link_current_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.admin_users
  SET user_id = auth.uid(),
      updated_at = now()
  WHERE active IS TRUE
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
END;
$$;

REVOKE ALL ON FUNCTION public.link_current_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_current_admin() TO authenticated;

-- Admin users
DROP POLICY IF EXISTS "Admins can do everything" ON admin_users;
CREATE POLICY "Admins can view admins" ON admin_users
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "Admins can add admins" ON admin_users
  FOR INSERT TO authenticated WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update admins" ON admin_users
  FOR UPDATE TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can remove admins" ON admin_users
  FOR DELETE TO authenticated USING (public.is_active_admin());

-- Content tables
DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage routes" ON routes;
CREATE POLICY "Admins can manage routes" ON routes
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage cars" ON cars;
CREATE POLICY "Admins can manage cars" ON cars
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage route_prices" ON route_prices;
CREATE POLICY "Admins can manage route_prices" ON route_prices
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
CREATE POLICY "Admins can manage cities" ON cities
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage places" ON places;
CREATE POLICY "Admins can manage places" ON places
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Bookings and trip requests
DROP POLICY IF EXISTS "Admins can manage direct_bookings" ON direct_bookings;
CREATE POLICY "Admins can manage direct_bookings" ON direct_bookings
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage trip_requests" ON trip_requests;
CREATE POLICY "Admins can manage trip_requests" ON trip_requests
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage trip_request_places" ON trip_request_places;
CREATE POLICY "Admins can manage trip_request_places" ON trip_request_places
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Settings and logs
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can view notification_log" ON notification_log;
CREATE POLICY "Admins can manage notification_log" ON notification_log
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage activity_log" ON activity_log;
CREATE POLICY "Admins can manage activity_log" ON activity_log
  FOR ALL TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Storage: public can upload booking files, only active admins can read them
DROP POLICY IF EXISTS "Admins can upload passports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view passports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view payment screenshots" ON storage.objects;

CREATE POLICY "Public can upload passports" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'passports');
CREATE POLICY "Public can upload payment screenshots" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'payment-screenshots');
CREATE POLICY "Admins can view passports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'passports' AND public.is_active_admin());
CREATE POLICY "Admins can view payment screenshots" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'payment-screenshots' AND public.is_active_admin());
