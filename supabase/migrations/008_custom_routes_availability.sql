-- 008: Custom (free-text) direct-ride bookings + per-hour car availability.
--
-- Changes:
--   * direct_bookings.route FK becomes nullable (free-text routes have no route row)
--   * direct_bookings gets pickup_name / dropoff_name snapshots
--   * direct_bookings.price_amount becomes nullable (price decided by admin if no matrix price)
--   * car_booking_schedule view: one row per (car, hour-slot in Cairo time) for any
--     non-cancelled/rejected booking -> lets the wizard show a car as booked
--   * create_direct_booking RPC accepts optional route_id + snapshot names

ALTER TABLE public.direct_bookings ALTER COLUMN route_id DROP NOT NULL;
ALTER TABLE public.direct_bookings ALTER COLUMN price_amount DROP NOT NULL;
ALTER TABLE public.direct_bookings ADD COLUMN IF NOT EXISTS pickup_name TEXT;
ALTER TABLE public.direct_bookings ADD COLUMN IF NOT EXISTS dropoff_name TEXT;

CREATE OR REPLACE VIEW public.car_booking_schedule AS
SELECT
  b.car_id,
  to_char(b.trip_datetime AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD"T"HH24"00"') AS slot
FROM public.direct_bookings b
WHERE b.status NOT IN ('cancelled', 'rejected');

REVOKE ALL ON public.car_booking_schedule FROM PUBLIC;
GRANT SELECT ON public.car_booking_schedule TO anon, authenticated;

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
  v_route_id uuid := nullif(payload ->> 'route_id', '')::uuid;
  v_car_id uuid := (payload ->> 'car_id')::uuid;
  v_currency text := payload ->> 'currency';
  v_payment_method text := payload ->> 'payment_method';
BEGIN
  IF v_route_id IS NOT NULL THEN
    SELECT rp.amount
    INTO v_amount
    FROM public.route_prices rp
    WHERE rp.route_id = v_route_id
      AND rp.car_id = v_car_id
      AND rp.currency = v_currency
    LIMIT 1;
  END IF;

  INSERT INTO public.direct_bookings (
    route_id,
    car_id,
    pickup_name,
    dropoff_name,
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
    nullif(payload ->> 'pickup_name', ''),
    nullif(payload ->> 'dropoff_name', ''),
    (payload ->> 'trip_datetime')::timestamptz,
    nullif(payload ->> 'hotel_text', ''),
    (payload ->> 'passengers')::integer,
    coalesce((payload ->> 'luggage')::integer, 0),
    payload ->> 'client_name',
    payload ->> 'client_phone',
    payload ->> 'client_email',
    payload ->> 'nationality',
    nullif(payload ->> 'passport_file_path', ''),
    v_payment_method,
    nullif(payload ->> 'payment_screenshot_path', ''),
    CASE WHEN v_payment_method = 'cash' THEN 'cash_on_ride' ELSE 'awaiting_verification' END,
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
