-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seats_booking_id ON seats(booking_id);

-- Add unique constraint to prevent duplicate seats for same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_seat ON seats(booking_id, seat_number);

-- Drop the seat_number column from bookings as it's now in seats table
ALTER TABLE bookings DROP COLUMN IF EXISTS seat_number; 