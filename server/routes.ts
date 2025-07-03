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

const router = Router();

router.use('/auth', authRouter);
router.use('/trips', tripsRouter);
router.use('/routes', routesRouter);
router.use('/buses', busesRouter);
router.use('/bookings', bookingsRouter);
router.use('/payments', paymentsRoutes);

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api', router);
  return app.listen(3000);
}

export default router;
