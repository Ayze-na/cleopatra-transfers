-- Rate-limit records for admin one-time-code emails.

CREATE TABLE IF NOT EXISTS public.admin_login_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_requests_email_created
  ON public.admin_login_requests (lower(email), created_at DESC);

ALTER TABLE public.admin_login_requests ENABLE ROW LEVEL SECURITY;
