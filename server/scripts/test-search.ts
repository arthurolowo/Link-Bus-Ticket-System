import { db } from '../storage.js';
import { trips, routes, buses, busTypes } from '../schema.js';
import { and, eq, sql } from 'drizzle-orm';

async function testSearch() {
  try {
    const origin = 'Kampala';
    const destination = 'Gulu';
    const searchDate = '2025-07-08';

    console.log(`\nSearching for trips:`);
    console.log(`From: ${origin}`);
    console.log(`To: ${destination}`);
    console.log(`Date: ${searchDate}`);
    console.log('------------------------');

    let conditions = [
      sql`LOWER(${routes.origin}) = LOWER(${origin})`,
      sql`LOWER(${routes.destination}) = LOWER(${destination})`,
      eq(trips.departureDate, searchDate),
      eq(trips.status, 'scheduled')
    ];

    const results = await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(and(...conditions));

    if (results.length === 0) {
      console.log('No trips found');
    } else {
      console.log(`Found ${results.length} trips:\n`);
      results.forEach(trip => {
        console.log(`Trip ID: ${trip.trips.id}`);
        console.log(`Route: ${trip.routes.origin} → ${trip.routes.destination}`);
        console.log(`Date: ${trip.trips.departureDate}`);
        console.log(`Time: ${trip.trips.departureTime} - ${trip.trips.arrivalTime}`);
        console.log(`Bus: ${trip.buses.busNumber} (${trip.bus_types.name})`);
        console.log(`Price: UGX ${trip.trips.price}`);
        console.log(`Status: ${trip.trips.status}`);
        console.log('------------------------');
      });
    }

  } catch (error) {
    console.error('Error testing search:', error);
  }
}

testSearch(); 