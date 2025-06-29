import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings } from './schema.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  try {
    // Clear existing data
    await db.delete(bookings);
    await db.delete(trips);
    await db.delete(buses);
    await db.delete(routes);
    await db.delete(busTypes);
    await db.delete(users);

    console.log('✅ Cleared existing data');

    // Insert admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@linkbus.com',
      password: hashedPassword,
      phone: '0700000000',
      is_admin: true,
      is_verified: true,
    }).returning();

    // Insert regular user
    const [regularUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'John Doe',
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      phone: '0700000001',
      is_admin: false,
      is_verified: true,
    }).returning();

    console.log('✅ Users created successfully!');

    // Insert bus types with various configurations
    const busTypesData = await db.insert(busTypes).values([
      {
        name: 'Executive Coach',
        description: 'Luxury bus with reclining seats, AC, and WiFi',
        amenities: ['Air Conditioning', 'WiFi', 'USB Charging', 'Reclining Seats', 'Refreshments', 'Entertainment System'],
        seatLayout: {
          rows: 10,
          columns: 4,
          seats: Array.from({ length: 40 }, (_, i) => ({
            number: `${i + 1}`,
            type: i < 8 ? ('premium' as const) : ('regular' as const),
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 40
      },
      {
        name: 'Standard Coach',
        description: 'Comfortable bus with standard amenities',
        amenities: ['Air Conditioning', 'USB Charging', 'Standard Seats'],
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
      },
      {
        name: 'VIP Shuttle',
        description: 'Premium minibus with extra comfort',
        amenities: ['Air Conditioning', 'WiFi', 'USB Charging', 'Premium Seats', 'Refreshments', 'Personal TV'],
        seatLayout: {
          rows: 6,
          columns: 3,
          seats: Array.from({ length: 18 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'premium' as const,
            position: { row: Math.floor(i / 3) + 1, column: (i % 3) + 1 }
          }))
        },
        totalSeats: 18
      },
      {
        name: 'Economy Bus',
        description: 'Affordable transportation option',
        amenities: ['Standard Seats', 'Basic Air Conditioning'],
        seatLayout: {
          rows: 15,
          columns: 4,
          seats: Array.from({ length: 60 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'regular' as const,
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 60
      }
    ]).returning();

    console.log('✅ Bus types created successfully!');

    // Insert routes with realistic distances and durations
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
      },
      {
        origin: 'Mbarara',
        destination: 'Kabale',
        distance: 140,
        estimatedDuration: 180, // 3 hours in minutes
        isActive: 1
      },
      {
        origin: 'Jinja',
        destination: 'Mbale',
        distance: 144,
        estimatedDuration: 180, // 3 hours in minutes
        isActive: 1
      }
    ]).returning();

    console.log('✅ Routes created successfully!');

    // Insert buses for each type
    const busesData = await db.insert(buses).values([
      {
        busNumber: 'UBA 123K',
        busTypeId: busTypesData[0].id, // Executive Coach
        isActive: 1
      },
      {
        busNumber: 'UBB 456L',
        busTypeId: busTypesData[0].id, // Executive Coach
        isActive: 1
      },
      {
        busNumber: 'UBC 789M',
        busTypeId: busTypesData[1].id, // Standard Coach
        isActive: 1
      },
      {
        busNumber: 'UBD 012N',
        busTypeId: busTypesData[1].id, // Standard Coach
        isActive: 1
      },
      {
        busNumber: 'UBE 345P',
        busTypeId: busTypesData[2].id, // VIP Shuttle
        isActive: 1
      },
      {
        busNumber: 'UBF 678Q',
        busTypeId: busTypesData[2].id, // VIP Shuttle
        isActive: 1
      },
      {
        busNumber: 'UBG 901R',
        busTypeId: busTypesData[3].id, // Economy Bus
        isActive: 1
      },
      {
        busNumber: 'UBH 234S',
        busTypeId: busTypesData[3].id, // Economy Bus
        isActive: 1
      }
    ]).returning();

    console.log('✅ Buses created successfully!');

    // Insert trips for the next 7 days
    const today = new Date();
    const tripData = [];
    
    // Price ranges based on bus type and distance
    const getPriceForRoute = (routeDistance: number, busTypeId: number) => {
      const baseRate = busTypeId === busTypesData[0].id ? 300 : // Executive
                      busTypeId === busTypesData[1].id ? 200 : // Standard
                      busTypeId === busTypesData[2].id ? 400 : // VIP
                      150; // Economy
      return (baseRate * routeDistance).toString();
    };

    // Create trips for each route with different bus types
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      for (const route of routesData) {
        // Morning trip with Executive/VIP
        tripData.push({
          routeId: route.id,
          busId: busesData[Math.floor(Math.random() * 2)].id, // Executive or VIP
          departureDate: dateStr,
          departureTime: '07:00',
          arrivalTime: new Date(date.getTime() + (route.estimatedDuration || 0) * 60000).toTimeString().slice(0, 5),
          price: getPriceForRoute(route.distance || 0, busTypesData[0].id),
          availableSeats: busTypesData[0].totalSeats,
          status: 'scheduled'
        });

        // Afternoon trip with Standard
        tripData.push({
          routeId: route.id,
          busId: busesData[2 + Math.floor(Math.random() * 2)].id, // Standard
          departureDate: dateStr,
          departureTime: '14:00',
          arrivalTime: new Date(date.getTime() + (route.estimatedDuration || 0) * 60000).toTimeString().slice(0, 5),
          price: getPriceForRoute(route.distance || 0, busTypesData[1].id),
          availableSeats: busTypesData[1].totalSeats,
          status: 'scheduled'
        });

        // Evening trip with Economy
        tripData.push({
          routeId: route.id,
          busId: busesData[6 + Math.floor(Math.random() * 2)].id, // Economy
          departureDate: dateStr,
          departureTime: '20:00',
          arrivalTime: new Date(date.getTime() + (route.estimatedDuration || 0) * 60000).toTimeString().slice(0, 5),
          price: getPriceForRoute(route.distance || 0, busTypesData[3].id),
          availableSeats: busTypesData[3].totalSeats,
          status: 'scheduled'
        });
      }
    }

    const tripsData = await db.insert(trips).values(tripData).returning();

    console.log('✅ Trips created successfully!');

    // Insert some sample bookings
    const bookingData = [];
    const paymentStatuses = ['completed', 'pending', 'failed'];
    const seatNumbers = Array.from({ length: 10 }, (_, i) => i + 1);

    for (const trip of tripsData.slice(0, 10)) { // Create bookings for first 10 trips
      const numBookings = Math.floor(Math.random() * 5) + 1; // 1-5 bookings per trip
      
      for (let i = 0; i < numBookings; i++) {
        bookingData.push({
          userId: i % 2 === 0 ? adminUser.id : regularUser.id,
          tripId: trip.id,
          seatNumber: seatNumbers[i],
          bookingReference: `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
          paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
          totalAmount: trip.price,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOOKING-${Date.now()}`,
        });
      }
    }

    await db.insert(bookings).values(bookingData);

    console.log('✅ Bookings created successfully!');
    console.log('✅ Seed completed successfully!');
    console.log('\nTest accounts:');
    console.log('Admin - Email: admin@linkbus.com, Password: admin123');
    console.log('User  - Email: john@example.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seed().catch(console.error); 