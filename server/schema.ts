import { pgTable, serial, varchar, integer, jsonb, date, time, text, boolean as pgBoolean, timestamp } from 'drizzle-orm/pg-core';
import { InferModel } from 'drizzle-orm';
import { z } from 'zod';

// USERS TABLE
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }),
  email: varchar('email', { length: 128 }).notNull(),
  password: varchar('password', { length: 128 }),
  phone: varchar('phone', { length: 32 }),
  isVerified: pgBoolean('is_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// BOOKINGS TABLE
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 64 }).references(() => users.id),
  tripId: integer('trip_id').references(() => trips.id),
  seatNumber: integer('seat_number'),
  bookingReference: varchar('booking_reference', { length: 64 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 32 }).default('pending'),
  totalAmount: varchar('total_amount', { length: 16 }),
  qrCode: varchar('qr_code', { length: 256 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type User = InferModel<typeof users>;
export type UpsertUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type Route = InferModel<typeof routes>;
export type InsertRoute = Omit<Route, 'id'>;

export const insertRouteSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  distance: z.number().nullable().optional(),
  estimatedDuration: z.number().nullable().optional(),
  isActive: z.number().nullable().optional(),
});
export type BusType = InferModel<typeof busTypes>;
export type InsertBusType = Omit<BusType, 'id'>;
export type Bus = InferModel<typeof buses>;
export type InsertBus = Omit<Bus, 'id'>;
export type Trip = InferModel<typeof trips>;
export type InsertTrip = Omit<Trip, 'id'>;
export type Booking = InferModel<typeof bookings>;
export type InsertBooking = Omit<Booking, 'id' | 'createdAt'>;

// TripWithDetails and BookingWithDetails types
export type TripWithDetails = Trip & {
  route: Route;
  bus: Bus & { busType: BusType };
};
export type BookingWithDetails = Booking & {
  trip: TripWithDetails;
};

export const busTypes = pgTable('bus_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  description: text('description'),
  amenities: jsonb('amenities'),
  seatLayout: jsonb('seat_layout'),
  totalSeats: integer('total_seats'),
});

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  origin: varchar('origin', { length: 64 }).notNull(),
  destination: varchar('destination', { length: 64 }).notNull(),
  distance: integer('distance'),
  estimatedDuration: integer('estimated_duration'),
  isActive: integer('is_active').default(1),
});

export const buses = pgTable('buses', {
  id: serial('id').primaryKey(),
  busNumber: varchar('bus_number', { length: 32 }).notNull(),
  busTypeId: integer('bus_type_id').references(() => busTypes.id),
  isActive: integer('is_active').default(1),
});

export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => routes.id),
  busId: integer('bus_id').references(() => buses.id),
  departureDate: date('departure_date').notNull(),
  departureTime: time('departure_time').notNull(),
  arrivalTime: time('arrival_time').notNull(),
  price: varchar('price', { length: 16 }).notNull(),
  availableSeats: integer('available_seats'),
  status: varchar('status', { length: 32 }),
});
