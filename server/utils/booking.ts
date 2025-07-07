import { randomBytes } from 'crypto';
import { db } from '../storage.js';
import { bookings, trips, routes, buses, busTypes } from '../schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Generates a unique booking reference number
 * Format: LBXXXX-YYYY-ZZZZ where X, Y, Z are alphanumeric characters
 */
export function generateBookingReference(): string {
  const segment1 = randomBytes(2).toString('hex').toUpperCase();
  const segment2 = randomBytes(2).toString('hex').toUpperCase();
  const segment3 = randomBytes(2).toString('hex').toUpperCase();
  
  return `LB${segment1}-${segment2}-${segment3}`;
}

/**
 * Validates a booking reference number format
 */
export function isValidBookingReference(reference: string): boolean {
  const pattern = /^LB[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return pattern.test(reference);
}

/**
 * Generates a QR code data URL for a booking
 * The QR code will contain the booking reference and other essential details
 */
export function generateBookingQRCode(bookingData: {
  reference: string;
  tripId: number;
  seatNumber: number;
  userId: string;
}): string {
  // For now, we'll just stringify the data
  // In a production environment, this should be encrypted or signed
  const qrData = JSON.stringify(bookingData);
  return qrData;
}

// Calculate trip price based on distance and bus type
export async function calculateTripPrice(routeId: number, busId: number): Promise<string> {
  try {
    // Get route and bus details
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);

    const [bus] = await db
      .select()
      .from(buses)
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(buses.id, busId))
      .limit(1);

    if (!route || !bus) {
      throw new Error('Invalid route or bus');
    }

    // Base rate per kilometer based on bus type
    let baseRate;
    switch (bus.bus_types.name.toLowerCase()) {
      case 'vip':
        baseRate = 300;
        break;
      case 'business':
        baseRate = 250;
        break;
      default: // Economy
        baseRate = 200;
        break;
    }

    const distance = route.distance || 0;
    // Round up to nearest 1000 UGX
    const price = Math.ceil((distance * baseRate) / 1000) * 1000;
    
    return price.toString();
  } catch (error) {
    console.error('Error calculating trip price:', error);
    throw error;
  }
} 