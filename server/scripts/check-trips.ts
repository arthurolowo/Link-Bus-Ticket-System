import { db } from '../storage.js';
import { trips, routes, buses, busTypes } from '../schema.js';
import { eq } from 'drizzle-orm';

async function checkTrips() {
  try {
    const allTrips = await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(trips.departureDate, trips.departureTime);

    console.log('\nAll Trips in Database:');
    console.log('======================');
    allTrips.forEach(trip => {
      console.log(`${trip.routes.origin} → ${trip.routes.destination}`);
      console.log(`Date: ${trip.trips.departureDate}`);
      console.log(`Time: ${trip.trips.departureTime} - ${trip.trips.arrivalTime}`);
      console.log(`Bus: ${trip.buses.busNumber} (${trip.bus_types.name})`);
      console.log(`Price: UGX ${trip.trips.price}`);
      console.log(`Status: ${trip.trips.status}`);
      console.log('----------------------');
    });

    console.log(`\nTotal Trips: ${allTrips.length}`);
  } catch (error) {
    console.error('Error checking trips:', error);
  }
}

checkTrips(); 