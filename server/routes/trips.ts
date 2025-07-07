import { Router } from 'express';
import { db } from '../storage.js';
import { trips, routes, buses, busTypes, bookings } from '../schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { tripSchema } from '../schema.js';
import { calculateTripPrice } from '../utils/booking.js';

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
      totalSeats: number;
    };
  };
}

const router = Router();

// Get all trips with details - public endpoint
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/trips - Fetching all trips');
    const results = await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(trips.departureDate, trips.departureTime);

    console.log('Raw query results:', results);
    
    const formattedTrips = results.map(formatTripResult);
    console.log('Formatted trips:', formattedTrips);
    
    res.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get single trip by ID - public endpoint
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(trips.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(formatTripResult(result[0]));
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search trips endpoint - public endpoint
router.get('/search', async (req, res) => {
  try {
    const { origin, destination, date, minPrice, maxPrice, busType } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ message: 'Missing required search parameters' });
    }

    try {
      const searchDate = new Date(date as string);
      if (isNaN(searchDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      // Ensure the search date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (searchDate < today) {
        return res.status(400).json({ message: 'Cannot search for trips in the past' });
      }

      const formattedDate = searchDate.toISOString().split('T')[0];

      let conditions = [
        sql`LOWER(${routes.origin}) = LOWER(${origin as string})`,
        sql`LOWER(${routes.destination}) = LOWER(${destination as string})`,
        eq(trips.departureDate, formattedDate),
        eq(trips.status, 'scheduled'),
        sql`CONCAT(${trips.departureDate}, ' ', ${trips.departureTime}) > NOW()`
      ];

      if (minPrice) {
        conditions.push(gte(trips.price, minPrice as string));
      }
      if (maxPrice) {
        conditions.push(sql`CAST(${trips.price} AS DECIMAL) <= ${maxPrice}`);
      }
      if (busType) {
        conditions.push(eq(busTypes.name, busType as string));
      }

      const baseQuery = db
        .select()
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .innerJoin(buses, eq(trips.busId, buses.id))
        .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
        .where(and(...conditions));

      const results = await baseQuery;
      const searchResults = results.map(formatTripResult);
      res.json(searchResults);
    } catch (error) {
      console.error('Error processing date or executing query:', error);
      return res.status(400).json({ message: 'Invalid search parameters' });
    }
  } catch (error) {
    console.error('Error searching trips:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new trip (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const tripData = req.body;
    
    // Validate trip data
    const validationResult = tripSchema.safeParse({
      ...tripData,
      price: '0' // Temporary price, will be calculated
    });
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid trip data', 
        errors: validationResult.error.errors 
      });
    }

    // Validate times
    const departureTime = new Date(`2000-01-01T${tripData.departureTime}`);
    const arrivalTime = new Date(`2000-01-01T${tripData.arrivalTime}`);
    if (departureTime >= arrivalTime) {
      return res.status(400).json({ 
        message: 'Departure time must be before arrival time' 
      });
    }

    // Check if route exists and is active
    const route = await db
      .select()
      .from(routes)
      .where(eq(routes.id, tripData.routeId))
      .limit(1);

    if (!route.length || !route[0].isActive) {
      return res.status(400).json({ 
        message: 'Invalid or inactive route' 
      });
    }

    // Check if bus exists and is active
    const bus = await db
      .select()
      .from(buses)
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(buses.id, tripData.busId))
      .limit(1);

    if (!bus.length || !bus[0].buses.isActive) {
      return res.status(400).json({ 
        message: 'Invalid or inactive bus' 
      });
    }

    // Set initial available seats from bus type
    const availableSeats = bus[0].bus_types.totalSeats;

    // Calculate price based on route and bus type
    const price = await calculateTripPrice(tripData.routeId, tripData.busId);

    // Add new trip
    const newTrip = await db
      .insert(trips)
      .values({
        ...tripData,
        price,
        availableSeats,
        status: 'scheduled'
      })
      .returning();

    res.status(201).json(newTrip[0]);
  } catch (error) {
    console.error('Error adding trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update trip (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const tripData = req.body;

    // Validate trip data
    const validationResult = tripSchema.safeParse({
      ...tripData,
      price: '0' // Temporary price, will be calculated
    });
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid trip data', 
        errors: validationResult.error.errors 
      });
    }

    // Check if trip exists
    const existingTrip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, parseInt(id)))
      .limit(1);

    if (!existingTrip.length) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Validate times
    const departureTime = new Date(`2000-01-01T${tripData.departureTime}`);
    const arrivalTime = new Date(`2000-01-01T${tripData.arrivalTime}`);
    if (departureTime >= arrivalTime) {
      return res.status(400).json({ 
        message: 'Departure time must be before arrival time' 
      });
    }

    // Calculate price based on route and bus type
    const price = await calculateTripPrice(tripData.routeId, tripData.busId);

    // Update trip
    const updatedTrip = await db
      .update(trips)
      .set({
        ...tripData,
        price
      })
      .where(eq(trips.id, parseInt(id)))
      .returning();

    res.json(updatedTrip[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update trip status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedTrip = await db
      .update(trips)
      .set({ status })
      .where(eq(trips.id, parseInt(id)))
      .returning();

    if (!updatedTrip.length) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(updatedTrip[0]);
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete trip (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check if trip has any bookings
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tripId, parseInt(id)))
      .limit(1);

    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete trip with existing bookings. Try cancelling it instead.' 
      });
    }

    const deletedTrip = await db
      .delete(trips)
      .where(eq(trips.id, parseInt(id)))
      .returning();

    if (!deletedTrip.length) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to format trip results
function formatTripResult(row: any): SearchResult {
  return {
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
        totalSeats: row.bus_types.totalSeats,
      },
    },
  };
}

export default router; 