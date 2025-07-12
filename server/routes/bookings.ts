import { Router } from 'express';
import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes, seats, bookingSchema } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { generateBookingReference } from '../utils/booking.js';

const router = Router();

// Timeout for pending bookings (15 minutes)
const BOOKING_TIMEOUT_MS = 15 * 60 * 1000;

// Function to cancel expired bookings
async function cancelExpiredBookings() {
  try {
    const expiredTime = new Date(Date.now() - BOOKING_TIMEOUT_MS);
    
    // Find expired pending bookings
    const expiredBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.paymentStatus, 'pending'),
          sql`${bookings.createdAt} < ${expiredTime}`
        )
      );

    if (expiredBookings.length === 0) return;

    console.log(`Cancelling ${expiredBookings.length} expired bookings...`);

    for (const booking of expiredBookings) {
      await db.transaction(async (tx) => {
        // Get all seats for this booking
        const bookingSeats = await tx
          .select()
          .from(seats)
          .where(eq(seats.bookingId, booking.id));

        // Delete seat records
        await tx
          .delete(seats)
          .where(eq(seats.bookingId, booking.id));

        // Update booking status to cancelled
        await tx
          .update(bookings)
          .set({ paymentStatus: 'cancelled' })
          .where(eq(bookings.id, booking.id));

        // Release seats back to trip
        if (bookingSeats.length > 0 && booking.tripId) {
          await tx
            .update(trips)
            .set({
              availableSeats: sql`${trips.availableSeats} + ${bookingSeats.length}`
            })
            .where(eq(trips.id, booking.tripId));
        }
      });
    }

    console.log(`Successfully cancelled ${expiredBookings.length} expired bookings`);
  } catch (error) {
    console.error('Error cancelling expired bookings:', error);
  }
}

// Run cleanup every 5 minutes
setInterval(cancelExpiredBookings, 5 * 60 * 1000);

// Also run once on startup
cancelExpiredBookings();

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
      console.error('Booking validation failed:', {
        data: bookingData,
        errors: validationResult.error.errors
      });
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

    // Create booking with multiple seats
    const newBooking = await db.transaction(async (tx) => {
      // Lock the trip row to prevent concurrent bookings
      const tripLock = await tx
        .select()
        .from(trips)
        .where(eq(trips.id, bookingData.tripId))
        .limit(1)
        .for('update');

      if (!tripLock.length || !tripLock[0]?.availableSeats || tripLock[0].availableSeats < bookingData.seatNumbers.length) {
        throw new Error('Not enough available seats');
      }

      // Check if any of the requested seats are already booked
      const existingSeatBookings = await tx
        .select({
          seatNumber: seats.seatNumber
        })
        .from(seats)
        .innerJoin(bookings, eq(seats.bookingId, bookings.id))
        .where(
          and(
            eq(bookings.tripId, bookingData.tripId),
            sql`${bookings.paymentStatus} IN ('completed', 'pending')`
          )
        );

      const bookedSeats = existingSeatBookings.map(b => b.seatNumber);
      const requestedSeats = bookingData.seatNumbers;
      
      const alreadyBookedSeats = requestedSeats.filter((seat: number) => bookedSeats.includes(seat));
      if (alreadyBookedSeats.length > 0) {
        throw new Error(`Seats ${alreadyBookedSeats.join(', ')} are already booked`);
      }

      // Generate booking reference
      const bookingReference = generateBookingReference();

      // Create the booking
      const now = new Date();
      console.log('Creating booking with timestamp:', now.toISOString());
      
      const [booking] = await tx
        .insert(bookings)
        .values({
          userId: req.user!.id,
          tripId: bookingData.tripId,
          bookingReference,
          totalAmount: bookingData.totalAmount,
          paymentStatus: 'pending',
          createdAt: now
        })
        .returning();

      if (!booking) {
        throw new Error('Failed to create booking');
      }

      // Insert seat records
      await tx
        .insert(seats)
        .values(
          bookingData.seatNumbers.map((seatNumber: number) => ({
            bookingId: booking.id,
            seatNumber,
            createdAt: new Date()
          }))
        );

      // Update available seats
      await tx
        .update(trips)
        .set({
          availableSeats: sql`${trips.availableSeats} - ${bookingData.seatNumbers.length}`
        })
        .where(eq(trips.id, bookingData.tripId));

      return booking;
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error instanceof Error) {
      if (error.message.includes('already booked')) {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Not enough available seats') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    } else {
      res.status(500).json({ message: 'Server error' });
    }
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
    const bookingId = parseInt(id);

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation of pending bookings
    if (booking.paymentStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending bookings can be cancelled' 
      });
    }

    // Cancel the booking and release all seats
    const result = await db.transaction(async (tx) => {
      // Get all seats for this booking
      const bookingSeats = await tx
        .select()
        .from(seats)
        .where(eq(seats.bookingId, bookingId));

      // Delete seat records
      await tx
        .delete(seats)
        .where(eq(seats.bookingId, bookingId));

      // Update booking status to cancelled
      const [cancelled] = await tx
        .update(bookings)
        .set({ paymentStatus: 'cancelled' })
        .where(eq(bookings.id, bookingId))
        .returning();

             // Release seats back to trip
       if (bookingSeats.length > 0 && booking.tripId) {
         await tx
           .update(trips)
           .set({
             availableSeats: sql`${trips.availableSeats} + ${bookingSeats.length}`
           })
           .where(eq(trips.id, booking.tripId));
       }

       return { booking: cancelled, releasedSeats: bookingSeats.length };
    });

    res.json(result);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking timeout info
router.get('/:id/timeout', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!booking.createdAt) {
      return res.status(400).json({ message: 'Booking has no creation date' });
    }

    const createdAt = new Date(booking.createdAt);
    const expiresAt = new Date(createdAt.getTime() + BOOKING_TIMEOUT_MS);
    const now = Date.now();
    let timeRemaining = Math.max(0, expiresAt.getTime() - now);

    // Cap the time remaining to the maximum timeout to prevent display issues
    timeRemaining = Math.min(timeRemaining, BOOKING_TIMEOUT_MS);

    // Debug logging
    const ageSinceCreation = now - createdAt.getTime();
    console.log('Booking timeout debug:', {
      bookingId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      now: new Date(now).toISOString(),
      timeoutMs: BOOKING_TIMEOUT_MS,
      timeoutMinutes: BOOKING_TIMEOUT_MS / (1000 * 60),
      ageSinceCreation,
      ageMinutes: Math.floor(ageSinceCreation / (1000 * 60)),
      timeRemainingMs: timeRemaining,
      timeRemainingMinutes: Math.floor(timeRemaining / (1000 * 60)),
      isExpired: timeRemaining === 0,
      shouldBeExpired: ageSinceCreation > BOOKING_TIMEOUT_MS
    });

    res.json({
      createdAt,
      expiresAt,
      timeRemaining,
      expired: timeRemaining === 0,
      status: booking.paymentStatus
    });
  } catch (error) {
    console.error('Error getting booking timeout:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 