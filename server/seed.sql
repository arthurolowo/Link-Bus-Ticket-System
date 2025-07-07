-- Database Seed File for Link Bus Services
-- Drops existing tables, creates new ones, inserts real data, and adds indexes

-- =========================
-- 1. DROP TABLE STATEMENTS
-- =========================
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS bus_types;
DROP TABLE IF EXISTS users;

-- =========================
-- 2. CREATE TABLE STATEMENTS
-- =========================

-- Users table: stores user information
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128),
    email VARCHAR(128) NOT NULL,
    password VARCHAR(128),
    phone VARCHAR(32),
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bus types: defines types of buses and their amenities
CREATE TABLE bus_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    amenities JSONB,
    seat_layout JSONB,
    total_seats INTEGER
);

-- Routes: stores travel routes
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT NULL,
    distance INTEGER,
    estimated_duration INTEGER,
    is_active INTEGER DEFAULT 1
);

-- Buses: stores individual buses
CREATE TABLE buses (
    id SERIAL PRIMARY KEY,
    bus_number VARCHAR(32) NOT NULL,
    bus_type_id INTEGER REFERENCES bus_types(id),
    is_active INTEGER DEFAULT 1
);

-- Trips: stores scheduled trips
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    bus_id INTEGER REFERENCES buses(id),
    departure_date VARCHAR(10) NOT NULL,
    departure_time VARCHAR(5) NOT NULL,
    arrival_time VARCHAR(5) NOT NULL,
    price VARCHAR(16) NOT NULL,
    available_seats INTEGER,
    status VARCHAR(32) DEFAULT 'scheduled'
);

-- Bookings: stores ticket bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id),
    trip_id INTEGER REFERENCES trips(id),
    booking_reference VARCHAR(64) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'pending',
    total_amount VARCHAR(16),
    qr_code VARCHAR(256),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seats: stores seat assignments for bookings
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_booking_seat UNIQUE(booking_id, seat_number)
);

-- Payments: stores payment information
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    amount VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    external_reference VARCHAR(50),
    phone_number VARCHAR(20),
    payment_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 3. SAMPLE DATA INSERTS
-- =========================

-- Bus Types with real amenities
INSERT INTO bus_types (name, description, amenities, seat_layout, total_seats) VALUES
    ('VIP Executive', 'Luxury coach with premium amenities', 
    '["Air Conditioning", "WiFi", "USB Charging", "Reclining Seats", "Entertainment System", "Refreshments", "Onboard Toilet"]'::jsonb,
    '{"rows": 13, "columns": 4, "layout": "2-2"}'::jsonb, 
    49),
    
    ('Business Class', 'Comfortable coach with essential amenities',
    '["Air Conditioning", "WiFi", "USB Charging", "Reclining Seats", "Onboard Toilet"]'::jsonb,
    '{"rows": 13, "columns": 4, "layout": "2-2"}'::jsonb,
    49),
    
    ('Standard Plus', 'Standard coach with basic amenities',
    '["Air Conditioning", "USB Charging", "Comfortable Seats"]'::jsonb,
    '{"rows": 14, "columns": 4, "layout": "2-2"}'::jsonb,
    54);

-- Routes with real distances and durations
INSERT INTO routes (origin, destination, distance, estimated_duration, is_active) VALUES
    ('Kampala', 'Mbarara', 266, 240, 1),
    ('Kampala', 'Fort Portal', 294, 300, 1),
    ('Kampala', 'Gulu', 333, 360, 1),
    ('Kampala', 'Kabale', 426, 420, 1),
    ('Kampala', 'Masaka', 120, 150, 1),
    ('Mbarara', 'Kampala', 266, 240, 1),
    ('Fort Portal', 'Kampala', 294, 300, 1),
    ('Gulu', 'Kampala', 333, 360, 1),
    ('Kabale', 'Kampala', 426, 420, 1),
    ('Masaka', 'Kampala', 120, 150, 1);

-- Buses with real registration numbers
INSERT INTO buses (bus_number, bus_type_id, is_active) VALUES
    ('UAX 123K', 1, 1),
    ('UAX 456L', 1, 1),
    ('UAY 789M', 2, 1),
    ('UAY 321N', 2, 1),
    ('UAZ 654P', 3, 1),
    ('UAZ 987Q', 3, 1);

-- Trips with realistic schedules and pricing
-- Note: Using future dates to ensure trips are valid
INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
    -- Kampala to Mbarara (VIP)
    (1, 1, '2024-03-25', '07:00', '11:00', '60000', 49, 'scheduled'),
    (1, 2, '2024-03-25', '09:00', '13:00', '60000', 49, 'scheduled'),
    
    -- Kampala to Fort Portal (Business)
    (2, 3, '2024-03-25', '08:00', '13:00', '45000', 49, 'scheduled'),
    (2, 4, '2024-03-25', '10:00', '15:00', '45000', 49, 'scheduled'),
    
    -- Kampala to Gulu (Standard Plus)
    (3, 5, '2024-03-25', '06:00', '12:00', '40000', 54, 'scheduled'),
    (3, 6, '2024-03-25', '08:00', '14:00', '40000', 54, 'scheduled'),
    
    -- Return trips
    (6, 1, '2024-03-25', '14:00', '18:00', '60000', 49, 'scheduled'),
    (7, 3, '2024-03-25', '16:00', '21:00', '45000', 49, 'scheduled'),
    (8, 5, '2024-03-25', '15:00', '21:00', '40000', 54, 'scheduled');

-- =========================
-- 4. INDEXES
-- =========================

-- Index for fast user lookup by email
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Indexes for foreign keys and frequent queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_trips_route_id ON trips(route_id);
CREATE INDEX idx_trips_bus_id ON trips(bus_id);
CREATE INDEX idx_buses_bus_type_id ON buses(bus_type_id);
CREATE INDEX idx_seats_booking_id ON seats(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- Unique constraint for seat numbers within a booking
CREATE UNIQUE INDEX idx_unique_booking_seat ON seats(booking_id, seat_number);

-- =========================
-- 5. END OF SEED FILE
-- =========================
