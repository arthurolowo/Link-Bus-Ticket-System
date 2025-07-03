import { randomBytes } from 'crypto';

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