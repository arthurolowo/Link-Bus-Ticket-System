import { db } from '../storage';
import { payments, bookings, trips } from '../schema';
import { eq } from 'drizzle-orm';

async function clearBookings() {
  try {
    console.log('Starting cleanup...');
    
    // First, delete all payments (due to foreign key constraints)
    console.log('Deleting all payments...');
    await db.delete(payments);
    console.log('✓ All payments deleted');

    // Then, delete all bookings
    console.log('Deleting all bookings...');
    await db.delete(bookings);
    console.log('✓ All bookings deleted');

    // Reset available seats on all trips
    console.log('Resetting available seats for all trips...');
    const allTrips = await db.select().from(trips);
    
    for (const trip of allTrips) {
      await db.update(trips)
        .set({ 
          availableSeats: trip.bus?.busType?.totalSeats || 50, // Default to 50 if busType not found
          status: 'scheduled'
        })
        .where(eq(trips.id, trip.id));
    }
    console.log('✓ Trip seats reset');

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearBookings()
  .then(() => {
    console.log('Script finished. You can now make new bookings.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 