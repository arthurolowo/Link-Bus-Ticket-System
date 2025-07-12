import type { Express, Request, Response, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  busSchema, 
  busTypeSchema, 
  tripSchema, 
  bookingSchema,
  userSchema,
  bookings,
  trips,
  routes,
  buses,
  busTypes
} from "./schema";
import { Router } from 'express';
import tripsRouter from './routes/trips.js';
import { eq, and, sql } from 'drizzle-orm';
import authRouter from './routes/auth.js';
import routesRouter from './routes/routes.js';
import busesRouter from './routes/buses.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRoutes from './routes/payments';
import adminRouter from './routes/admin.js';
import { getSystemHealth } from './utils/health-check.js';

const router = Router();

// Health check endpoint for Render
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.use('/auth', authRouter);
router.use('/trips', tripsRouter);
router.use('/routes', routesRouter);
router.use('/buses', busesRouter);
router.use('/bus-types', (req, res, next) => {
  // Rewrite the path to use the /types endpoint in busesRouter
  req.url = '/types' + req.url;
  next();
}, busesRouter);
router.use('/bookings', bookingsRouter);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRouter);

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api', router);
  return app.listen(3000);
}

export default router;
