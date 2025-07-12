import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes, users, seats } from '../schema.js';
import { eq, inArray, desc, sql } from 'drizzle-orm';

async function debugAdminAPI() {
  try {
    console.log('🔍 Debugging admin API endpoints...');
    
    // Test basic database connectivity
    console.log('1. Testing database connection...');
    const testQuery = await db.execute(sql`SELECT COUNT(*) as count FROM bookings`);
    console.log('✅ Database connection successful');
    console.log(`   Found ${testQuery.rows[0]?.count || 0} total bookings`);
    
    // Test the exact query from admin.ts
    console.log('\n2. Testing admin bookings query...');
    
    const allBookings = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        bookingStatus: bookings.status,
        createdAt: bookings.createdAt,
        userId: bookings.userId,
        tripId: bookings.tripId,
        // Trip details
        departureDate: trips.departureDate,
        departureTime: trips.departureTime,
        arrivalTime: trips.arrivalTime,
        fare: trips.fare,
        // Route details
        origin: routes.origin,
        destination: routes.destination,
        // Bus details
        busNumber: buses.busNumber,
        busType: busTypes.name,
        // User details
        passengerName: users.name,
        passengerEmail: users.email,
        passengerPhone: users.phone,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt));

    console.log(`✅ Admin bookings query successful - found ${allBookings.length} bookings`);
    
    if (allBookings.length > 0) {
      console.log('📋 Sample booking:', JSON.stringify(allBookings[0], null, 2));
    }
    
    // Test seats query
    if (allBookings.length > 0) {
      console.log('\n3. Testing seats query...');
      const bookingIds = allBookings.map(b => b.id);
      const bookingSeats = await db
        .select({
          bookingId: seats.bookingId,
          seatNumber: seats.seatNumber,
        })
        .from(seats)
        .where(inArray(seats.bookingId, bookingIds));
      
      console.log(`✅ Seats query successful - found ${bookingSeats.length} seat assignments`);
    }
    
    console.log('\n🎉 All queries working correctly!');
    console.log('The admin API should be working. There might be an authentication or middleware issue.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in admin API query:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

debugAdminAPI(); 