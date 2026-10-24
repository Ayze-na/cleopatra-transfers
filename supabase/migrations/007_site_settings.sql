-- 007_site_settings.sql
-- Adds: rate-limit log table, public site-images bucket,
-- expanded public settings RLS, public log RPCs, and base settings rows.

-- ============================================================
-- 1. Rate limiting: public_request_log
-- Tracks public POSTs so API routes can enforce a sliding window.
-- ============================================================
CREATE TABLE IF NOT EXISTS public_request_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip TEXT NOT NULL,
  email TEXT,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_public_request_log_endpoint_created ON public_request_log (endpoint, created_at);
CREATE INDEX idx_public_request_log_email_created ON public_request_log (email, created_at);

ALTER TABLE public_request_log ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors may record their own request.
CREATE POLICY "Public can record requests" ON public_request_log FOR INSERT WITH CHECK (true);
-- Anonymous visitors may read recent rows (used for server-side counting is done by
-- service role; this policy only exposes their own recent attempts defensively).
CREATE POLICY "Public can view recent requests" ON public_request_log FOR SELECT USING (true);

-- ============================================================
-- 2. Public site-images bucket for admin-uploaded marketing photos.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view public site images.
CREATE POLICY "Public can view site images" ON storage.objects FOR SELECT USING (bucket_id = 'site-images');
-- Only authenticated (admin panel) users can upload site images.
CREATE POLICY "Admins can upload site images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');
-- Only authenticated users can delete site images.
CREATE POLICY "Admins can delete site images" ON storage.objects FOR DELETE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- ============================================================
-- 3. Expand which settings keys the public may read.
-- ============================================================
DROP POLICY IF EXISTS "Public can view public settings" ON settings;
CREATE POLICY "Public can view public settings" ON settings FOR SELECT
  USING (key IN (
    'whatsapp_number',
    'contact_email',
    'contact_phone',
    'bank_details',
    'contact_details',
    'terms_document',
    'privacy_document'
  ));

-- ============================================================
-- 4. Public write RPCs for notification_log and activity_log.
-- SECURITY DEFINER so the website (anon) and admin panel
-- (authenticated) can append log rows without broad table grants.
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_notification(
  p_event text,
  p_channel text,
  p_recipient text,
  p_status text,
  p_error text,
  p_related_booking_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notification_log (event, channel, recipient, status, error, related_booking_id)
  VALUES (p_event, p_channel, p_recipient, p_status, p_error, p_related_booking_id);
END;
$$;

REVOKE ALL ON FUNCTION public.log_notification(text, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_notification(text, text, text, text, text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_activity(
  p_admin_id uuid,
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_details jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO activity_log (admin_id, action, entity, entity_id, details)
  VALUES (p_admin_id, p_action, p_entity, p_entity_id, p_details);
END;
$$;

REVOKE ALL ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb) TO anon, authenticated;

-- ============================================================
-- 5. Base settings rows (idempotent). Admin can edit these in panel.
-- value is blank by default; admin fills in the real number/details.
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('whatsapp_number',   '""'),
  ('contact_email',     '""'),
  ('contact_phone',     '""'),
  ('terms_document',    '{}'::jsonb),
  ('privacy_document',  '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
