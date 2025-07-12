import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings, seats, payments } from './schema.js';
import { type Trip, type InsertBooking } from './schema.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bus_ticket_system'
});

const db = drizzle(pool);

async function checkIfDatabaseIsEmpty(): Promise<boolean> {
  try {
    // Check if users table exists and has data
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    
    if (result.rows[0]?.count === '0') {
      console.log('📋 Database is empty - tables do not exist');
      return true;
    }
    
    // Check if users table has any data
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const hasUsers = parseInt(userCount.rows[0]?.count || '0') > 0;
    
    if (hasUsers) {
      console.log('🚫 Database contains data - will not seed to prevent data loss');
      return false;
    }
    
    console.log('📋 Database tables exist but are empty - safe to seed');
    return true;
  } catch (error) {
    console.log('📋 Database appears to be empty (tables not created) - safe to seed');
    return true;
  }
}

async function createTablesIfNotExist() {
  console.log('🔄 Creating database tables if they don\'t exist...');
  
  // Create tables with proper structure (only if they don't exist)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128),
      email VARCHAR(128) NOT NULL,
      password VARCHAR(128),
      phone VARCHAR(32),
      is_admin BOOLEAN DEFAULT FALSE,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bus_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      description TEXT,
      amenities JSONB,
      seat_layout JSONB,
      total_seats INTEGER
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      origin VARCHAR(64) NOT NULL,
      destination VARCHAR(64) NOT NULL,
      distance INTEGER,
      estimated_duration INTEGER,
      is_active INTEGER DEFAULT 1
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS buses (
      id SERIAL PRIMARY KEY,
      bus_number VARCHAR(32) NOT NULL,
      bus_type_id INTEGER REFERENCES bus_types(id),
      is_active INTEGER DEFAULT 1
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      route_id INTEGER REFERENCES routes(id),
      bus_id INTEGER REFERENCES buses(id),
      departure_date VARCHAR(10) NOT NULL,
      departure_time VARCHAR(5) NOT NULL,
      arrival_time VARCHAR(5) NOT NULL,
      price VARCHAR(16) NOT NULL,
      fare VARCHAR(16) NOT NULL,
      available_seats INTEGER,
      status VARCHAR(32) DEFAULT 'scheduled'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id),
      trip_id INTEGER REFERENCES trips(id),
      booking_reference VARCHAR(64) NOT NULL,
      payment_status VARCHAR(32) DEFAULT 'pending',
      status VARCHAR(32) DEFAULT 'pending',
      total_amount VARCHAR(16),
      qr_code VARCHAR(256),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      seat_number INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_booking_seat UNIQUE(booking_id, seat_number)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payments (
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
    )
  `);

  console.log('✅ Database tables created/verified');
}

async function createIndexes() {
  console.log('🔄 Creating database indexes...');
  
  // Create indexes for performance (only if they don't exist)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_buses_bus_type_id ON buses(bus_type_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_seats_booking_id ON seats(booking_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)`);

  console.log('✅ Database indexes created/verified');
}

async function seedData() {
  console.log('🔄 Seeding initial data...');
  
  // Insert admin user
  const adminUserId = uuidv4();
  const adminPassword = await bcrypt.hash('SecureAdmin123!', 12);
  await db.execute(sql`
    INSERT INTO users (id, name, email, password, phone, is_admin, is_verified) 
    VALUES (${adminUserId}, 'Admin User', 'admin@linkbus.com', ${adminPassword}, '+256700000000', true, true)
  `);

  console.log('✅ Admin user created');

  // Insert regular test user
  const testUserId = uuidv4();
  const testPassword = await bcrypt.hash('TestUser123!', 12);
  await db.execute(sql`
    INSERT INTO users (id, name, email, password, phone, is_admin, is_verified) 
    VALUES (${testUserId}, 'Test User', 'test@example.com', ${testPassword}, '+256700000001', false, true)
  `);

  console.log('✅ Test user created');

  // Insert bus types with rich amenities and seat layouts
  await db.execute(sql`
    INSERT INTO bus_types (name, description, amenities, seat_layout, total_seats) VALUES
    ('VIP Executive', 'Luxury coach with premium amenities', 
     '["Air Conditioning", "WiFi", "USB Charging", "Reclining Seats", "Entertainment System", "Refreshments", "Onboard Toilet"]'::jsonb,
     '{"rows": 13, "columns": 4, "layout": "2-2"}'::jsonb, 
     49),
    ('Business Class', 'Comfortable coach with essential amenities',
     '["Air Conditioning", "WiFi", "USB Charging", "Reclining Seats", "Onboard Toilet"]'::jsonb,
     '{"rows": 13, "columns": 4, "layout": "2-2"}'::jsonb,
     49),
    ('Economy', 'Budget-friendly coach with basic amenities',
     '["Air Conditioning", "Comfortable Seats"]'::jsonb,
     '{"rows": 15, "columns": 4, "layout": "2-2"}'::jsonb,
     58)
  `);

  console.log('✅ Bus types created');

  // Insert routes with real distances and durations
  await db.execute(sql`
    INSERT INTO routes (origin, destination, distance, estimated_duration, is_active) VALUES
    ('Kampala', 'Mbarara', 266, 240, 1),
    ('Kampala', 'Fort Portal', 294, 300, 1),
    ('Kampala', 'Gulu', 333, 360, 1),
    ('Kampala', 'Kabale', 426, 420, 1),
    ('Kampala', 'Masaka', 120, 150, 1),
    ('Kampala', 'Jinja', 80, 120, 1),
    ('Mbarara', 'Kampala', 266, 240, 1),
    ('Fort Portal', 'Kampala', 294, 300, 1),
    ('Gulu', 'Kampala', 333, 360, 1),
    ('Kabale', 'Kampala', 426, 420, 1),
    ('Masaka', 'Kampala', 120, 150, 1),
    ('Jinja', 'Kampala', 80, 120, 1)
  `);

  console.log('✅ Routes created');

  // Insert buses with real registration numbers
  await db.execute(sql`
    INSERT INTO buses (bus_number, bus_type_id, is_active) VALUES
    ('UAX 123K', 1, 1),
    ('UAX 456L', 1, 1),
    ('UAX 789M', 1, 1),
    ('UAY 321N', 2, 1),
    ('UAY 654P', 2, 1),
    ('UAY 987Q', 2, 1),
    ('UAZ 111R', 3, 1),
    ('UAZ 222S', 3, 1),
    ('UAZ 333T', 3, 1),
    ('UAZ 444U', 3, 1)
  `);

  console.log('✅ Buses created');

  // Create trips for the entire month of July 2025
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (6 = July)
  const tripInserts = [];
  
  // Define trip patterns
  const routes = [
    { id: 1, distance: 266, duration: 240 },  // Kampala to Mbarara
    { id: 2, distance: 294, duration: 300 },  // Kampala to Fort Portal
    { id: 3, distance: 333, duration: 360 },  // Kampala to Gulu
    { id: 4, distance: 426, duration: 420 },  // Kampala to Kabale
    { id: 5, distance: 120, duration: 150 },  // Kampala to Masaka
    { id: 6, distance: 80, duration: 120 },   // Kampala to Jinja
    { id: 7, distance: 266, duration: 240 },  // Mbarara to Kampala
    { id: 8, distance: 294, duration: 300 },  // Fort Portal to Kampala
    { id: 9, distance: 333, duration: 360 },  // Gulu to Kampala
    { id: 10, distance: 426, duration: 420 }, // Kabale to Kampala
    { id: 11, distance: 120, duration: 150 }, // Masaka to Kampala
    { id: 12, distance: 80, duration: 120 },  // Jinja to Kampala
  ];
  
  const buses = [
    { id: 1, typeId: 1, seats: 49 },  // VIP Executive
    { id: 2, typeId: 1, seats: 49 },  // VIP Executive
    { id: 4, typeId: 2, seats: 49 },  // Business Class
    { id: 5, typeId: 2, seats: 49 },  // Business Class
    { id: 7, typeId: 3, seats: 58 },  // Economy
    { id: 8, typeId: 3, seats: 58 },  // Economy
    { id: 9, typeId: 3, seats: 58 },  // Economy
    { id: 10, typeId: 3, seats: 58 }, // Economy
  ];
  
  // Generate trips for July 2025 (from today onwards if we're in July, otherwise full month)
  let startDate, endDate;
  
  if (currentMonth === 6) { // Currently in July (0-indexed)
    // Start from today, go to end of July
    startDate = new Date(today);
    endDate = new Date(currentYear, 6, 31); // July 31st
  } else if (currentMonth < 6) {
    // Before July, generate full July
    startDate = new Date(currentYear, 6, 1); // July 1st
    endDate = new Date(currentYear, 6, 31); // July 31st
  } else {
    // After July, generate for next year's July
    startDate = new Date(currentYear + 1, 6, 1); // July 1st next year
    endDate = new Date(currentYear + 1, 6, 31); // July 31st next year
  }
  
  // Generate trips for each day in July
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Generate more trips on weekends (Friday-Sunday) and fewer on weekdays
    const tripsPerDay = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 12 : 8;
    
    for (let tripIndex = 0; tripIndex < tripsPerDay; tripIndex++) {
      const route = routes[tripIndex % routes.length];
      const bus = buses[tripIndex % buses.length];
      
      // Set departure times throughout the day
      let departureHour;
      if (tripsPerDay === 12) {
        // Weekend schedule: 05:00, 06:30, 08:00, 09:30, 11:00, 12:30, 14:00, 15:30, 17:00, 18:30, 20:00, 21:30
        const weekendHours = [5, 6.5, 8, 9.5, 11, 12.5, 14, 15.5, 17, 18.5, 20, 21.5];
        departureHour = weekendHours[tripIndex % weekendHours.length];
      } else {
        // Weekday schedule: 05:00, 07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00
        departureHour = 5 + (tripIndex * 2);
      }
      
      const hour = Math.floor(departureHour);
      const minute = Math.floor((departureHour - hour) * 60);
      const departureTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Calculate arrival time
      const totalMinutes = hour * 60 + minute + route.duration;
      const arrivalHour = Math.floor(totalMinutes / 60) % 24;
      const arrivalMinute = totalMinutes % 60;
      const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`;
      
      // Calculate price based on distance and bus type
      const baseRate = bus.typeId === 1 ? 350 : // VIP Executive
                      bus.typeId === 2 ? 250 : // Business Class
                      150; // Economy
      const price = Math.ceil((route.distance * baseRate) / 1000) * 1000;
      
      // Calculate fare (could be different from price - e.g., with taxes, fees, etc.)
      const fare = price; // For now, fare equals price
      
      tripInserts.push(`(${route.id}, ${bus.id}, '${dateString}', '${departureTime}', '${arrivalTime}', '${price}', '${fare}', ${bus.seats}, 'scheduled')`);
    }
  }
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  console.log(`📅 Generating trips for ${totalDays} days in July ${startDate.getFullYear()}`);
  console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`🚌 Total trips to be created: ${tripInserts.length}`);
  
  // Insert all trips at once
  await db.execute(sql`
    INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, fare, available_seats, status) 
    VALUES ${sql.raw(tripInserts.join(', '))}
  `);
  
  console.log('✅ Trips created for the month of July');
}

async function safeSeed() {
  try {
    console.log('🔄 Starting SAFE database seed...');
    
    // Check if database is empty
    const isEmpty = await checkIfDatabaseIsEmpty();
    
    if (!isEmpty) {
      console.log('🚫 ABORTED: Database contains data. Seed will not run to prevent data loss.');
      console.log('💡 If you want to reset the database, manually drop tables first.');
      await pool.end();
      process.exit(0);
    }
    
    // Create tables and indexes
    await createTablesIfNotExist();
    await createIndexes();
    
    // Seed initial data
    await seedData();

    await pool.end();
    console.log('✅ SAFE database seed completed successfully!');
    console.log('📊 Summary:');
    console.log('  - Created all tables with proper indexes');
    console.log('  - Added 2 test users (admin & regular user)');
    console.log('  - Added 3 bus types: VIP Executive, Business Class, Economy');
    console.log('  - Added 12 routes covering major Uganda cities');
    console.log('  - Added 10 buses (3 VIP, 3 Business, 4 Economy)');
    console.log('  - Created trips for the entire month of July (8 trips/weekday, 12 trips/weekend)');
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('  Admin: admin@linkbus.com / SecureAdmin123!');
    console.log('  User:  test@example.com / TestUser123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await pool.end();
    process.exit(1);
  }
}

safeSeed(); 