import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage.js';
import { payments, bookings, users, trips, paymentSchema } from '../schema.js';
import { eq, sql } from 'drizzle-orm';
import { auth, AuthRequest, generateToken } from '../middleware/auth.js';

const router = Router();

// MTN MoMo API Configuration
const MOMO_API_URL = process.env.MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com';
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const MOMO_API_USER = process.env.MOMO_API_USER;
const MOMO_API_KEY = process.env.MOMO_API_KEY;

// Simulated mobile money processing
const simulatePayment = async (paymentId: string, amount: string, provider: string) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success (90% success rate)
  const success = Math.random() < 0.9;
  
  if (success) {
    try {
      // First find the payment
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId));

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      await db.update(payments)
        .set({ 
          status: 'completed', 
          updatedAt: new Date(),
          paymentDetails: JSON.stringify({
            transactionId: `${provider.toUpperCase()}-${Date.now()}`,
            status: 'SUCCESSFUL',
            amount,
            currency: 'UGX',
            reason: 'Payment completed successfully'
          })
        })
        .where(eq(payments.id, paymentId));

      // Update booking status
      await db.update(bookings)
        .set({ paymentStatus: 'completed' })
        .where(eq(bookings.id, payment.bookingId));

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  } else {
    try {
      // Update payment status to failed
      await db.update(payments)
        .set({ 
          status: 'failed', 
          updatedAt: new Date(),
          paymentDetails: JSON.stringify({
            status: 'FAILED',
            reason: 'Insufficient funds or network error'
          })
        })
        .where(eq(payments.id, paymentId));

      // Get the payment to find the booking
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId));

      if (payment) {
        // Update booking status to failed and release the seat
        await db.transaction(async (tx) => {
          // Update booking status
          await tx.update(bookings)
            .set({ paymentStatus: 'failed' })
            .where(eq(bookings.id, payment.bookingId));

          // Get the booking to find the trip
          const [booking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.id, payment.bookingId));

          if (booking) {
            // Increment available seats back
            await tx.update(trips)
              .set({
                availableSeats: sql`${trips.availableSeats} + 1`
              })
              .where(eq(trips.id, Number(booking.tripId)));
          }
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }
};

// Initiate payment
router.post('/initiate', auth, async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, provider, phoneNumber, password } = req.body;

    // Validate payment data
    const validationResult = paymentSchema.safeParse({
      bookingId,
      amount,
      paymentMethod,
      phoneNumber
    });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid payment data',
        errors: validationResult.error.errors
      });
    }

    // Verify user's password
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id));

    if (!user || !user.password) {
      return res.status(401).json({ message: 'User not found or invalid password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Validate phone number format (Uganda)
    const phoneRegex = /^256[7][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use format: 256701234567' 
      });
    }

    // Validate booking exists and belongs to user
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Create payment record
    const paymentId = uuidv4();
    const externalReference = `LB-${paymentId.slice(0, 8)}`;

    const [newPayment] = await db.insert(payments).values({
      id: paymentId,
      bookingId: bookingId,
      amount,
      paymentMethod: `${provider}_mobile_money`,
      status: 'pending',
      externalReference,
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Start payment simulation
    simulatePayment(paymentId, amount, provider)
      .catch(error => {
        console.error('Payment simulation error:', error);
      });

    return res.json({
      paymentId: newPayment.id,
      bookingReference: booking.bookingReference,
      status: 'pending',
      message: `Payment initiated. Processing ${provider.toUpperCase()} Mobile Money payment...`
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to initiate payment'
    });
  }
});

// Check payment status
router.get('/:paymentId/status', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment details
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Get booking to verify ownership
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId));

    if (!booking || booking.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized access to payment' });
    }

    return res.json({ 
      status: payment.status,
      paymentDetails: payment.paymentDetails ? JSON.parse(payment.paymentDetails) : null
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check payment status'
    });
  }
});

export default router; 