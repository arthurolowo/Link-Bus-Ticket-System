import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings } from './schema.js';
import { type Trip, type InsertBooking } from './schema.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'bus_ticket_system'
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

    // Insert single admin user
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Mukasa John',
      email: 'admin@linkbus.com',
      password: await bcrypt.hash('admin123', 10),
      phone: '+256700123456',
      is_admin: true,
      is_verified: true,
    }).returning();

    // Insert test user
    const [regularUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Nakato Sarah',
      email: 'sarah@example.com',
      password: await bcrypt.hash('test123', 10),
      phone: '+256712345678',
      is_admin: false,
      is_verified: true,
    }).returning();

    console.log('✅ Users created successfully!');

    // Insert bus types with detailed configurations
    const busTypesData = await db.insert(busTypes).values([
      {
        name: 'VIP Executive',
        description: 'Premium luxury coach with extra legroom and exclusive services',
        amenities: [
          'Premium Reclining Seats',
          'Personal Entertainment System',
          'High-Speed WiFi',
          'USB & Power Outlets',
          'Air Conditioning',
          'Onboard Restroom',
          'Refreshment Service',
          'Reading Lights',
          'Extra Legroom',
          'Personal Air Vents',
          'Footrests',
          'Tray Tables',
          'Magazine Pocket',
          'Overhead Storage'
        ],
        seatLayout: {
          rows: 10,
          columns: 3,
          seats: Array.from({ length: 30 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'premium' as const,
            position: { row: Math.floor(i / 3) + 1, column: (i % 3) + 1 }
          }))
        },
        totalSeats: 30
      },
      {
        name: 'Business Class',
        description: 'Comfortable coach with business-oriented amenities',
        amenities: [
          'Comfortable Reclining Seats',
          'WiFi',
          'USB Charging',
          'Air Conditioning',
          'Onboard Restroom',
          'Reading Lights',
          'Footrests',
          'Tray Tables',
          'Overhead Storage'
        ],
        seatLayout: {
          rows: 12,
          columns: 4,
          seats: Array.from({ length: 48 }, (_, i) => ({
            number: `${i + 1}`,
            type: i < 16 ? ('premium' as const) : ('regular' as const),
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 48
      },
      {
        name: 'Economy Plus',
        description: 'Enhanced economy coach with added comfort features',
        amenities: [
          'Standard Reclining Seats',
          'Air Conditioning',
          'USB Charging',
          'Onboard Restroom',
          'Overhead Storage'
        ],
        seatLayout: {
          rows: 13,
          columns: 4,
          seats: Array.from({ length: 52 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'regular' as const,
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 52
      },
      {
        name: 'Economy Standard',
        description: 'Affordable and reliable transportation',
        amenities: [
          'Standard Seats',
          'Basic Air Conditioning',
          'Overhead Storage'
        ],
        seatLayout: {
          rows: 14,
          columns: 4,
          seats: Array.from({ length: 56 }, (_, i) => ({
            number: `${i + 1}`,
            type: 'regular' as const,
            position: { row: Math.floor(i / 4) + 1, column: (i % 4) + 1 }
          }))
        },
        totalSeats: 56
      }
    ]).returning();

    console.log('✅ Bus types created successfully!');

    // Insert comprehensive route network
    const routesData = await db.insert(routes).values([
      // Major Western Routes
      {
        origin: 'Kampala',
        destination: 'Mbarara',
        distance: 266,
        estimatedDuration: 300, // 5 hours
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Kabale',
        distance: 420,
        estimatedDuration: 420, // 7 hours
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Fort Portal',
        distance: 297,
        estimatedDuration: 360, // 6 hours
        isActive: 1
      },
      // Northern Routes
      {
        origin: 'Kampala',
        destination: 'Gulu',
        distance: 333,
        estimatedDuration: 360, // 6 hours
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Lira',
        distance: 340,
        estimatedDuration: 360, // 6 hours
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Arua',
        distance: 499,
        estimatedDuration: 480, // 8 hours
        isActive: 1
      },
      // Eastern Routes
      {
        origin: 'Kampala',
        destination: 'Mbale',
        distance: 224,
        estimatedDuration: 300, // 5 hours
        isActive: 1
      },
      {
        origin: 'Kampala',
        destination: 'Soroti',
        distance: 347,
        estimatedDuration: 360, // 6 hours
        isActive: 1
      },
      // Central Routes
      {
        origin: 'Kampala',
        destination: 'Masaka',
        distance: 120,
        estimatedDuration: 180, // 3 hours
        isActive: 1
      },
      // Short Routes
      {
        origin: 'Kampala',
        destination: 'Mityana',
        distance: 77,
        estimatedDuration: 120, // 2 hours
        isActive: 1
      },
      // Connection Routes
      {
        origin: 'Mbarara',
        destination: 'Kabale',
        distance: 154,
        estimatedDuration: 180, // 3 hours
        isActive: 1
      },
      {
        origin: 'Mbarara',
        destination: 'Bushenyi',
        distance: 45,
        estimatedDuration: 60, // 1 hour
        isActive: 1
      }
    ]).returning();

    console.log('✅ Routes created successfully!');

    // Calculate price based on distance and bus type
    const calculatePrice = (distance: number, busTypeId: number, isPeak: boolean = true): string => {
      // Base rate per kilometer
      let ratePerKm = 200; // UGX

      // Premium for VIP and Business class
      if (busTypeId === busTypesData[0].id) { // VIP Executive
        ratePerKm = 300;
      } else if (busTypeId === busTypesData[1].id) { // Business Class
        ratePerKm = 250;
      }

      // Calculate base price
      let price = distance * ratePerKm;

      // Peak time premium (10% extra)
      if (isPeak) {
        price *= 1.1;
      }

      // Round to nearest thousand
      price = Math.round(price / 1000) * 1000;

      return price.toString();
    };

    // Insert buses for each route (2 buses per route)
    const busesData = [];
    for (const route of routesData) {
      // Assign VIP Executive and Business Class buses for long routes (>300km)
      const busTypesForRoute = (route.distance || 0) > 300 
        ? [busTypesData[0], busTypesData[1]] // VIP and Business for long routes
        : [busTypesData[1], busTypesData[2]]; // Business and Economy Plus for shorter routes

      busesData.push(
        {
          busNumber: `LB${Math.floor(1000 + Math.random() * 9000)}`,
          busTypeId: busTypesForRoute[0].id,
          isActive: 1
        },
        {
          busNumber: `LB${Math.floor(1000 + Math.random() * 9000)}`,
          busTypeId: busTypesForRoute[1].id,
          isActive: 1
        }
      );
    }

    const insertedBuses = await db.insert(buses).values(busesData).returning();
    console.log('✅ Buses created successfully!');

    // Generate trips for the next 3 months starting tomorrow
    const tripsToInsert = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endDate = new Date(tomorrow);
    endDate.setMonth(endDate.getMonth() + 3);

    for (let date = new Date(tomorrow); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const isPeak = date.getDay() === 5 || date.getDay() === 6 || date.getDay() === 0; // Friday, Saturday, Sunday

      for (let i = 0; i < routesData.length; i++) {
        const route = routesData[i];
        const routeBuses = insertedBuses.slice(i * 2, (i * 2) + 2); // Get the two buses assigned to this route
        const estimatedDuration = route.estimatedDuration || 0;

        // Morning trip with first bus (7 AM)
        tripsToInsert.push({
          routeId: route.id,
          busId: routeBuses[0].id,
          departureDate: dateStr,
          departureTime: '07:00',
          arrivalTime: new Date(date.getTime() + estimatedDuration * 60000)
            .toTimeString()
            .slice(0, 5),
          price: calculatePrice(route.distance || 0, routeBuses[0].busTypeId, isPeak),
          availableSeats: busTypesData.find(bt => bt.id === routeBuses[0].busTypeId)?.totalSeats || 0,
          status: 'scheduled'
        });

        // Mid-morning trip with second bus (10 AM)
        tripsToInsert.push({
          routeId: route.id,
          busId: routeBuses[1].id,
          departureTime: '10:00',
          departureDate: dateStr,
          arrivalTime: new Date(date.getTime() + estimatedDuration * 60000 + 10 * 3600000)
            .toTimeString()
            .slice(0, 5),
          price: calculatePrice(route.distance || 0, routeBuses[1].busTypeId, isPeak),
          availableSeats: busTypesData.find(bt => bt.id === routeBuses[1].busTypeId)?.totalSeats || 0,
          status: 'scheduled'
        });

        // Afternoon trip with first bus (2 PM)
        tripsToInsert.push({
          routeId: route.id,
          busId: routeBuses[0].id,
          departureDate: dateStr,
          departureTime: '14:00',
          arrivalTime: new Date(date.getTime() + estimatedDuration * 60000 + 14 * 3600000)
            .toTimeString()
            .slice(0, 5),
          price: calculatePrice(route.distance || 0, routeBuses[0].busTypeId, isPeak),
          availableSeats: busTypesData.find(bt => bt.id === routeBuses[0].busTypeId)?.totalSeats || 0,
          status: 'scheduled'
        });

        // Evening trip with second bus (5 PM)
        tripsToInsert.push({
          routeId: route.id,
          busId: routeBuses[1].id,
          departureDate: dateStr,
          departureTime: '17:00',
          arrivalTime: new Date(date.getTime() + estimatedDuration * 60000 + 17 * 3600000)
            .toTimeString()
            .slice(0, 5),
          price: calculatePrice(route.distance || 0, routeBuses[1].busTypeId, isPeak),
          availableSeats: busTypesData.find(bt => bt.id === routeBuses[1].busTypeId)?.totalSeats || 0,
          status: 'scheduled'
        });
      }
    }

    // Insert all trips in batches
    const BATCH_SIZE = 100;
    const insertedTrips = [];
    for (let i = 0; i < tripsToInsert.length; i += BATCH_SIZE) {
      const batch = tripsToInsert.slice(i, i + BATCH_SIZE);
      const result = await db.insert(trips).values(batch).returning();
      insertedTrips.push(...result);
    }

    console.log(`✅ Created ${tripsToInsert.length} trips for the next 3 months`);

    // Create sample bookings with various statuses
    const bookingStatuses = ['confirmed', 'cancelled', 'completed', 'pending'];

    // Generate some historical bookings for analytics
    for (let i = 0; i < 50; i++) {
      const tripIndex = Math.floor(Math.random() * insertedTrips.length);
      const trip = insertedTrips[tripIndex];
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
      const historicalDate = new Date();
      historicalDate.setDate(historicalDate.getDate() - Math.floor(Math.random() * 30));

      const booking: InsertBooking = {
        userId: regularUser.id,
        tripId: trip.id,
        seatNumber: Math.floor(Math.random() * 30) + 1,
        bookingReference: `BK${Math.floor(10000 + Math.random() * 90000)}`,
        paymentStatus: status === 'confirmed' ? 'completed' : 'pending',
        totalAmount: trip.price,
        createdAt: historicalDate
      };

      await db.insert(bookings).values(booking);
    }

    console.log('✅ Sample bookings created successfully!');
    console.log('✅ Database seeded successfully!');

    // Print admin credentials
    console.log('\nAdmin Credentials:');
    console.log('Admin - Email: admin@linkbus.com, Password: admin123');

    // Add trips for today and upcoming dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Format dates for SQL
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Get buses for Kampala to Mbarara route (first route)
    const routeBuses = insertedBuses.slice(0, 2); // Get the two buses assigned to this route

    // Add trips for Kampala to Mbarara route
    await db.insert(trips).values([
      // Morning trip
      {
        routeId: routesData[0].id,
        busId: routeBuses[0].id,
        departureDate: todayStr,
        departureTime: '07:00',
        arrivalTime: '12:00',
        price: calculatePrice(266, routeBuses[0].busTypeId),
        availableSeats: busTypesData.find(bt => bt.id === routeBuses[0].busTypeId)?.totalSeats || 0,
        status: 'scheduled'
      },
      // Afternoon trip
      {
        routeId: routesData[0].id,
        busId: routeBuses[1].id,
        departureDate: todayStr,
        departureTime: '14:00',
        arrivalTime: '19:00',
        price: calculatePrice(266, routeBuses[1].busTypeId),
        availableSeats: busTypesData.find(bt => bt.id === routeBuses[1].busTypeId)?.totalSeats || 0,
        status: 'scheduled'
      },
      // Next week morning trip
      {
        routeId: routesData[0].id,
        busId: routeBuses[0].id,
        departureDate: nextWeekStr,
        departureTime: '07:00',
        arrivalTime: '12:00',
        price: calculatePrice(266, routeBuses[0].busTypeId),
        availableSeats: busTypesData.find(bt => bt.id === routeBuses[0].busTypeId)?.totalSeats || 0,
        status: 'scheduled'
      }
    ]);

    console.log('✅ Added trips for Kampala to Mbarara route');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error); 