-- Row Level Security Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_request_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public can read active content
CREATE POLICY "Public can view active locations" ON locations FOR SELECT USING (active = true);
CREATE POLICY "Public can view active routes" ON routes FOR SELECT USING (active = true);
CREATE POLICY "Public can view active cars" ON cars FOR SELECT USING (active = true);
CREATE POLICY "Public can view route prices" ON route_prices FOR SELECT USING (true);
CREATE POLICY "Public can view active cities" ON cities FOR SELECT USING (active = true);
CREATE POLICY "Public can view active places" ON places FOR SELECT USING (active = true);

-- Public can create bookings/requests
CREATE POLICY "Public can create direct bookings" ON direct_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create trip requests" ON trip_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create trip request places" ON trip_request_places FOR INSERT WITH CHECK (true);

-- Settings - public can read some settings
CREATE POLICY "Public can view public settings" ON settings FOR SELECT USING (key IN ('whatsapp_number', 'bank_details', 'contact_details'));

-- Admin policies (service role bypasses RLS, but for admin panel users)
CREATE POLICY "Admins can do everything" ON admin_users FOR ALL USING (true);
CREATE POLICY "Admins can manage locations" ON locations FOR ALL USING (true);
CREATE POLICY "Admins can manage routes" ON routes FOR ALL USING (true);
CREATE POLICY "Admins can manage cars" ON cars FOR ALL USING (true);
CREATE POLICY "Admins can manage route_prices" ON route_prices FOR ALL USING (true);
CREATE POLICY "Admins can manage direct_bookings" ON direct_bookings FOR ALL USING (true);
CREATE POLICY "Admins can manage cities" ON cities FOR ALL USING (true);
CREATE POLICY "Admins can manage places" ON places FOR ALL USING (true);
CREATE POLICY "Admins can manage trip_requests" ON trip_requests FOR ALL USING (true);
CREATE POLICY "Admins can manage trip_request_places" ON trip_request_places FOR ALL USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (true);
CREATE POLICY "Admins can view notification_log" ON notification_log FOR ALL USING (true);
CREATE POLICY "Admins can manage activity_log" ON activity_log FOR ALL USING (true);
