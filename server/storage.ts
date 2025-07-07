import {
  users,
  routes,
  busTypes,
  buses,
  trips,
  bookings,
  payments,
  usersRelations,
  routesRelations,
  busTypesRelations,
  busesRelations,
  tripsRelations,
  bookingsRelations,
  paymentsRelations,
  type DBUser,
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
  type Payment,
  type InsertPayment,
  type PaymentWithDetails,
} from "./schema.js";
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { 
  schema: { 
    users, 
    routes, 
    busTypes, 
    buses, 
    trips, 
    bookings, 
    payments,
    usersRelations,
    routesRelations,
    busTypesRelations,
    busesRelations,
    tripsRelations,
    bookingsRelations,
    paymentsRelations
  } 
});

export interface TripSearchFilters {
  minTime?: string;
  maxTime?: string;
  minPrice?: string;
  maxPrice?: string;
  busType?: string;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<DBUser | undefined>;
  upsertUser(userData: UpsertUser): Promise<DBUser>;
  updateUser(id: string, user: Partial<DBUser>): Promise<DBUser | undefined>;
  initiatePasswordReset(email: string): Promise<boolean>;

  // Route operations
  getAllRoutes(): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;

  // Bus type operations
  getAllBusTypes(): Promise<BusType[]>;
  createBusType(busType: InsertBusType): Promise<BusType>;
  updateBusType(id: number, busType: Partial<InsertBusType>): Promise<BusType | undefined>;
  deleteBusType(id: number): Promise<boolean>;

  // Bus operations
  getAllBuses(): Promise<(Bus & { busType: BusType })[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBus(id: number, bus: Partial<InsertBus>): Promise<Bus | undefined>;
  deleteBus(id: number): Promise<boolean>;

  // Trip operations
  searchTrips(origin: string, destination: string, date: string, filters?: TripSearchFilters): Promise<TripWithDetails[]>;
  getTripById(id: number): Promise<TripWithDetails | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  updateTripAvailability(tripId: number, seatsToBook: number): Promise<boolean>;
  cancelTrip(id: number): Promise<boolean>;
  getWeeklySchedule(): Promise<TripWithDetails[]>;
  getAllTrips(): Promise<TripWithDetails[]>;
  deleteTrip(id: number): Promise<boolean>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  cancelBooking(id: number): Promise<boolean>;
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

  // Admin stats
  getAdminStats(): Promise<{
    totalBookings: number;
    totalRevenue: string;
    activeRoutes: number;
    occupancyRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<DBUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<DBUser> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updated_at: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<DBUser>): Promise<DBUser | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async initiatePasswordReset(email: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return false;
    }

    // TODO: Implement actual password reset logic
    return true;
  }

  // Route operations
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.isActive, 1));
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db
      .insert(routes)
      .values({
        ...route,
        isActive: route.isActive ?? 1,
      })
      .returning();
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
      .set({ isActive: 0 })
      .where(eq(routes.id, id))
      .returning();
    return !!deletedRoute;
  }

  // Bus type operations
  async getAllBusTypes(): Promise<BusType[]> {
    return await db
      .select()
      .from(busTypes)
      .where(sql`1 = 1`);
  }

  async createBusType(busType: InsertBusType): Promise<BusType> {
    const [newBusType] = await db
      .insert(busTypes)
      .values(busType)
      .returning();
    return newBusType;
  }

  async updateBusType(id: number, busType: Partial<InsertBusType>): Promise<BusType | undefined> {
    const [updatedBusType] = await db
      .update(busTypes)
      .set(busType)
      .where(eq(busTypes.id, id))
      .returning();
    return updatedBusType;
  }

  async deleteBusType(id: number): Promise<boolean> {
    // First check if there are any buses using this bus type
    const [existingBus] = await db
      .select()
      .from(buses)
      .where(eq(buses.busTypeId, id))
      .limit(1);

    if (existingBus) {
      throw new Error('Cannot delete bus type that is in use by buses');
    }

    const [deletedBusType] = await db
      .delete(busTypes)
      .where(eq(busTypes.id, id))
      .returning();
    return !!deletedBusType;
  }

  // Bus operations
  async getAllBuses(): Promise<(Bus & { busType: BusType })[]> {
    return await db
      .select()
      .from(buses)
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(eq(buses.isActive, 1))
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

  async updateBus(id: number, busData: Partial<InsertBus>): Promise<Bus | undefined> {
    const [updatedBus] = await db
      .update(buses)
      .set(busData)
      .where(eq(buses.id, id))
      .returning();
    return updatedBus;
  }

  async deleteBus(id: number): Promise<boolean> {
    const [deletedBus] = await db
      .update(buses)
      .set({ isActive: 0 })
      .where(eq(buses.id, id))
      .returning();
    return !!deletedBus;
  }

  // Trip operations
  async searchTrips(
    origin: string,
    destination: string,
    date: string,
    filters?: TripSearchFilters
  ): Promise<TripWithDetails[]> {
    const whereClauses = [
      eq(routes.origin, origin),
      eq(routes.destination, destination),
      eq(trips.departureDate, date),
    ];

    if (filters) {
      if (filters.minTime) {
        whereClauses.push(gte(trips.departureTime, filters.minTime));
      }
      if (filters.maxTime) {
        whereClauses.push(lte(trips.departureTime, filters.maxTime));
      }
      if (filters.minPrice) {
        whereClauses.push(gte(trips.price, filters.minPrice));
      }
      if (filters.maxPrice) {
        whereClauses.push(lte(trips.price, filters.maxPrice));
      }
      if (filters.busType) {
        whereClauses.push(eq(busTypes.name, filters.busType));
      }
    }

    const results = await db
      .select({
        id: trips.id,
        routeId: trips.routeId,
        busId: trips.busId,
        departureDate: trips.departureDate,
        departureTime: trips.departureTime,
        arrivalTime: trips.arrivalTime,
        price: trips.price,
        availableSeats: trips.availableSeats,
        status: trips.status,
        route: {
          id: routes.id,
          origin: routes.origin,
          destination: routes.destination,
          distance: routes.distance,
          estimatedDuration: routes.estimatedDuration,
          isActive: routes.isActive,
        },
        bus: {
          id: buses.id,
          busNumber: buses.busNumber,
          busTypeId: buses.busTypeId,
          isActive: buses.isActive,
          busType: {
            id: busTypes.id,
            name: busTypes.name,
            description: busTypes.description,
            amenities: busTypes.amenities,
            seatLayout: busTypes.seatLayout,
            totalSeats: busTypes.totalSeats,
          },
        },
      })
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(and(...whereClauses))
      .orderBy(trips.departureTime);

    return results;
  }

  async getTripById(id: number): Promise<TripWithDetails | undefined> {
    const [result] = await db
      .select({
        trip: trips,
        route: routes,
        bus: buses,
        busType: busTypes,
      })
      .from(trips)
      .where(eq(trips.id, id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id));

    if (!result) return undefined;

    return {
      ...result.trip,
      route: result.route!,
      bus: {
        ...result.bus!,
        busType: result.busType!
      }
    };
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updatedTrip] = await db
      .update(trips)
      .set(tripData)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async updateTripAvailability(tripId: number, seatsToBook: number): Promise<boolean> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip || trip.availableSeats == null || trip.availableSeats < seatsToBook) {
      return false;
    }

    const [updatedTrip] = await db
      .update(trips)
      .set({ availableSeats: trip.availableSeats - seatsToBook })
      .where(eq(trips.id, tripId))
      .returning();

    return !!updatedTrip;
  }

  async cancelTrip(id: number): Promise<boolean> {
    const [cancelledTrip] = await db
      .update(trips)
      .set({ status: "cancelled" })
      .where(eq(trips.id, id))
      .returning();
    return !!cancelledTrip;
  }

  async getWeeklySchedule(): Promise<TripWithDetails[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const results = await db
      .select({
        trip: trips,
        route: routes,
        bus: buses,
        busType: busTypes,
      })
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .where(
        and(
          gte(trips.departureDate, today.toISOString().split('T')[0]),
          lte(trips.departureDate, nextWeek.toISOString().split('T')[0]),
          eq(trips.status, "scheduled")
        )
      )
      .orderBy(trips.departureDate, trips.departureTime);

    return results.map(row => ({
      ...row.trip,
      route: row.route!,
      bus: {
        ...row.bus!,
        busType: row.busType!
      }
    }));
  }

  async getAllTrips(): Promise<TripWithDetails[]> {
    const results = await db
      .select()
      .from(trips)
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id));

    return results.map(row => {
      const trip: Trip = {
        id: row.trips.id,
        routeId: row.trips.routeId,
        busId: row.trips.busId,
        departureDate: row.trips.departureDate,
        departureTime: row.trips.departureTime,
        arrivalTime: row.trips.arrivalTime,
        price: row.trips.price,
        availableSeats: row.trips.availableSeats,
        status: row.trips.status,
      };

      const route: Route = row.routes!;
      const bus: Bus = row.buses!;
      const busType: BusType = row.bus_types!;

      return {
        ...trip,
        route,
        bus: {
          ...bus,
          busType
        }
      };
    });
  }

  async deleteTrip(id: number): Promise<boolean> {
    const [deletedTrip] = await db
      .delete(trips)
      .where(eq(trips.id, id))
      .returning();
    return !!deletedTrip;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async cancelBooking(id: number): Promise<boolean> {
    const [cancelledBooking] = await db
      .update(bookings)
      .set({ paymentStatus: "cancelled" })
      .where(eq(bookings.id, id))
      .returning();
    return !!cancelledBooking;
  }

  async getBookingByReference(reference: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        bus: buses,
        busType: busTypes,
      })
      .from(bookings)
      .where(eq(bookings.bookingReference, reference))
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id));

    if (!result) return undefined;

    return {
      ...result.booking,
      trip: {
        ...result.trip!,
        route: result.route!,
        bus: {
          ...result.bus!,
          busType: result.busType!
        }
      }
    };
  }

  async getUserBookings(userId: string): Promise<BookingWithDetails[]> {
    const results = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        bus: buses,
        busType: busTypes,
      })
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(desc(bookings.createdAt));

    return results.map(row => ({
      ...row.booking,
      trip: {
        ...row.trip!,
        route: row.route!,
        bus: {
          ...row.bus!,
          busType: row.busType!
        }
      }
    }));
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const results = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        bus: buses,
        busType: busTypes,
      })
      .from(bookings)
      .leftJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(routes, eq(trips.routeId, routes.id))
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .orderBy(desc(bookings.createdAt));

    return results.map(row => ({
      ...row.booking,
      trip: {
        ...row.trip!,
        route: row.route!,
        bus: {
          ...row.bus!,
          busType: row.busType!
        }
      }
    }));
  }

  async updateBookingPaymentStatus(id: number, status: string): Promise<boolean> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ paymentStatus: status })
      .where(eq(bookings.id, id))
      .returning();
    return !!updatedBooking;
  }

  // Analytics
  async getBookingStats(): Promise<{
    totalBookings: number;
    totalRevenue: string;
    activeRoutes: number;
    occupancyRate: number;
  }> {
    const [bookingStats] = await db
      .select({
        totalBookings: sql<number>`count(*)`,
      })
      .from(bookings)
      .where(eq(bookings.paymentStatus, "completed"));

    const [revenueStats] = await db
      .select({
        totalRevenue: sql<string>`sum(cast(total_amount as decimal))`,
      })
      .from(bookings)
      .where(eq(bookings.paymentStatus, "completed"));

    const [routeStats] = await db
      .select({
        activeRoutes: sql<number>`count(*)`,
      })
      .from(routes)
      .where(eq(routes.isActive, 1));

    const [occupancyStats] = await db
      .select({
        totalSeats: sql<number>`sum(bt.total_seats)`,
        bookedSeats: sql<number>`count(b.id)`,
      })
      .from(trips)
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .leftJoin(bookings, eq(bookings.tripId, trips.id))
      .where(eq(trips.status, "completed"));

    const totalBookings = bookingStats?.totalBookings || 0;
    const totalRevenue = revenueStats?.totalRevenue || "0";
    const activeRoutes = routeStats?.activeRoutes || 0;
    const { totalSeats = 0, bookedSeats = 0 } = occupancyStats || {};
    const occupancyRate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

    return {
      totalBookings,
      totalRevenue: totalRevenue.toString(),
      activeRoutes,
      occupancyRate,
    };
  }

  // Admin stats
  async getAdminStats(): Promise<{
    totalBookings: number;
    totalRevenue: string;
    activeRoutes: number;
    occupancyRate: number;
  }> {
    // Get total bookings
    const [bookingsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);
    const totalBookings = bookingsResult?.count || 0;

    // Get total revenue
    const [revenueResult] = await db
      .select({ sum: sql<string>`sum(cast(total_amount as decimal))` })
      .from(bookings)
      .where(eq(bookings.paymentStatus, 'completed'));
    const totalRevenue = revenueResult?.sum || '0';

    // Get active routes
    const [routesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(routes)
      .where(eq(routes.isActive, 1));
    const activeRoutes = routesResult?.count || 0;

    // Calculate occupancy rate
    const [occupancyResult] = await db
      .select({
        booked: sql<number>`count(distinct ${bookings.id})`.as('booked'),
        total: sql<number>`sum(${busTypes.totalSeats})`.as('total')
      })
      .from(trips)
      .leftJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
      .leftJoin(bookings, eq(trips.id, bookings.tripId))
      .where(eq(trips.status, 'completed'));
    
    const occupancyRate = occupancyResult?.total
      ? Math.round((occupancyResult.booked / occupancyResult.total) * 100)
      : 0;

    return {
      totalBookings,
      totalRevenue,
      activeRoutes,
      occupancyRate,
    };
  }
}

export const storage = new DatabaseStorage();
