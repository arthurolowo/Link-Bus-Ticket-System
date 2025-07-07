import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings, seats } from './schema.js';
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

async function seed() {
  try {
    // Clear existing data
    await db.delete(seats);
    await db.delete(bookings);
    await db.delete(trips);
    await db.delete(buses);
    await db.delete(routes);
    await db.delete(busTypes);
    await db.delete(users);

    console.log('✅ Cleared existing data');

    // Insert admin user
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@linkbus.com',
      password: await bcrypt.hash('admin123', 10),
      phone: '+256700000000',
      is_admin: true,
      is_verified: true,
    }).returning();

    console.log('✅ Admin user created');

    // Insert regular test user
    const [testUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 10),
      phone: '+256700000001',
      is_admin: false,
      is_verified: true,
    }).returning();

    console.log('✅ Test user created');

    // Insert 3 bus types
    const busTypesData = await db.insert(busTypes).values([
      {
        name: 'VIP Executive',
        description: 'Premium luxury coach',
        amenities: ['WiFi', 'AC', 'USB Charging'],
        totalSeats: 30
      },
      {
        name: 'Business Class',
        description: 'Comfortable coach',
        amenities: ['AC', 'USB Charging'],
        totalSeats: 48
      },
      {
        name: 'Economy',
        description: 'Standard coach',
        amenities: ['AC'],
        totalSeats: 56
      }
    ]).returning();

    console.log('✅ Bus types created');

    // Insert 7 routes
    const routesData = await db.insert(routes).values([
      {
        origin: 'Kampala',
        destination: 'Mbarara',
        distance: 266,
        estimatedDuration: 300,
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Gulu',
        distance: 333,
        estimatedDuration: 360,
        isActive: 1
      },
      {
        origin: 'Mbarara',
        destination: 'Kampala',
        distance: 266,
        estimatedDuration: 300,
        isActive: 1
      },
      {
        origin: 'Gulu',
        destination: 'Kampala',
        distance: 333,
        estimatedDuration: 360,
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Fort Portal',
        distance: 297,
        estimatedDuration: 360,
        isActive: 1
      },
      {
        origin: 'Fort Portal',
        destination: 'Kampala',
        distance: 297,
        estimatedDuration: 360,
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Jinja',
        distance: 80,
        estimatedDuration: 120,
        isActive: 1
      }
    ]).returning();

    console.log('✅ Routes created');

    // Create 10 buses
    const busesData = await db.insert(buses).values([
      { busNumber: 'VIP-001', busTypeId: busTypesData[0].id, isActive: 1 },
      { busNumber: 'VIP-002', busTypeId: busTypesData[0].id, isActive: 1 },
      { busNumber: 'VIP-003', busTypeId: busTypesData[0].id, isActive: 1 },
      { busNumber: 'BUS-001', busTypeId: busTypesData[1].id, isActive: 1 },
      { busNumber: 'BUS-002', busTypeId: busTypesData[1].id, isActive: 1 },
      { busNumber: 'BUS-003', busTypeId: busTypesData[1].id, isActive: 1 },
      { busNumber: 'ECO-001', busTypeId: busTypesData[2].id, isActive: 1 },
      { busNumber: 'ECO-002', busTypeId: busTypesData[2].id, isActive: 1 },
      { busNumber: 'ECO-003', busTypeId: busTypesData[2].id, isActive: 1 },
      { busNumber: 'ECO-004', busTypeId: busTypesData[2].id, isActive: 1 }
    ]).returning();

    console.log('✅ Buses created');

    // Create 15 trips for the next 5 days
    const today = new Date();
    const tripsList = [];
    
    for (let i = 0; i < 15; i++) {
      const dayOffset = Math.floor(i / 3); // Spread 3 trips per day over 5 days
      const tripDate = new Date();
      tripDate.setDate(today.getDate() + dayOffset + 1); // Start from tomorrow
      
      const routeIndex = i % routesData.length;
      const busIndex = i % busesData.length;
      const route = routesData[routeIndex];
      const bus = busesData[busIndex];
      
      // Set departure times at 7:00, 11:00, and 15:00
      const hour = 7 + (i % 3) * 4;
      const departureTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Calculate arrival time based on route duration
      const duration = route.estimatedDuration || 0;
      const arrivalHour = (hour + Math.floor(duration / 60)) % 24;
      const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:00`;

      // Calculate price based on distance and bus type
      const baseRate = bus.busTypeId === busTypesData[0].id ? 300 : // VIP
                      bus.busTypeId === busTypesData[1].id ? 250 : // Business
                      200; // Economy
      const distance = route.distance || 0;
      const price = Math.ceil((distance * baseRate) / 1000) * 1000;

      tripsList.push({
        routeId: route.id,
        busId: bus.id,
        departureDate: tripDate.toISOString().split('T')[0],
        departureTime,
        arrivalTime,
        price: price.toString(),
        availableSeats: busTypesData.find(bt => bt.id === bus.busTypeId)?.totalSeats || 0,
        status: 'scheduled'
      });
    }

    const tripsData = await db.insert(trips).values(tripsList).returning();
    console.log('✅ Trips created');

    await pool.end();
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 