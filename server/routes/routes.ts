import { Router } from 'express';
import { db } from '../storage.js';
import { routes } from '../schema.js';
import { eq, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get all routes
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all routes');
    const allRoutes = await db
      .select({
        id: routes.id,
        origin: routes.origin,
        destination: routes.destination,
        distance: routes.distance,
        estimatedDuration: routes.estimatedDuration,
        isActive: routes.isActive
      })
      .from(routes)
      .orderBy(routes.id);
    
    console.log(`Found ${allRoutes.length} routes:`, allRoutes);
    res.json(allRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new route (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { origin, destination, distance, estimatedDuration, isActive } = req.body;
    console.log('Adding new route:', { origin, destination, distance, estimatedDuration, isActive });

    // Validate required fields
    if (!origin || !destination || !distance || !estimatedDuration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types
    if (typeof origin !== 'string' || typeof destination !== 'string') {
      return res.status(400).json({ message: 'Invalid data types for origin or destination' });
    }

    if (typeof distance !== 'number' || typeof estimatedDuration !== 'number') {
      return res.status(400).json({ message: 'Invalid data types for distance or duration' });
    }

    // Check if route already exists - case insensitive comparison
    const existingRoute = await db
      .select()
      .from(routes)
      .where(
        sql`LOWER(${routes.origin}) = LOWER(${origin}) AND LOWER(${routes.destination}) = LOWER(${destination})`
      );

    if (existingRoute.length > 0) {
      return res.status(400).json({ message: 'Route already exists' });
    }

    // Add new route
    const newRoute = await db.insert(routes).values({
      origin: origin.toLowerCase(),
      destination: destination.toLowerCase(),
      distance,
      estimatedDuration,
      isActive: isActive ?? 1
    }).returning();

    console.log('Created new route:', newRoute[0]);
    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error('Error adding route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update route (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { origin, destination, distance, estimatedDuration, isActive } = req.body;

    // Validate required fields
    if (!origin || !destination || !distance || !estimatedDuration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types
    if (typeof origin !== 'string' || typeof destination !== 'string') {
      return res.status(400).json({ message: 'Invalid data types for origin or destination' });
    }

    if (typeof distance !== 'number' || typeof estimatedDuration !== 'number') {
      return res.status(400).json({ message: 'Invalid data types for distance or duration' });
    }

    // Check if route exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Update route
    const updatedRoute = await db
      .update(routes)
      .set({
        origin,
        destination,
        distance,
        estimatedDuration,
        isActive: isActive ?? existingRoute[0].isActive
      })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete route (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check if route exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Delete route
    await db
      .delete(routes)
      .where(eq(routes.id, parseInt(id)));

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle route status (admin only)
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    console.log('Toggle status request:', { id, isActive });

    // Validate isActive
    if (typeof isActive !== 'number' || ![0, 1].includes(isActive)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Check if route exists and get current status
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    if (existingRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    console.log('Found route before update:', existingRoute[0]);

    // Update route status
    const updatedRoute = await db
      .update(routes)
      .set({ isActive })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    console.log('Route after update:', updatedRoute[0]);

    // Verify the update
    const verifyRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)));

    console.log('Verified route still exists:', verifyRoute[0]);

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 