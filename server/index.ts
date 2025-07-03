import 'dotenv/config';
// console.log('DEBUG: DATABASE_URL loaded:', process.env.DATABASE_URL);
// console.log('DEBUG: PORT loaded:', process.env.PORT);
import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import router from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import tripsRoutes from './routes/trips.js';
import bookingsRoutes from './routes/bookings.js';
import routesRoutes from './routes/routes.js';
import { createServer } from "http";

const app = express();
const port = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow both Vite dev server and production
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log request
  console.log(`Incoming ${req.method} request to ${path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
  }
  if (req.method === 'GET' && req.query) {
    console.log('Query params:', req.query);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API Routes
app.use('/api', router);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Detailed error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ 
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Setup Vite or serve static files
if (isDev) {
  // In development, setup Vite middleware
  const server = createServer(app);
  setupVite(app, server).then(() => {
    server.listen(port, () => {
      log(`Development server running on port ${port}`);
      log(`API available at http://localhost:${port}/api`);
    });
  });
} else {
  // In production, serve built files
  serveStatic(app);
  app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: './dist' });
  });
  
  app.listen(port, () => {
    log(`Production server running on port ${port}`);
    log(`API available at http://localhost:${port}/api`);
  });
}
