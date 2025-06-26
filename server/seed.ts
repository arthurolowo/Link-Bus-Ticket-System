import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings } from './schema';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(bookings);
    await db.delete(trips);
    await db.delete(buses);
    await db.delete(routes);
    await db.delete(busTypes);
    await db.delete(users);
    console.log('✅ Existing data cleared successfully!');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      is_admin: true,
      is_verified: true,
    }).returning();

    const [regularUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Regular User',
      email: 'user@example.com',
      password: hashedPassword,
      is_admin: false,
      is_verified: true,
    }).returning();

    console.log('✅ Test users created successfully!');

    // Insert bus types
    const busTypesData = await db.insert(busTypes).values([
      {
        name: 'Executive Coach',
        description: 'Luxury bus with reclining seats, AC, and WiFi',
        amenities: ['Air Conditioning', 'WiFi', 'USB Charging', 'Reclining Seats', 'Refreshments'],
        seatLayout: {
          rows: 10,
          columns: 4,
          seats: Array.from({ length: 40 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'regular' as const,
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 40
      },
      {
        name: 'Standard Coach',
        description: 'Comfortable bus with standard amenities',
        amenities: ['Air Conditioning', 'USB Charging'],
        seatLayout: {
          rows: 12,
          columns: 4,
          seats: Array.from({ length: 48 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'regular' as const,
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 48
      }
    ]).returning();

    console.log('✅ Bus types created successfully!');

    // Insert routes (from and to Kampala)
    const routesData = await db.insert(routes).values([
      {
        origin: 'Kampala',
        destination: 'Mbarara',
        distance: 270,
        estimatedDuration: 240, // 4 hours in minutes
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Gulu',
        distance: 333,
        estimatedDuration: 360, // 6 hours in minutes
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Jinja',
        distance: 80,
        estimatedDuration: 120, // 2 hours in minutes
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Mbale',
        distance: 224,
        estimatedDuration: 300, // 5 hours in minutes
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Fort Portal',
        distance: 294,
        estimatedDuration: 300, // 5 hours in minutes
        isActive: 1
      }
    ]).returning();

    console.log('✅ Routes created successfully!');

    // Insert buses
    const busesData = await db.insert(buses).values([
      {
        busNumber: 'UBA 123K',
        busTypeId: busTypesData[0].id,
        isActive: 1
      },
      {
        busNumber: 'UBB 456L',
        busTypeId: busTypesData[0].id,
        isActive: 1
      },
      {
        busNumber: 'UBC 789M',
        busTypeId: busTypesData[1].id,
        isActive: 1
      },
      {
        busNumber: 'UBD 012N',
        busTypeId: busTypesData[1].id,
        isActive: 1
      }
    ]).returning();

    console.log('✅ Buses created successfully!');

    // Insert trips (for today and the next 7 days)
    const today = new Date();
    const tripData: {
      routeId: number;
      busId: number;
      departureDate: string;
      departureTime: string;
      arrivalTime: string;
      price: string;
      availableSeats: number;
      status: string;
    }[] = [];

    // Add trips for today and next 7 days
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Morning and evening trips for each route
      for (const route of routesData) {
        // Morning trip
        tripData.push({
          routeId: route.id,
          busId: busesData[Math.floor(Math.random() * busesData.length)].id,
          departureDate: dateStr,
          departureTime: '07:00',
          arrivalTime: route.destination === 'Jinja' ? '09:00' : 
                      route.destination === 'Mbarara' ? '11:00' :
                      route.destination === 'Gulu' ? '13:00' :
                      route.destination === 'Mbale' ? '12:00' : '12:00',
          price: route.destination === 'Jinja' ? '30000' : 
                 route.destination === 'Mbarara' ? '50000' :
                 route.destination === 'Gulu' ? '60000' :
                 route.destination === 'Mbale' ? '45000' : '50000',
          availableSeats: 40,
          status: 'scheduled'
        });

        // Evening trip
        tripData.push({
          routeId: route.id,
          busId: busesData[Math.floor(Math.random() * busesData.length)].id,
          departureDate: dateStr,
          departureTime: '14:00',
          arrivalTime: route.destination === 'Jinja' ? '16:00' : 
                      route.destination === 'Mbarara' ? '18:00' :
                      route.destination === 'Gulu' ? '20:00' :
                      route.destination === 'Mbale' ? '19:00' : '19:00',
          price: route.destination === 'Jinja' ? '30000' : 
                 route.destination === 'Mbarara' ? '50000' :
                 route.destination === 'Gulu' ? '60000' :
                 route.destination === 'Mbale' ? '45000' : '50000',
          availableSeats: 40,
          status: 'scheduled'
        });
      }
    }

    await db.insert(trips).values(tripData);
    console.log('✅ Trips created successfully!');

    console.log('✅ All sample data inserted successfully!');
    console.log('\nTest accounts:');
    console.log('Admin - Email: admin@example.com, Password: password123');
    console.log('User  - Email: user@example.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed(); 