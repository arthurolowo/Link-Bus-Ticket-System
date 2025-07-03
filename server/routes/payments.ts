import { Router } from 'express';
import { db } from '../storage';
import { auth } from '../middleware/auth';
import { eq } from 'drizzle-orm';
import { payments, bookings } from '../schema';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

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
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId)
    });

    if (payment) {
      await db.update(bookings)
        .set({ paymentStatus: 'completed' })
        .where(eq(bookings.id, payment.bookingId));
    }

    return true;
  } else {
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
    return false;
  }
};

// Initiate payment
router.post('/initiate', auth, async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, provider, phoneNumber, pin } = req.body;

    // Validate required fields
    if (!bookingId || !amount || !paymentMethod || !provider || !phoneNumber || !pin) {
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'Invalid PIN format' });
    }

    // Validate phone number format (Uganda)
    const phoneRegex = /^256[7][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use format: 256701234567' 
      });
    }

    // Validate booking exists and belongs to user
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        trip: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Create payment record
    const paymentId = uuidv4();
    const externalReference = `LB-${paymentId.slice(0, 8)}`;

    await db.insert(payments).values({
      id: paymentId,
      bookingId,
      amount,
      paymentMethod: `${provider}_mobile_money`,
      status: 'pending',
      externalReference,
      phoneNumber,
      createdAt: new Date()
    });

    // Simulate payment processing
    simulatePayment(paymentId, amount, provider)
      .catch(error => {
        console.error('Payment simulation error:', error);
      });

    return res.json({
      paymentId,
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
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        booking: true
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.booking.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized access to payment' });
    }

    return res.json({ status: payment.status });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check payment status'
    });
  }
});

export default router; 