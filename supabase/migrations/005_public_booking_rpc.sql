-- Public booking creation through SECURITY DEFINER RPCs.
-- This keeps direct_bookings and trip_requests unreadable to the public while
-- still allowing the website to create a booking and receive its reference.

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

CREATE OR REPLACE FUNCTION public.create_trip_request(payload jsonb, place_ids uuid[])
RETURNS TABLE (id uuid, reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_reference text;
  v_place_id uuid;
BEGIN
  INSERT INTO public.trip_requests (
    start_date,
    days,
    passengers,
    luggage,
    client_name,
    client_phone,
    client_email,
    nationality,
    passport_file_path,
    status,
    language
  )
  VALUES (
    (payload ->> 'start_date')::date,
    (payload ->> 'days')::integer,
    (payload ->> 'passengers')::integer,
    coalesce((payload ->> 'luggage')::integer, 0),
    payload ->> 'client_name',
    payload ->> 'client_phone',
    payload ->> 'client_email',
    payload ->> 'nationality',
    payload ->> 'passport_file_path',
    'new',
    coalesce(payload ->> 'language', 'en')
  )
  RETURNING trip_requests.id, trip_requests.reference INTO v_id, v_reference;

  FOREACH v_place_id IN ARRAY place_ids LOOP
    INSERT INTO public.trip_request_places (trip_request_id, place_id)
    VALUES (v_id, v_place_id);
  END LOOP;

  RETURN QUERY SELECT v_id, v_reference;
END;
$$;

REVOKE ALL ON FUNCTION public.create_trip_request(jsonb, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_trip_request(jsonb, uuid[]) TO anon, authenticated;
