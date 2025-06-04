import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRouteSchema, insertTripSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Route management
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.post("/api/routes", isAuthenticated, async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      res.json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(400).json({ message: "Invalid route data" });
    }
  });

  // Trip search and management
  app.get("/api/trips/search", async (req, res) => {
    try {
      const { origin, destination, date } = req.query;
      
      if (!origin || !destination || !date) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const trips = await storage.searchTrips(
        origin as string,
        destination as string,
        date as string
      );
      res.json(trips);
    } catch (error) {
      console.error("Error searching trips:", error);
      res.status(500).json({ message: "Failed to search trips" });
    }
  });

  // Weekly schedule endpoint
  app.get('/api/trips/weekly', async (req, res) => {
    try {
      const trips = await storage.getWeeklySchedule();
      res.json(trips);
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      res.status(500).json({ message: 'Failed to fetch weekly schedule' });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTripById(id);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  // Booking management
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Check seat availability and update trip
      const trip = await storage.getTripById(bookingData.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const seatCount = Array.isArray(bookingData.seatNumbers) 
        ? bookingData.seatNumbers.length 
        : 1;

      if (trip.availableSeats < seatCount) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      // Update trip availability
      await storage.updateTripAvailability(bookingData.tripId, seatCount);
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.get("/api/bookings/:reference", async (req, res) => {
    try {
      const booking = await storage.getBookingByReference(req.params.reference);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin routes
  app.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBookingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Payment processing (mock implementation)
  app.post("/api/payments/process", async (req, res) => {
    try {
      const { bookingId, paymentMethod } = req.body;
      
      // Mock payment processing
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        await storage.updateBookingPaymentStatus(bookingId, "completed");
        res.json({ success: true, message: "Payment processed successfully" });
      } else {
        await storage.updateBookingPaymentStatus(bookingId, "failed");
        res.status(400).json({ success: false, message: "Payment failed" });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Payment processing error" });
    }
  });

  // Bus type management
  app.get("/api/bus-types", async (req, res) => {
    try {
      const busTypes = await storage.getAllBusTypes();
      res.json(busTypes);
    } catch (error) {
      console.error("Error fetching bus types:", error);
      res.status(500).json({ message: "Failed to fetch bus types" });
    }
  });

  // Bus management
  app.get("/api/buses", isAuthenticated, async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      res.json(buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ message: "Failed to fetch buses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
