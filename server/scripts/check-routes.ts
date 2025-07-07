import { db } from '../storage.js';
import { routes } from '../schema.js';

async function checkRoutes() {
  try {
    const allRoutes = await db
      .select()
      .from(routes)
      .orderBy(routes.id);

    console.log('\nAll Routes in Database:');
    console.log('======================');
    allRoutes.forEach(route => {
      console.log(`${route.origin} → ${route.destination}`);
      console.log(`Distance: ${route.distance}km`);
      console.log(`Duration: ${route.estimatedDuration} minutes`);
      console.log(`Status: ${route.isActive ? 'Active' : 'Inactive'}`);
      console.log('----------------------');
    });

    console.log(`\nTotal Routes: ${allRoutes.length}`);
  } catch (error) {
    console.error('Error checking routes:', error);
  }
}

checkRoutes(); 