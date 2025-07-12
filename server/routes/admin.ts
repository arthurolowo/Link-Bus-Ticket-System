import { Router } from 'express';
import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes, users, seats } from '../schema.js';
import { eq, and, sql, desc, count, sum } from 'drizzle-orm';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Middleware to check admin access
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Admin access required' 
    });
  }
  next();
};

// Get dashboard stats
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Get total bookings and revenue for last 30 days
    const [bookingStats] = await db
      .select({
        totalBookings: count(bookings.id),
        totalRevenue: sql<string>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.createdAt} >= ${thirtyDaysAgo}`,
          eq(bookings.paymentStatus, 'completed')
        )
      );

    // Get active routes count
    const [routeStats] = await db
      .select({
        activeRoutes: count(routes.id),
      })
      .from(routes)
      .where(eq(routes.isActive, 1));

    // Get occupancy rate
    const [tripStats] = await db
      .select({
        totalSeats: sql<number>`COALESCE(SUM(${busTypes.totalSeats}), 0)`,
        bookedSeats: sql<number>`COALESCE(SUM(${busTypes.totalSeats} - ${trips.availableSeats}), 0)`,
      })
      .from(trips)
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(
        and(
          sql`${trips.departureDate} >= ${today.toISOString().split('T')[0]}`,
          eq(trips.status, 'scheduled')
        )
      );

    // Get daily revenue for chart
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${bookings.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.createdAt} >= ${thirtyDaysAgo}`,
          eq(bookings.paymentStatus, 'completed')
        )
      )
      .groupBy(sql`DATE(${bookings.createdAt})`)
      .orderBy(sql`DATE(${bookings.createdAt})`);

    // Get popular routes
    const popularRoutes = await db
      .select({
        routeId: routes.id,
        origin: routes.origin,
        destination: routes.destination,
        bookings: count(bookings.id),
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
      })
      .from(routes)
      .leftJoin(trips, eq(routes.id, trips.routeId))
      .leftJoin(bookings, eq(trips.id, bookings.tripId))
      .where(eq(bookings.paymentStatus, 'completed'))
      .groupBy(routes.id, routes.origin, routes.destination)
      .orderBy(desc(sql`COUNT(${bookings.id})`))
      .limit(5);

    // Get recent bookings
    const recentBookings = await db
      .select({
        id: bookings.id,
        reference: bookings.bookingReference,
        amount: bookings.totalAmount,
        status: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        trip: {
          id: trips.id,
          departureDate: trips.departureDate,
          departureTime: trips.departureTime,
          route: {
            origin: routes.origin,
            destination: routes.destination,
          }
        },
        user: {
          name: users.name,
          email: users.email,
          phone: users.phone,
        }
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalBookings: Number(bookingStats.totalBookings),
          totalRevenue: Number(bookingStats.totalRevenue),
          activeRoutes: Number(routeStats.activeRoutes),
          occupancyRate: tripStats.totalSeats ? Math.round((tripStats.bookedSeats / tripStats.totalSeats) * 100) : 0,
        },
        dailyRevenue,
        popularRoutes,
        recentBookings,
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch admin statistics' 
    });
  }
});

// Get all bookings with details
router.get('/bookings', auth, requireAdmin, async (req, res) => {
  try {
    const allBookings = await db
      .select({
        id: bookings.id,
        reference: bookings.bookingReference,
        amount: bookings.totalAmount,
        status: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        trip: {
          id: trips.id,
          departureDate: trips.departureDate,
          departureTime: trips.departureTime,
          route: {
            origin: routes.origin,
            destination: routes.destination,
          },
          bus: {
            number: buses.busNumber,
            type: busTypes.name,
          }
        },
        user: {
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        seats: sql<number[]>`ARRAY_AGG(${seats.seatNumber})`
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .leftJoin(seats, eq(bookings.id, seats.bookingId))
      .groupBy(
        bookings.id,
        trips.id,
        routes.origin,
        routes.destination,
        buses.busNumber,
        busTypes.name,
        users.name,
        users.email,
        users.phone
      )
      .orderBy(desc(bookings.createdAt));

    res.json({
      status: 'success',
      data: allBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch bookings' 
    });
  }
});

export default router; 