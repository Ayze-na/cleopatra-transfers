-- Cleopatra Transfers Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations (airports, cities, areas, sites)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('airport', 'city', 'hotel_area', 'site')),
  city_id UUID,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  to_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_location_id, to_location_id)
);

-- Cars
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL,
  description JSONB,
  images TEXT[],
  max_passengers INTEGER NOT NULL,
  max_luggage INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route prices per currency
CREATE TABLE route_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EGP', 'EUR')),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_id, car_id, currency)
);

-- Direct bookings
CREATE TABLE direct_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  route_id UUID REFERENCES routes(id),
  car_id UUID REFERENCES cars(id),
  trip_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  hotel_text TEXT,
  passengers INTEGER NOT NULL,
  luggage INTEGER NOT NULL DEFAULT 0,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  nationality TEXT NOT NULL,
  passport_file_path TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer')),
  payment_screenshot_path TEXT,
  payment_status TEXT DEFAULT 'cash_on_ride' CHECK (payment_status IN ('cash_on_ride', 'awaiting_verification', 'verified', 'rejected')),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EGP', 'EUR')),
  price_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  reject_reason TEXT,
  admin_notes TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL,
  description JSONB,
  cover_image TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  description JSONB,
  image TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip requests
CREATE TABLE trip_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  days INTEGER NOT NULL,
  passengers INTEGER NOT NULL,
  luggage INTEGER NOT NULL DEFAULT 0,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  nationality TEXT NOT NULL,
  passport_file_path TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled', 'completed')),
  agreed_price DECIMAL(10,2),
  agreed_currency TEXT CHECK (agreed_currency IN ('USD', 'EGP', 'EUR')),
  admin_notes TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip request places
CREATE TABLE trip_request_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id),
  city_name_snapshot JSONB,
  place_name_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification log
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  related_booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_direct_bookings_status ON direct_bookings(status);
CREATE INDEX idx_direct_bookings_created ON direct_bookings(created_at);
CREATE INDEX idx_trip_requests_status ON trip_requests(status);
CREATE INDEX idx_trip_requests_created ON trip_requests(created_at);

-- Generate reference functions
CREATE OR REPLACE FUNCTION generate_direct_booking_ref()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM direct_bookings;
  NEW.reference := 'CT-D-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_trip_request_ref()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM trip_requests;
  NEW.reference := 'CT-T-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_direct_booking_ref
  BEFORE INSERT ON direct_bookings
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_direct_booking_ref();

CREATE TRIGGER set_trip_request_ref
  BEFORE INSERT ON trip_requests
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_trip_request_ref();
