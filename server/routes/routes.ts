import { Router } from 'express';
import { db } from '../storage.js';
import { routes, routeSchema } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { bookings } from '../schema.js';
import { trips } from '../schema.js';
import { buses } from '../schema.js';
import { busTypes } from '../schema.js';
import { payments } from '../schema.js';

const router = Router();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const allRoutes = await db
      .select()
      .from(routes)
      .where(eq(routes.isActive, 1))
      .orderBy(routes.origin, routes.destination);

    res.json(allRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available cities from active routes
router.get('/cities', async (req, res) => {
  try {
    const cityData = await db
      .select({
        origin: routes.origin,
        destination: routes.destination,
      })
      .from(routes)
      .where(eq(routes.isActive, 1));

    // Extract unique cities from origins and destinations
    const citiesSet = new Set<string>();
    cityData.forEach(route => {
      // Capitalize first letter of each city
      const formatCity = (city: string) => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
      citiesSet.add(formatCity(route.origin));
      citiesSet.add(formatCity(route.destination));
    });

    // Convert to sorted array
    const cities = Array.from(citiesSet).sort();

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const todayString = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

    // Get statistics for each route
    const routeStats = await db
      .select({
        routeId: routes.id,
        totalBookings: sql<number>`COALESCE(COUNT(DISTINCT ${bookings.id}), 0)`,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' THEN CAST(${payments.amount} AS DECIMAL) ELSE 0 END), 0)`,
        upcomingTrips: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${trips.departureDate} >= ${todayString} AND ${trips.status} = 'scheduled' THEN ${trips.id} END), 0)`,
      })
      .from(routes)
      .leftJoin(trips, eq(routes.id, trips.routeId))
      .leftJoin(bookings, and(
        eq(trips.id, bookings.tripId),
        sql`${bookings.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      ))
      .leftJoin(payments, eq(bookings.id, payments.bookingId))
      .groupBy(routes.id)
      .orderBy(routes.id);

    // Calculate average occupancy for each route
    const statsWithOccupancy = await Promise.all(
      routeStats.map(async (stat) => {
        // Get total seats and booked seats for this route's upcoming trips
        const [occupancyData] = await db
          .select({
            totalSeats: sql<number>`COALESCE(SUM(${busTypes.totalSeats}), 0)`,
            bookedSeats: sql<number>`COALESCE(SUM(${busTypes.totalSeats} - ${trips.availableSeats}), 0)`,
          })
          .from(trips)
          .innerJoin(buses, eq(trips.busId, buses.id))
          .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
          .where(
            and(
              eq(trips.routeId, stat.routeId),
              sql`${trips.departureDate} >= ${todayString}`,
              eq(trips.status, 'scheduled')
            )
          );

        const averageOccupancy = occupancyData.totalSeats > 0 
          ? Math.round((occupancyData.bookedSeats / occupancyData.totalSeats) * 100)
          : 0;

        return {
          routeId: stat.routeId,
          totalBookings: Number(stat.totalBookings),
          totalRevenue: Number(stat.totalRevenue),
          upcomingTrips: Number(stat.upcomingTrips),
          averageOccupancy,
        };
      })
    );

    res.json(statsWithOccupancy);
  } catch (error) {
    console.error('Error fetching route stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new route (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { origin, destination, distance, estimatedDuration, isActive } = req.body;
    console.log('Adding new route:', { origin, destination, distance, estimatedDuration, isActive });

    // Validate required fields
    if (!origin || !destination || !distance || !estimatedDuration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types
    if (typeof origin !== 'string' || typeof destination !== 'string') {
      return res.status(400).json({ message: 'Invalid data types for origin or destination' });
    }

    if (typeof distance !== 'number' || typeof estimatedDuration !== 'number') {
      return res.status(400).json({ message: 'Invalid data types for distance or duration' });
    }

    // Check if route already exists - case insensitive comparison
    const existingRoute = await db
      .select()
      .from(routes)
      .where(
        sql`LOWER(${routes.origin}) = LOWER(${origin}) AND LOWER(${routes.destination}) = LOWER(${destination})`
      );

    if (existingRoute.length > 0) {
      return res.status(400).json({ message: 'Route already exists' });
    }

    // Add new route
    const newRoute = await db.insert(routes).values({
      origin: origin.toLowerCase(),
      destination: destination.toLowerCase(),
      distance,
      estimatedDuration,
      isActive: isActive ?? 1
    }).returning();

    console.log('Created new route:', newRoute[0]);
    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error('Error adding route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update route (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { origin, destination, distance, estimatedDuration, isActive } = req.body;

    // Validate required fields
    if (!origin || !destination || !distance || !estimatedDuration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types
    if (typeof origin !== 'string' || typeof destination !== 'string') {
      return res.status(400).json({ message: 'Invalid data types for origin or destination' });
    }

    if (typeof distance !== 'number' || typeof estimatedDuration !== 'number') {
      return res.status(400).json({ message: 'Invalid data types for distance or duration' });
    }

    // Check if route exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Update route
    const updatedRoute = await db
      .update(routes)
      .set({
        origin,
        destination,
        distance,
        estimatedDuration,
        isActive: isActive ?? existingRoute[0].isActive
      })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete route (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check if route exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Delete route
    await db
      .delete(routes)
      .where(eq(routes.id, parseInt(id)));

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle route status (admin only) - Updated endpoint name
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    console.log('Toggle status request:', { id, isActive });

    // Validate isActive
    if (typeof isActive !== 'number' || ![0, 1].includes(isActive)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Check if route exists and get current status
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    console.log('Found route before update:', existingRoute[0]);

    // Update route status
    const updatedRoute = await db
      .update(routes)
      .set({ isActive })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    console.log('Route after update:', updatedRoute[0]);

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Keep the old endpoint for backward compatibility
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    console.log('Toggle status request:', { id, isActive });

    // Validate isActive
    if (typeof isActive !== 'number' || ![0, 1].includes(isActive)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Check if route exists and get current status
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    console.log('Found route before update:', existingRoute[0]);

    // Update route status
    const updatedRoute = await db
      .update(routes)
      .set({ isActive })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    console.log('Route after update:', updatedRoute[0]);

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 