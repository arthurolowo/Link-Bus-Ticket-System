-- Database Seed File for Bus Ticket System
-- Drops existing tables, creates new ones, inserts sample data, and adds indexes

-- =========================
-- 1. DROP TABLE STATEMENTS
-- =========================
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
    id VARCHAR(64) PRIMARY KEY, -- Unique user ID
    name VARCHAR(128), -- User's full name
    email VARCHAR(128) NOT NULL, -- User's email address
    password VARCHAR(128), -- Hashed password
    phone VARCHAR(32), -- User's phone number
    is_admin BOOLEAN DEFAULT FALSE, -- Admin status
    is_verified BOOLEAN DEFAULT FALSE, -- Email verification status
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Account creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW() -- Last update timestamp
);

-- Bus types: defines types of buses and their amenities
CREATE TABLE bus_types (
    id SERIAL PRIMARY KEY, -- Unique bus type ID
    name VARCHAR(64) NOT NULL, -- Name of the bus type
    description TEXT, -- Description of the bus type
    amenities JSONB, -- Amenities as JSON
    seat_layout JSONB, -- Seat layout as JSON
    total_seats INTEGER -- Total number of seats
);

-- Routes: stores travel routes
CREATE TABLE routes (
    id SERIAL PRIMARY KEY, -- Unique route ID
    origin VARCHAR(64) NOT NULL, -- Start location
    destination VARCHAR(64) NOT NULL, -- End location
    distance INTEGER, -- Distance in km
    estimated_duration INTEGER, -- Duration in minutes
    is_active INTEGER DEFAULT 1 -- Route active status
);

-- Buses: stores individual buses
CREATE TABLE buses (
    id SERIAL PRIMARY KEY, -- Unique bus ID
    bus_number VARCHAR(32) NOT NULL, -- Bus registration/number
    bus_type_id INTEGER REFERENCES bus_types(id), -- Type of bus
    is_active INTEGER DEFAULT 1 -- Bus active status
);

-- Trips: stores scheduled trips
CREATE TABLE trips (
    id SERIAL PRIMARY KEY, -- Unique trip ID
    route_id INTEGER REFERENCES routes(id), -- Associated route
    bus_id INTEGER REFERENCES buses(id), -- Assigned bus
    departure_date DATE NOT NULL, -- Departure date
    departure_time TIME NOT NULL, -- Departure time
    arrival_time TIME NOT NULL, -- Arrival time
    price VARCHAR(16) NOT NULL, -- Trip price
    available_seats INTEGER, -- Seats left
    status VARCHAR(32) -- Trip status (e.g., scheduled, cancelled)
);

-- Bookings: stores ticket bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY, -- Unique booking ID
    user_id VARCHAR(64) REFERENCES users(id), -- User who booked
    trip_id INTEGER REFERENCES trips(id), -- Trip booked
    seat_number INTEGER, -- Seat number booked
    booking_reference VARCHAR(64) NOT NULL, -- Unique booking reference
    payment_status VARCHAR(32) DEFAULT 'pending', -- Payment status
    total_amount VARCHAR(16), -- Total amount paid
    qr_code VARCHAR(256), -- QR code for ticket
    created_at TIMESTAMPTZ DEFAULT NOW() -- Booking creation timestamp
);

-- =========================
-- 3. SAMPLE DATA INSERTS
-- =========================

-- Users
INSERT INTO users (id, name, email, password, phone, is_admin, is_verified) VALUES
  ('user1', 'Alice Smith', 'alice@example.com', 'hashedpassword1', '1234567890', TRUE, TRUE),
  ('user2', 'Bob Johnson', 'bob@example.com', 'hashedpassword2', '0987654321', FALSE, TRUE);

-- Bus Types
INSERT INTO bus_types (name, description, amenities, seat_layout, total_seats) VALUES
  ('Luxury', 'Luxury coach', '{"wifi":true,"ac":true}', '{"rows":10,"cols":4}', 40),
  ('Standard', 'Standard bus', '{"wifi":false,"ac":false}', '{"rows":12,"cols":4}', 48);

-- Routes
INSERT INTO routes (origin, destination, distance, estimated_duration, is_active) VALUES
  ('City A', 'City B', 200, 180, 1),
  ('City B', 'City C', 150, 120, 1);

-- Buses
INSERT INTO buses (bus_number, bus_type_id, is_active) VALUES
  ('BUS100', 1, 1),
  ('BUS200', 2, 1);

-- Trips
INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
  (1, 1, '2025-06-15', '08:00', '11:00', '25.00', 40, 'scheduled'),
  (2, 2, '2025-06-16', '09:00', '11:00', '20.00', 48, 'scheduled');

-- Bookings
INSERT INTO bookings (user_id, trip_id, seat_number, booking_reference, payment_status, total_amount, qr_code) VALUES
  ('user1', 1, 5, 'REF12345', 'paid', '25.00', 'QRCODE1'),
  ('user2', 2, 10, 'REF67890', 'pending', '20.00', 'QRCODE2');

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

-- =========================
-- 5. END OF SEED FILE
-- =========================
