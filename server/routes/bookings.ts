import { Router } from 'express';
import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes, bookingSchema } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { generateBookingReference } from '../utils/booking.js';

const router = Router();

// Get all bookings for a user
router.get('/my-bookings', auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userBookings = await db
      .select({
        booking: bookings,
        trip: {
          ...trips,
          route: routes,
          bus: {
            ...buses,
            busType: busTypes
          }
        }
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(bookings.userId, req.user.id))
      .orderBy(sql`${bookings.createdAt} DESC`);

    res.json(userBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await db
      .select({
        booking: bookings,
        trip: {
          ...trips,
          route: routes,
          bus: {
            ...buses,
            busType: busTypes
          }
        }
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking[0].booking.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new booking
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const bookingData = {
      ...req.body,
      userId: req.user.id
    };

    // Validate booking data
    const validationResult = bookingSchema.safeParse(bookingData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid booking data',
        errors: validationResult.error.errors
      });
    }

    // Check if trip exists and is scheduled
    const trip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, bookingData.tripId))
      .limit(1);

    if (!trip.length || trip[0].status !== 'scheduled') {
      return res.status(400).json({ message: 'Invalid or unavailable trip' });
    }

    // Check if seat is available
    const existingSeatBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.tripId, bookingData.tripId),
          eq(bookings.seatNumber, bookingData.seatNumber)
        )
      );

    if (existingSeatBooking.length > 0) {
      return res.status(400).json({ message: 'Seat already booked' });
    }

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const newBooking = await db.transaction(async (tx) => {
      // Create the booking
      const booking = await tx
        .insert(bookings)
        .values({
          ...bookingData,
          bookingReference,
          paymentStatus: 'pending'
        })
        .returning();

      // Update available seats
      await tx
        .update(trips)
        .set({
          availableSeats: sql`${trips.availableSeats} - 1`
        })
        .where(eq(trips.id, bookingData.tripId));

      return booking[0];
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking payment status
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking[0].userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedBooking = await db
      .update(bookings)
      .set({ paymentStatus })
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    res.json(updatedBooking[0]);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking[0].userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation of pending or completed bookings
    const status = booking[0].paymentStatus || 'unknown';
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Cannot cancel booking in current status' });
    }

    const updatedBooking = await db.transaction(async (tx) => {
      // Update booking status
      const cancelled = await tx
        .update(bookings)
        .set({ paymentStatus: 'cancelled' })
        .where(eq(bookings.id, parseInt(id)))
        .returning();

      // Restore available seat if tripId exists
      if (booking[0].tripId) {
        await tx
          .update(trips)
          .set({
            availableSeats: sql`${trips.availableSeats} + 1`
          })
          .where(eq(trips.id, booking[0].tripId));
      }

      return cancelled[0];
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 