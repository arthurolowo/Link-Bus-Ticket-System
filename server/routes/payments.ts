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

// Helper function to get MTN MoMo access token
async function getMoMoAccessToken() {
  try {
    const auth = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString('base64');
    const response = await axios.post(`${MOMO_API_URL}/collection/token/`, null, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting MoMo access token:', error);
    throw new Error('Failed to authenticate with payment provider');
  }
}

// Initiate payment
router.post('/initiate', auth, async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, phoneNumber } = req.body;

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

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Create payment record
    const paymentId = uuidv4();
    const externalReference = `LB-${paymentId.slice(0, 8)}`;

    await db.insert(payments).values({
      id: paymentId,
      bookingId,
      amount,
      paymentMethod,
      status: 'pending',
      externalReference,
      phoneNumber,
      createdAt: new Date()
    });

    if (paymentMethod === 'mobile_money') {
      try {
        // Get MoMo access token
        const accessToken = await getMoMoAccessToken();

        // Initiate MoMo payment request
        const momoResponse = await axios.post(
          `${MOMO_API_URL}/collection/v1_0/requesttopay`,
          {
            amount,
            currency: 'UGX',
            externalId: externalReference,
            payer: {
              partyIdType: 'MSISDN',
              partyId: phoneNumber
            },
            payerMessage: `Bus ticket payment for booking ${booking.bookingReference}`,
            payeeNote: `Payment for ${booking.trip.route.origin} to ${booking.trip.route.destination}`
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Reference-Id': paymentId,
              'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
              'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY
            }
          }
        );

        return res.json({
          paymentId,
          status: 'pending',
          message: 'Payment initiated. Please check your phone for the payment prompt.'
        });
      } catch (error) {
        console.error('MoMo API Error:', error);
        
        // Update payment status to failed
        await db.update(payments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(payments.id, paymentId));

        throw new Error('Failed to initiate mobile money payment');
      }
    }

    throw new Error('Unsupported payment method');
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

    if (payment.booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to payment' });
    }

    if (payment.status !== 'pending') {
      return res.json({ status: payment.status });
    }

    // Check MoMo payment status
    try {
      const accessToken = await getMoMoAccessToken();
      const momoResponse = await axios.get(
        `${MOMO_API_URL}/collection/v1_0/requesttopay/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY
          }
        }
      );

      let newStatus = 'pending';
      if (momoResponse.data.status === 'SUCCESSFUL') {
        newStatus = 'completed';
      } else if (['FAILED', 'REJECTED', 'TIMEOUT'].includes(momoResponse.data.status)) {
        newStatus = 'failed';
      }

      // Update payment and booking status if payment is complete
      if (newStatus !== 'pending') {
        await db.update(payments)
          .set({ 
            status: newStatus, 
            updatedAt: new Date(),
            paymentDetails: momoResponse.data
          })
          .where(eq(payments.id, paymentId));

        if (newStatus === 'completed') {
          await db.update(bookings)
            .set({ paymentStatus: 'completed' })
            .where(eq(bookings.id, payment.bookingId));
        }
      }

      return res.json({ status: newStatus });
    } catch (error) {
      console.error('MoMo status check error:', error);
      throw new Error('Failed to check payment status');
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check payment status'
    });
  }
});

export default router; 