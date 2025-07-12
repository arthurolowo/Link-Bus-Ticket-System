import { Router, Response, NextFunction } from 'express';
import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes, users, seats } from '../schema.js';
import { eq, and, sql, desc, count, sum, inArray } from 'drizzle-orm';
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

    const occupancyRate = tripStats.totalSeats ? Math.round((tripStats.bookedSeats / tripStats.totalSeats) * 100) : 0;

    res.json({
      totalBookings: Number(bookingStats.totalBookings),
      totalRevenue: bookingStats.totalRevenue,
      activeRoutes: Number(routeStats.activeRoutes),
      occupancyRate
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

    // Get seat numbers for each booking
    const bookingIds = allBookings.map(b => b.id);
    const bookingSeats = await db
      .select({
        bookingId: seats.bookingId,
        seatNumber: seats.seatNumber,
      })
      .from(seats)
      .where(inArray(seats.bookingId, bookingIds));

    // Group seats by booking
    const seatsByBooking = bookingSeats.reduce((acc, seat) => {
      if (!acc[seat.bookingId]) {
        acc[seat.bookingId] = [];
      }
      acc[seat.bookingId].push(seat.seatNumber);
      return acc;
    }, {} as Record<number, number[]>);

    // Add seats to booking data and format for frontend
    const formattedBookings = allBookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
      passengerName: booking.passengerName,
      passengerEmail: booking.passengerEmail,
      passengerPhone: booking.passengerPhone,
      seatNumbers: seatsByBooking[booking.id] || [],
      trip: {
        id: booking.tripId,
        departureDate: booking.departureDate,
        departureTime: booking.departureTime,
        arrivalTime: booking.arrivalTime,
        fare: booking.fare,
        route: {
          origin: booking.origin,
          destination: booking.destination,
        },
        bus: {
          number: booking.busNumber,
          type: booking.busType,
        }
      }
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch bookings' 
    });
  }
});

// Get specific booking details
router.get('/bookings/:id', auth, requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    const [booking] = await db
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
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Get seat numbers
    const bookingSeats = await db
      .select({
        seatNumber: seats.seatNumber,
      })
      .from(seats)
      .where(eq(seats.bookingId, bookingId));

    res.json({
      ...booking,
      seatNumbers: bookingSeats.map(s => s.seatNumber),
      trip: {
        id: booking.tripId,
        departureDate: booking.departureDate,
        departureTime: booking.departureTime,
        arrivalTime: booking.arrivalTime,
        fare: booking.fare,
        route: {
          origin: booking.origin,
          destination: booking.destination,
        },
        bus: {
          number: booking.busNumber,
          type: booking.busType,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch booking details' 
    });
  }
});

// Cancel a booking (admin action)
router.patch('/bookings/:id/cancel', auth, requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { reason } = req.body;
    
    // Check if booking exists and can be cancelled
    const [booking] = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        tripId: bookings.tripId,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled'
      });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update booking status
      await tx
        .update(bookings)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        .where(eq(bookings.id, bookingId));

      // Get seats to release
      const bookingSeats = await tx
        .select({ seatNumber: seats.seatNumber })
        .from(seats)
        .where(eq(seats.bookingId, bookingId));

      // Release seats
      await tx
        .delete(seats)
        .where(eq(seats.bookingId, bookingId));

      // Update trip available seats
      await tx
        .update(trips)
        .set({
          availableSeats: sql`${trips.availableSeats} + ${bookingSeats.length}`,
          updatedAt: new Date().toISOString()
        })
        .where(eq(trips.id, booking.tripId));
    });

    res.json({
      status: 'success',
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to cancel booking' 
    });
  }
});

// Get booking analytics
router.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Daily revenue for last 30 days
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${bookings.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
        bookings: count(bookings.id),
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

    // Popular routes
    const popularRoutes = await db
      .select({
        origin: routes.origin,
        destination: routes.destination,
        bookings: count(bookings.id),
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
      })
      .from(routes)
      .innerJoin(trips, eq(routes.id, trips.routeId))
      .innerJoin(bookings, eq(trips.id, bookings.tripId))
      .where(
        and(
          eq(bookings.paymentStatus, 'completed'),
          sql`${bookings.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(routes.id, routes.origin, routes.destination)
      .orderBy(desc(count(bookings.id)))
      .limit(5);

    // Bus type performance
    const busTypeStats = await db
      .select({
        busType: busTypes.name,
        totalSeats: busTypes.totalSeats,
        bookings: count(bookings.id),
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS INTEGER)), 0)`,
      })
      .from(busTypes)
      .innerJoin(buses, eq(busTypes.id, buses.busTypeId))
      .innerJoin(trips, eq(buses.id, trips.busId))
      .innerJoin(bookings, eq(trips.id, bookings.tripId))
      .where(
        and(
          eq(bookings.paymentStatus, 'completed'),
          sql`${bookings.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(busTypes.id, busTypes.name, busTypes.totalSeats)
      .orderBy(desc(count(bookings.id)));

    res.json({
      dailyRevenue,
      popularRoutes,
      busTypeStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch analytics' 
    });
  }
});

export default router; 