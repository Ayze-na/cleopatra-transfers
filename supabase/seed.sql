-- Seed data for Cleopatra Transfers

-- Locations
INSERT INTO locations (id, name, type, active, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', '{"en":"Hurghada Airport (HRG)","ar":"مطار الغردقة"}', 'airport', true, 1),
('22222222-2222-2222-2222-222222222222', '{"en":"Hurghada City","ar":"مدينة الغردقة"}', 'city', true, 2),
('33333333-3333-3333-3333-333333333333', '{"en":"Luxor Airport (LXR)","ar":"مطار الأقصر"}', 'airport', true, 3),
('44444444-4444-4444-4444-444444444444', '{"en":"Luxor City","ar":"مدينة الأقصر"}', 'city', true, 4),
('55555555-5555-5555-5555-555555555555', '{"en":"Aswan Airport (ASW)","ar":"مطار أسوان"}', 'airport', true, 5),
('66666666-6666-6666-6666-666666666666', '{"en":"Aswan City","ar":"مدينة أسوان"}', 'city', true, 6),
('77777777-7777-7777-7777-777777777777', '{"en":"Marsa Alam Airport (RMF)","ar":"مطار مرسى علم"}', 'airport', true, 7),
('88888888-8888-8888-8888-888888888888', '{"en":"Marsa Alam City","ar":"مدينة مرسى علم"}', 'city', true, 8),
('99999999-9999-9999-9999-999999999999', '{"en":"Abu Simbel Temple","ar":"معبد أبو سمبل"}', 'site', true, 9);

-- Cars
INSERT INTO cars (id, name, description, max_passengers, max_luggage, active, sort_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"en":"Sedan","ar":"سيدان"}', '{"en":"Comfortable sedan for up to 4 passengers","ar":"سيدان مريح حتى 4 ركاب"}', 4, 2, true, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"en":"SUV","ar":"سيارة دفع رباعي"}', '{"en":"Spacious SUV for up to 6 passengers","ar":"سيارة دفع رباعي واسعة حتى 6 ركاب"}', 6, 4, true, 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '{"en":"Van","ar":"فان"}', '{"en":"Large van for up to 8 passengers","ar":"فان كبير حتى 8 ركاب"}', 8, 6, true, 3);

-- Cities (Trip File)
INSERT INTO cities (id, name, description, active, sort_order) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '{"en":"Hurghada","ar":"الغردقة"}', '{"en":"Red Sea resort city","ar":"مدينة منتجعات البحر الأحمر"}', true, 1),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"en":"Luxor","ar":"الأقصر"}', '{"en":"Ancient capital of Egypt","ar":"العاصمة القديمة لمصر"}', true, 2),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '{"en":"Aswan","ar":"أسوان"}', '{"en":"Southern gateway to Nubia","ar":"البوابة الجنوبية لنوبيا"}', true, 3),
('10101010-1010-1010-1010-101010101010', '{"en":"Marsa Alam","ar":"مرسى علم"}', '{"en":"Diving destination","ar":"وجهة غوص"}', true, 4);

-- Places
INSERT INTO places (id, city_id, name, description, active, sort_order) VALUES
('11111111-aaaa-bbbb-cccc-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"en":"Giftun Island","ar":"جزيرة جفتون"}', '{"en":"Snorkeling paradise","ar":"جنة الغطس"}', true, 1),
('22222222-aaaa-bbbb-cccc-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"en":"Desert Safari","ar":"сафари الصحراء"}', '{"en":"Bedouin experience","ar":"تجربة بدوية"}', true, 2),
('33333333-aaaa-bbbb-cccc-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"en":"Karnak Temple","ar":"معبد Karnak"}', '{"en":"Massive temple complex","ar":"مجمع معابد ضخم"}', true, 1),
('44444444-aaaa-bbbb-cccc-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"en":"Valley of the Kings","ar":"وادي الملوك"}', '{"en":"Royal tombs","ar":"مقابر ملكية"}', true, 2),
('55555555-aaaa-bbbb-cccc-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '{"en":"Abu Simbel Temple","ar":"معبد أبو سمبل"}', '{"en":"Rock-cut temples","ar":"معابد منحوتة في الصخر"}', true, 1),
('66666666-aaaa-bbbb-cccc-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '{"en":"Philae Temple","ar":"معبد فيلة"}', '{"en":"Island temple","ar":"معبد جزيرة"}', true, 2),
('77777777-aaaa-bbbb-cccc-777777777777', '10101010-1010-1010-1010-101010101010', '{"en":"Dolphin House","ar":"بيت الدلافين"}', '{"en":"Swim with dolphins","ar":"السباحة مع الدلافين"}', true, 1);

-- Routes (airport to city + city to city + Aswan to Abu Simbel)
INSERT INTO routes (from_location_id, to_location_id, active) VALUES
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',true),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',true),
('33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444',true),
('44444444-4444-4444-4444-444444444444','33333333-3333-3333-3333-333333333333',true),
('55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666',true),
('66666666-6666-6666-6666-666666666666','55555555-5555-5555-5555-555555555555',true),
('77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888888',true),
('88888888-8888-8888-8888-888888888888','77777777-7777-7777-7777-777777777777',true),
('66666666-6666-6666-6666-666666666666','99999999-9999-9999-9999-999999999999',true),
('99999999-9999-9999-9999-999999999999','66666666-6666-6666-6666-666666666666',true);

-- Route prices (route x car x currency)
INSERT INTO route_prices (route_id, car_id, currency, amount)
SELECT r.id, c.id, cur.currency, cur.amount
FROM routes r
CROSS JOIN cars c
CROSS JOIN (VALUES ('USD', 50), ('EGP', 1500), ('EUR', 45)) AS cur(currency, amount);
