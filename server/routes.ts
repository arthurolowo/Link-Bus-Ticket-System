import type { Express, Request, Response, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./routes/auth";
import { verifyToken, AuthRequest } from "./middleware/auth";
import { 
  routeSchema, 
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

const router = Router();

router.use('/auth', authRouter);
router.use('/trips', tripsRouter);
router.use('/routes', routesRouter);

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api', router);
  return app.listen(3000);
}

export default router;
