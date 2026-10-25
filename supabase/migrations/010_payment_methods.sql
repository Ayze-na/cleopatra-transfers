-- 010_payment_methods.sql
-- Admin-managed payment methods shown to clients at booking time.
-- Replaces the hard-coded cash / bank_transfer pair. Existing bookings keep
-- working: old rows stay as plain text, the API no longer enumerates the values.

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  details TEXT,
  requires_screenshot BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_sort ON payment_methods (sort_order, active);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active payment methods" ON payment_methods
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Seed the two existing methods so the client sees no change.
INSERT INTO payment_methods (code, display_name, details, requires_screenshot, sort_order)
VALUES
  ('cash', 'Cash', 'Pay the driver in cash after the ride.', false, 1),
  ('bank_transfer', 'Bank transfer', null, true, 2)
ON CONFLICT (code) DO NOTHING;

-- The old CHECK constraint locked payment_method to the two seeded values;
-- drop it so new admin-defined methods can be stored on new bookings.
ALTER TABLE direct_bookings DROP CONSTRAINT IF EXISTS direct_bookings_payment_method_check;

-- payment_status must follow the method type on new bookings.
CREATE OR REPLACE FUNCTION public.create_direct_booking(payload jsonb)
RETURNS TABLE (id uuid, reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_reference text;
  v_amount numeric(10, 2);
  v_route_id uuid := (payload ->> 'route_id')::uuid;
  v_car_id uuid := (payload ->> 'car_id')::uuid;
  v_currency text := payload ->> 'currency';
  v_payment_method text := payload ->> 'payment_method';
BEGIN
  SELECT rp.amount
  INTO v_amount
  FROM public.route_prices rp
  WHERE rp.route_id = v_route_id
    AND rp.car_id = v_car_id
    AND rp.currency = v_currency
  LIMIT 1;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Price not available for this route and car';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payment_methods pm
    WHERE pm.code = v_payment_method AND pm.active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Unknown payment method';
  END IF;

  INSERT INTO public.direct_bookings (
    route_id,
    car_id,
    trip_datetime,
    hotel_text,
    passengers,
    luggage,
    client_name,
    client_phone,
    client_email,
    nationality,
    passport_file_path,
    payment_method,
    payment_screenshot_path,
    payment_status,
    currency,
    price_amount,
    status,
    language
  )
  VALUES (
    v_route_id,
    v_car_id,
    (payload ->> 'trip_datetime')::timestamptz,
    nullif(payload ->> 'hotel_text', ''),
    (payload ->> 'passengers')::integer,
    coalesce((payload ->> 'luggage')::integer, 0),
    payload ->> 'client_name',
    payload ->> 'client_phone',
    payload ->> 'client_email',
    payload ->> 'nationality',
    payload ->> 'passport_file_path',
    v_payment_method,
    nullif(payload ->> 'payment_screenshot_path', ''),
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.payment_methods pm
        WHERE pm.code = v_payment_method AND pm.requires_screenshot IS TRUE
      ) THEN 'awaiting_verification'
      ELSE 'cash_on_ride'
    END,
    v_currency,
    v_amount,
    'pending',
    coalesce(payload ->> 'language', 'en')
  )
  RETURNING direct_bookings.id, direct_bookings.reference INTO v_id, v_reference;

  RETURN QUERY SELECT v_id, v_reference;
END;
$$;

REVOKE ALL ON FUNCTION public.create_direct_booking(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_direct_booking(jsonb) TO anon, authenticated;
