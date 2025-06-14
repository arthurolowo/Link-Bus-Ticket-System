import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { insertRouteSchema, InsertRoute } from "./schema";

export async function registerRoutes(app: Express): Promise<Server> {

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

  app.post("/api/routes", async (req, res) => {
    try {
      const parsed = insertRouteSchema.parse(req.body);
      const routeData: InsertRoute = {
        ...parsed,
        distance: parsed.distance === undefined ? null : parsed.distance,
        estimatedDuration: parsed.estimatedDuration === undefined ? null : parsed.estimatedDuration,
        isActive: parsed.isActive === undefined ? null : parsed.isActive,
      };
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

  app.post("/api/trips", async (req, res) => {
    try {
      // TODO: Add Zod validation for trip creation
      const tripData = req.body as any;
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
      // TODO: Add Zod validation for booking creation
      const bookingData = req.body as any;
      
      // Check seat availability and update trip
      if (typeof bookingData.tripId !== "number") {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      const trip = await storage.getTripById(bookingData.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const seatCount = Array.isArray(bookingData.seatNumbers) 
        ? bookingData.seatNumbers.length 
        : 1;

      if (trip.availableSeats == null) {
        return res.status(400).json({ message: "Trip available seats is not set" });
      }
      if (trip.availableSeats < seatCount) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      // Update trip availability
      if (typeof bookingData.tripId === "number") {
        await storage.updateTripAvailability(bookingData.tripId, seatCount);
      } else {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
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

  // Admin routes

  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/stats", async (req, res) => {
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
  app.get("/api/buses", async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      res.json(buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ message: "Failed to fetch buses" });
    }
  });

  // Support/contact endpoint
  app.post("/api/support", async (req, res) => {
    const { name, email, phone, subject, category, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }
    // Here you could store the message in the database or send an email/notification
    // For now, just log it
    console.log("Support message received:", { name, email, phone, subject, category, message });
    return res.json({ success: true, message: "Support message received." });
  });

  const httpServer = createServer(app);
  return httpServer;
}
