-- 009_security_hardening.sql
-- Closes audit findings:
--   * public_request_log: anon may only INSERT (its own rows), never SELECT (PII: ip/email)
--   * log_activity: anon no longer allowed to forge admin activity entries (authenticated only)
--   * is_active_admin_email: removed (admin email oracle, unused in app code)

-- 1) public_request_log: remove the public read policy. Keep insert-only for anon.
DROP POLICY IF EXISTS "Public can view recent requests" ON public_request_log;
-- (insert policy "Public can record requests" stays; count happens server-side w/ service role)

-- 2) log_activity: revoke from anon (authenticated admins only can log activity)
REVOKE EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb) TO authenticated;

-- 3) drop the admin email oracle function
DROP FUNCTION IF EXISTS public.is_active_admin_email(text);
