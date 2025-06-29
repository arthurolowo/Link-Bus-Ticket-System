import { Router } from 'express';
import { db } from '../storage.js';
import { routes } from '../schema.js';
import { eq } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const { showAll } = req.query;
    const query = showAll ? db.select().from(routes) : db.select().from(routes).where(eq(routes.isActive, 1));
    const allRoutes = await query;
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

    // Validate required fields
    if (!origin || !destination || !distance || !estimatedDuration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if route already exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.origin, origin))
      .where(eq(routes.destination, destination));

    if (existingRoute.length > 0) {
      return res.status(400).json({ message: 'Route already exists' });
    }

    // Add new route
    const newRoute = await db.insert(routes).values({
      origin,
      destination,
      distance,
      estimatedDuration,
      isActive: isActive ?? 1
    }).returning();

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

    // Update route
    const updatedRoute = await db
      .update(routes)
      .set({
        origin,
        destination,
        distance,
        estimatedDuration,
        isActive
      })
      .where(eq(routes.id, parseInt(id)))
      .returning();

    if (updatedRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

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

    // Delete route
    const deletedRoute = await db
      .delete(routes)
      .where(eq(routes.id, parseInt(id)))
      .returning();

    if (deletedRoute.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 