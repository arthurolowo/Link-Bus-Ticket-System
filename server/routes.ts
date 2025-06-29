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
  userSchema
} from "./schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth routes
  app.use('/api/auth', authRoutes);

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

  app.post("/api/routes", verifyToken, async (req: Request, res: Response) => {
    try {
      const routeData = routeSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      res.json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(400).json({ message: "Invalid route data" });
    }
  });

  app.put("/api/routes/:id", verifyToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const routeData = routeSchema.partial().parse(req.body);
      const updatedRoute = await storage.updateRoute(id, routeData);
      
      if (!updatedRoute) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(updatedRoute);
    } catch (error) {
      console.error("Error updating route:", error);
      res.status(400).json({ message: "Invalid route data" });
    }
  });

  app.delete("/api/routes/:id", verifyToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoute(id);
      
      if (!success) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json({ message: "Route deleted successfully" });
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ message: "Failed to delete route" });
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

  app.post("/api/bus-types", verifyToken, async (req: AuthRequest, res) => {
    try {
      const busTypeData = busTypeSchema.parse(req.body);
      const busType = await storage.createBusType(busTypeData);
      res.json(busType);
    } catch (error) {
      console.error("Error creating bus type:", error);
      res.status(400).json({ message: "Invalid bus type data" });
    }
  });

  app.put("/api/bus-types/:id", verifyToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const busTypeData = busTypeSchema.partial().parse(req.body);
      const updatedBusType = await storage.updateBusType(id, busTypeData);
      
      if (!updatedBusType) {
        return res.status(404).json({ message: "Bus type not found" });
      }
      
      res.json(updatedBusType);
    } catch (error) {
      console.error("Error updating bus type:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid bus type data" });
    }
  });

  app.delete("/api/bus-types/:id", verifyToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBusType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bus type not found" });
      }
      
      res.json({ message: "Bus type deleted successfully" });
    } catch (error) {
      console.error("Error deleting bus type:", error);
      if (error instanceof Error && error.message.includes('in use')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete bus type" });
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

  app.post("/api/buses", verifyToken, async (req: AuthRequest, res) => {
    try {
      const busData = busSchema.parse(req.body);
      const bus = await storage.createBus(busData);
      res.json(bus);
    } catch (error) {
      console.error("Error creating bus:", error);
      res.status(400).json({ message: "Invalid bus data" });
    }
  });

  app.put("/api/buses/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const busData = busSchema.partial().parse(req.body);
      const updatedBus = await storage.updateBus(id, busData);
      
      if (!updatedBus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      res.json(updatedBus);
    } catch (error) {
      console.error("Error updating bus:", error);
      res.status(400).json({ message: "Invalid bus data" });
    }
  });

  app.delete("/api/buses/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBus(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      res.json({ message: "Bus deleted successfully" });
    } catch (error) {
      console.error("Error deleting bus:", error);
      res.status(500).json({ message: "Failed to delete bus" });
    }
  });

  // Trip management
  app.get("/api/trips/search", async (req, res) => {
    try {
      const { origin, destination, date, minTime, maxTime, minPrice, maxPrice, busType } = req.query;
      
      if (!origin || !destination || !date) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const trips = await storage.searchTrips(
        origin as string,
        destination as string,
        date as string,
        {
          minTime: minTime as string | undefined,
          maxTime: maxTime as string | undefined,
          minPrice: minPrice as string | undefined,
          maxPrice: maxPrice as string | undefined,
          busType: busType as string | undefined,
        }
      );
      res.json(trips);
    } catch (error) {
      console.error("Error searching trips:", error);
      res.status(500).json({ message: "Failed to search trips" });
    }
  });

  app.post("/api/trips", verifyToken, async (req: AuthRequest, res) => {
    try {
      const tripData = tripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.put("/api/trips/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const tripData = tripSchema.partial().parse(req.body);
      const updatedTrip = await storage.updateTrip(id, tripData);
      
      if (!updatedTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.delete("/api/trips/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.cancelTrip(id);
      
      if (!success) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json({ message: "Trip cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling trip:", error);
      res.status(500).json({ message: "Failed to cancel trip" });
    }
  });

  // Booking management
  app.post("/api/bookings", verifyToken, async (req: Request, res: Response) => {
    try {
      const bookingRef = `LB${Date.now().toString().slice(-6)}`;
      const bookingData = {
        ...bookingSchema.parse(req.body),
        userId: req.user?.id,
        bookingReference: bookingRef,
        qrCode: `booking:${bookingRef}`,
      };
      
      // Check seat availability
      const trip = await storage.getTripById(bookingData.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (!trip.availableSeats || trip.availableSeats < 1) {
        return res.status(400).json({ message: "No seats available" });
      }

      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      // Update trip availability
      await storage.updateTripAvailability(bookingData.tripId, 1);
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.put("/api/bookings/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookingData = bookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(id, bookingData);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.delete("/api/bookings/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.cancelBooking(id);
      
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // User profile management
  app.put("/api/auth/me", verifyToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userData = userSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Password reset
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      await storage.initiatePasswordReset(email);
      
      // Always return success to prevent email enumeration
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Error initiating password reset:", error);
      res.status(500).json({ message: "Failed to initiate password reset" });
    }
  });

  // Analytics
  app.get("/api/analytics/booking-stats", verifyToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getBookingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      res.status(500).json({ message: "Failed to fetch booking stats" });
    }
  });

  app.get("/api/analytics/weekly-schedule", verifyToken, async (req: AuthRequest, res) => {
    try {
      const schedule = await storage.getWeeklySchedule();
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching weekly schedule:", error);
      res.status(500).json({ message: "Failed to fetch weekly schedule" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
