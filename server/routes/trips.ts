import { Router } from 'express';
import { db } from '../storage.js';
import { trips, routes, buses, busTypes } from '../schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';

interface SearchResult {
  id: number;
  routeId: number | null;
  busId: number | null;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: number | null;
  status: string | null;
  route: {
    origin: string;
    destination: string;
    distance: number | null;
    estimatedDuration: number | null;
  };
  bus: {
    busNumber: string;
    busType: {
      name: string | null;
      description: string | null;
      amenities: string[] | null;
    };
  };
}

const router = Router();

// Search trips endpoint
router.get('/search', async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ message: 'Missing required search parameters' });
    }

    const searchDate = new Date(date as string);
    // Format the date to match the database format (YYYY-MM-DD)
    const formattedDate = searchDate.toISOString().split('T')[0];

    const results = await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(
        and(
          eq(routes.origin, origin as string),
          eq(routes.destination, destination as string),
          eq(trips.departureDate, formattedDate),
          eq(trips.status, 'SCHEDULED')
        )
      );

    // Transform the results to match the expected format
    const searchResults: SearchResult[] = results.map(row => ({
      id: row.trips.id,
      routeId: row.trips.routeId,
      busId: row.trips.busId,
      departureDate: row.trips.departureDate,
      departureTime: row.trips.departureTime,
      arrivalTime: row.trips.arrivalTime,
      price: row.trips.price,
      availableSeats: row.trips.availableSeats,
      status: row.trips.status,
      route: {
        origin: row.routes.origin,
        destination: row.routes.destination,
        distance: row.routes.distance,
        estimatedDuration: row.routes.estimatedDuration,
      },
      bus: {
        busNumber: row.buses.busNumber,
        busType: {
          name: row.bus_types.name,
          description: row.bus_types.description,
          amenities: row.bus_types.amenities,
        },
      },
    }));

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching trips:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 