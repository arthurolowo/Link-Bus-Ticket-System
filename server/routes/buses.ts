import { Router } from 'express';
import { db } from '../storage.js';
import { busTypes, buses } from '../schema.js';
import { eq } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get all bus types (public endpoint)
router.get('/types', async (req, res) => {
  try {
    const types = await db
      .select()
      .from(busTypes)
      .orderBy(busTypes.name);

    res.json(types);
  } catch (error) {
    console.error('Error fetching bus types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new bus type (admin only)
router.post('/types', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, description, amenities, totalSeats, seatLayout } = req.body;

    // Validate required fields
    if (!name || !totalSeats) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Add new bus type
    const newBusType = await db.insert(busTypes).values({
      name,
      description,
      amenities,
      totalSeats,
      seatLayout
    }).returning();

    res.status(201).json(newBusType[0]);
  } catch (error) {
    console.error('Error adding bus type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bus type (admin only)
router.put('/types/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { name, description, amenities, totalSeats, seatLayout } = req.body;

    // Validate required fields
    if (!name || !totalSeats) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update bus type
    const updatedBusType = await db
      .update(busTypes)
      .set({
        name,
        description,
        amenities,
        totalSeats,
        seatLayout
      })
      .where(eq(busTypes.id, parseInt(id)))
      .returning();

    if (updatedBusType.length === 0) {
      return res.status(404).json({ message: 'Bus type not found' });
    }

    res.json(updatedBusType[0]);
  } catch (error) {
    console.error('Error updating bus type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bus type (admin only)
router.delete('/types/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Delete bus type
    const deletedBusType = await db
      .delete(busTypes)
      .where(eq(busTypes.id, parseInt(id)))
      .returning();

    if (deletedBusType.length === 0) {
      return res.status(404).json({ message: 'Bus type not found' });
    }

    res.json({ message: 'Bus type deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all buses (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allBuses = await db
      .select({
        id: buses.id,
        busNumber: buses.busNumber,
        busTypeId: buses.busTypeId,
        isActive: buses.isActive,
        busType: {
          id: busTypes.id,
          name: busTypes.name,
          description: busTypes.description,
          amenities: busTypes.amenities,
          totalSeats: busTypes.totalSeats,
          seatLayout: busTypes.seatLayout,
        }
      })
      .from(buses)
      .innerJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(buses.busNumber);

    res.json(allBuses);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new bus (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { busNumber, busTypeId, isActive } = req.body;

    // Validate required fields
    if (!busNumber || !busTypeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Add new bus
    const newBus = await db.insert(buses).values({
      busNumber,
      busTypeId,
      isActive: isActive ?? 1
    }).returning();

    res.status(201).json(newBus[0]);
  } catch (error) {
    console.error('Error adding bus:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bus (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { busNumber, busTypeId, isActive } = req.body;

    // Validate required fields
    if (!busNumber || !busTypeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update bus
    const updatedBus = await db
      .update(buses)
      .set({
        busNumber,
        busTypeId,
        isActive
      })
      .where(eq(buses.id, parseInt(id)))
      .returning();

    if (updatedBus.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json(updatedBus[0]);
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bus (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Delete bus
    const deletedBus = await db
      .delete(buses)
      .where(eq(buses.id, parseInt(id)))
      .returning();

    if (deletedBus.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 