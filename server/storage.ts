import {
  users,
  routes,
  busTypes,
  buses,
  trips,
  bookings,
  type User,
  type UpsertUser,
  type Route,
  type InsertRoute,
  type BusType,
  type InsertBusType,
  type Bus,
  type InsertBus,
  type Trip,
  type InsertTrip,
  type TripWithDetails,
  type Booking,
  type InsertBooking,
  type BookingWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Route operations
  getAllRoutes(): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;

  // Bus type operations
  getAllBusTypes(): Promise<BusType[]>;
  createBusType(busType: InsertBusType): Promise<BusType>;

  // Bus operations
  getAllBuses(): Promise<(Bus & { busType: BusType })[]>;
  createBus(bus: InsertBus): Promise<Bus>;

  // Trip operations
  searchTrips(origin: string, destination: string, date: string): Promise<TripWithDetails[]>;
  getTripById(id: number): Promise<TripWithDetails | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTripAvailability(tripId: number, seatsToBook: number): Promise<boolean>;
  getWeeklySchedule(): Promise<TripWithDetails[]>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingByReference(reference: string): Promise<BookingWithDetails | undefined>;
  getUserBookings(userId: string): Promise<BookingWithDetails[]>;
  getAllBookings(): Promise<BookingWithDetails[]>;
  updateBookingPaymentStatus(id: number, status: string): Promise<boolean>;

  // Analytics
  getBookingStats(): Promise<{
    totalBookings: number;
    totalRevenue: string;
    activeRoutes: number;
    occupancyRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Route operations
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.isActive, true));
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined> {
    const [updatedRoute] = await db
      .update(routes)
      .set(route)
      .where(eq(routes.id, id))
      .returning();
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<boolean> {
    const [deletedRoute] = await db
      .update(routes)
      .set({ isActive: false })
      .where(eq(routes.id, id))
      .returning();
    return !!deletedRoute;
  }

  // Bus type operations
  async getAllBusTypes(): Promise<BusType[]> {
    return await db.select().from(busTypes);
  }

  async createBusType(busType: InsertBusType): Promise<BusType> {
    const [newBusType] = await db.insert(busTypes).values(busType).returning();
    return newBusType;
  }

  // Bus operations
  async getAllBuses(): Promise<(Bus & { busType: BusType })[]> {
    return await db
      .select()
      .from(buses)
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(buses.isActive, true))
      .then(rows => 
        rows.map(row => ({
          ...row.buses,
          busType: row.bus_types!,
        }))
      );
  }

  async createBus(bus: InsertBus): Promise<Bus> {
    const [newBus] = await db.insert(buses).values(bus).returning();
    return newBus;
  }

  // Trip operations
  async searchTrips(origin: string, destination: string, date: string): Promise<TripWithDetails[]> {
    return await db
      .select()
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(
        and(
          eq(routes.origin, origin),
          eq(routes.destination, destination),
          eq(trips.departureDate, date),
          eq(trips.status, "scheduled"),
          gte(trips.availableSeats, 1)
        )
      )
      .then(rows =>
        rows.map(row => ({
          ...row.trips,
          route: row.routes!,
          bus: {
            ...row.buses!,
            busType: row.bus_types!,
          },
        }))
      );
  }

  async getTripById(id: number): Promise<TripWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(trips.id, id));

    if (!result) return undefined;

    return {
      ...result.trips,
      route: result.routes!,
      bus: {
        ...result.buses!,
        busType: result.bus_types!,
      },
    };
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTripAvailability(tripId: number, seatsToBook: number): Promise<boolean> {
    const [updatedTrip] = await db
      .update(trips)
      .set({
        availableSeats: sql`${trips.availableSeats} - ${seatsToBook}`,
      })
      .where(eq(trips.id, tripId))
      .returning();
    return !!updatedTrip;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Generate booking reference
    const reference = `LB${Date.now().toString().slice(-6)}`;
    
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        bookingReference: reference,
        qrCode: `booking:${reference}`, // Simple QR code data
      })
      .returning();
    return newBooking;
  }

  async getBookingByReference(reference: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(bookings.bookingReference, reference));

    if (!result) return undefined;

    return {
      ...result.bookings,
      trip: {
        ...result.trips!,
        route: result.routes!,
        bus: {
          ...result.buses!,
          busType: result.bus_types!,
        },
      },
    };
  }

  async getUserBookings(userId: string): Promise<BookingWithDetails[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt))
      .then(rows =>
        rows.map(row => ({
          ...row.bookings,
          trip: {
            ...row.trips!,
            route: row.routes!,
            bus: {
              ...row.buses!,
              busType: row.bus_types!,
            },
          },
        }))
      );
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(desc(bookings.createdAt))
      .then(rows =>
        rows.map(row => ({
          ...row.bookings,
          trip: {
            ...row.trips!,
            route: row.routes!,
            bus: {
              ...row.buses!,
              busType: row.bus_types!,
            },
          },
        }))
      );
  }

  async updateBookingPaymentStatus(id: number, status: string): Promise<boolean> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ paymentStatus: status })
      .where(eq(bookings.id, id))
      .returning();
    return !!updatedBooking;
  }

  // Trip operations
  async getWeeklySchedule(): Promise<TripWithDetails[]> {
    // Get today's date and the date 7 days from now
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    // Query trips in the next 7 days (inclusive)
    const tripsThisWeek = await db
      .select()
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(and(
        gte(trips.departureDate, todayStr),
        lte(trips.departureDate, nextWeekStr)
      ));

    return tripsThisWeek.map(row => ({
      ...row.trips,
      route: row.routes!,
      bus: {
        ...row.buses!,
        busType: row.bus_types!,
      },
    }));
  }

  // Analytics
  async getBookingStats(): Promise<{
    totalBookings: number;
    totalRevenue: string;
    activeRoutes: number;
    occupancyRate: number;
  }> {
    const [bookingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.paymentStatus, "completed"));

    const [revenueResult] = await db
      .select({ total: sql<string>`sum(${bookings.totalAmount})` })
      .from(bookings)
      .where(eq(bookings.paymentStatus, "completed"));

    const [routeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(routes)
      .where(eq(routes.isActive, true));

    // Simple occupancy calculation
    const occupancyRate = 85; // Mock value for now

    return {
      totalBookings: bookingCount.count || 0,
      totalRevenue: revenueResult.total || "0",
      activeRoutes: routeCount.count || 0,
      occupancyRate,
    };
  }
}

export const storage = new DatabaseStorage();
