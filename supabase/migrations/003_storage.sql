-- Storage bucket policies for passport photos and payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('passports', 'passports', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Only authenticated admins can access private files
CREATE POLICY "Admins can upload passports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'passports' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can view passports" ON storage.objects FOR SELECT USING (bucket_id = 'passports' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can upload payment screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can view payment screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');
