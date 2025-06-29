import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { busTypes, buses, routes, trips, users, bookings } from './schema.js';
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
      name: 'System Administrator',
      email: 'admin@linkbus.com',
      password: await bcrypt.hash('admin123', 10),
      phone: '0700123456',
      is_admin: true,
      is_verified: true,
    }).returning();

    // Insert test user
    const [regularUser] = await db.insert(users).values({
      id: uuidv4(),
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 10),
      phone: '0712345678',
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
      // Major routes
      {
        origin: 'Nairobi',
        destination: 'Mombasa',
        distance: 485,
        estimatedDuration: 420, // 7 hours
        isActive: 1
      },
      {
        origin: 'Nairobi',
        destination: 'Kisumu',
        distance: 355,
        estimatedDuration: 360, // 6 hours
        isActive: 1
      },
      {
        origin: 'Nairobi',
        destination: 'Nakuru',
        distance: 160,
        estimatedDuration: 150, // 2.5 hours
        isActive: 1
      },
      // Regional routes
      {
        origin: 'Mombasa',
        destination: 'Malindi',
        distance: 115,
        estimatedDuration: 120, // 2 hours
        isActive: 1
      },
      {
        origin: 'Nakuru',
        destination: 'Eldoret',
        distance: 145,
        estimatedDuration: 150, // 2.5 hours
        isActive: 1
      },
      {
        origin: 'Eldoret',
        destination: 'Kitale',
        distance: 75,
        estimatedDuration: 90, // 1.5 hours
        isActive: 1
      },
      // Connecting routes
      {
        origin: 'Nairobi',
        destination: 'Nyeri',
        distance: 153,
        estimatedDuration: 180, // 3 hours
        isActive: 1
      },
      {
        origin: 'Mombasa',
        destination: 'Voi',
        distance: 160,
        estimatedDuration: 180, // 3 hours
        isActive: 1
      },
      {
        origin: 'Kisumu',
        destination: 'Kakamega',
        distance: 50,
        estimatedDuration: 60, // 1 hour
        isActive: 1
      },
      // Alternative routes
      {
        origin: 'Nairobi',
        destination: 'Thika',
        distance: 45,
        estimatedDuration: 60, // 1 hour
        isActive: 1
      }
    ]).returning();

    console.log('✅ Routes created successfully!');

    // Insert fleet of buses with maintenance status
    const busesData = await db.insert(buses).values([
      // VIP Executive fleet
      {
        busNumber: 'KDD 100J',
        busTypeId: busTypesData[0].id,
        isActive: 1
      },
      {
        busNumber: 'KDD 101J',
        busTypeId: busTypesData[0].id,
        isActive: 1
      },
      {
        busNumber: 'KDD 102J',
        busTypeId: busTypesData[0].id,
        isActive: 0 // Under maintenance
      },
      // Business Class fleet
      {
        busNumber: 'KDE 200J',
        busTypeId: busTypesData[1].id,
        isActive: 1
      },
      {
        busNumber: 'KDE 201J',
        busTypeId: busTypesData[1].id,
        isActive: 1
      },
      {
        busNumber: 'KDE 202J',
        busTypeId: busTypesData[1].id,
        isActive: 1
      },
      {
        busNumber: 'KDE 203J',
        busTypeId: busTypesData[1].id,
        isActive: 0 // Under maintenance
      },
      // Economy Plus fleet
      {
        busNumber: 'KDF 300J',
        busTypeId: busTypesData[2].id,
        isActive: 1
      },
      {
        busNumber: 'KDF 301J',
        busTypeId: busTypesData[2].id,
        isActive: 1
      },
      {
        busNumber: 'KDF 302J',
        busTypeId: busTypesData[2].id,
        isActive: 1
      },
      // Economy Standard fleet
      {
        busNumber: 'KDG 400J',
        busTypeId: busTypesData[3].id,
        isActive: 1
      },
      {
        busNumber: 'KDG 401J',
        busTypeId: busTypesData[3].id,
        isActive: 1
      }
    ]).returning();

    console.log('✅ Buses created successfully!');

    // Price calculation function with peak/off-peak rates
    const calculatePrice = (distance: number, busTypeId: number, isPeak: boolean = true): string => {
      // Base rate per kilometer for each bus type
      const baseRatePerKm = {
        [busTypesData[0].id]: 4.5,  // VIP Executive
        [busTypesData[1].id]: 3.5,  // Business Class
        [busTypesData[2].id]: 2.5,  // Economy Plus
        [busTypesData[3].id]: 2.0   // Economy Standard
      };
      
      // Peak hour multiplier (20% increase)
      const peakMultiplier = isPeak ? 1.2 : 1;
      
      const basePrice = Math.round(distance * baseRatePerKm[busTypeId] * peakMultiplier);
      return basePrice.toString();
    };

    // Get dates for the next week
    const getNextWeekDates = () => {
      const dates = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    };

    // Create trips for the next week
    const nextWeekDates = getNextWeekDates();
    const tripsData = [];

    // Generate trips for each date
    for (const date of nextWeekDates) {
      // Major routes - multiple trips per day
      tripsData.push(
        // Nairobi - Mombasa VIP morning
        {
          routeId: routesData[0].id,
          busId: busesData[0].id,
          departureDate: date,
          departureTime: '06:00',
          arrivalTime: '13:00',
          price: calculatePrice(485, busTypesData[0].id, true),
          availableSeats: 30,
          status: 'scheduled'
        },
        // Nairobi - Mombasa Business afternoon
        {
          routeId: routesData[0].id,
          busId: busesData[3].id,
          departureDate: date,
          departureTime: '14:00',
          arrivalTime: '21:00',
          price: calculatePrice(485, busTypesData[1].id, false),
          availableSeats: 48,
          status: 'scheduled'
        },
        // Nairobi - Kisumu morning
        {
          routeId: routesData[1].id,
          busId: busesData[1].id,
          departureDate: date,
          departureTime: '07:00',
          arrivalTime: '13:00',
          price: calculatePrice(355, busTypesData[0].id, true),
          availableSeats: 30,
          status: 'scheduled'
        },
        // Nairobi - Nakuru multiple daily trips
        {
          routeId: routesData[2].id,
          busId: busesData[7].id,
          departureDate: date,
          departureTime: '07:30',
          arrivalTime: '10:00',
          price: calculatePrice(160, busTypesData[2].id, true),
          availableSeats: 52,
          status: 'scheduled'
        },
        {
          routeId: routesData[2].id,
          busId: busesData[8].id,
          departureDate: date,
          departureTime: '11:30',
          arrivalTime: '14:00',
          price: calculatePrice(160, busTypesData[2].id, false),
          availableSeats: 52,
          status: 'scheduled'
        },
        {
          routeId: routesData[2].id,
          busId: busesData[9].id,
          departureDate: date,
          departureTime: '15:30',
          arrivalTime: '18:00',
          price: calculatePrice(160, busTypesData[2].id, true),
          availableSeats: 52,
          status: 'scheduled'
        }
      );

      // Regional routes
      tripsData.push(
        // Mombasa - Malindi
        {
          routeId: routesData[3].id,
          busId: busesData[10].id,
          departureDate: date,
          departureTime: '08:00',
          arrivalTime: '10:00',
          price: calculatePrice(115, busTypesData[3].id, true),
          availableSeats: 56,
          status: 'scheduled'
        },
        // Nakuru - Eldoret
        {
          routeId: routesData[4].id,
          busId: busesData[11].id,
          departureDate: date,
          departureTime: '09:00',
          arrivalTime: '11:30',
          price: calculatePrice(145, busTypesData[3].id, true),
          availableSeats: 56,
          status: 'scheduled'
        }
      );
    }

    const insertedTrips = await db.insert(trips).values(tripsData).returning();

    console.log('✅ Trips created successfully!');

    // Create sample bookings with various statuses
    const bookingStatuses = ['completed', 'pending', 'cancelled'];
    const bookingsData = [];

    // Generate some historical bookings for analytics
    for (let i = 0; i < 50; i++) {
      const tripIndex = Math.floor(Math.random() * insertedTrips.length);
      const trip = insertedTrips[tripIndex];
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];

      bookingsData.push({
        userId: regularUser.id,
        tripId: trip.id,
        seatNumber: Math.floor(Math.random() * 30) + 1,
        bookingReference: 'LB' + Date.now().toString().slice(-6) + i,
        paymentStatus: status,
        totalAmount: trip.price,
        qrCode: `LBQR-${Date.now()}-${i}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date within last week
      });
    }

    await db.insert(bookings).values(bookingsData);

    console.log('✅ Sample bookings created successfully!');
    console.log('✅ Database seeded successfully!');

    // Print admin credentials
    console.log('\nAdmin Credentials:');
    console.log('Admin - Email: admin@linkbus.com, Password: admin123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed(); 