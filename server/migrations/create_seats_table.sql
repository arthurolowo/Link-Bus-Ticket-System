-- Create seats table if it doesn't exist
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking_seat UNIQUE(booking_id, seat_number)
); 