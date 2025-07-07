import { pgTable, serial, varchar, integer, jsonb, date, time, text, boolean as pgBoolean, timestamp } from 'drizzle-orm/pg-core';
import { InferModel, relations } from 'drizzle-orm';
import { z } from 'zod';
import { mysqlTable, int } from 'drizzle-orm/mysql-core';

// USERS TABLE
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  email: varchar('email', { length: 128 }).notNull().unique(),
  password: varchar('password', { length: 128 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  is_admin: pgBoolean('is_admin').default(false),
  is_verified: pgBoolean('is_verified').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ROUTES TABLE
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  origin: varchar('origin', { length: 64 }).notNull(),
  destination: varchar('destination', { length: 64 }).notNull(),
  distance: integer('distance'),
  estimatedDuration: integer('estimated_duration'),
  isActive: integer('is_active').default(1),
});

// BUS TYPES TABLE
export const busTypes = pgTable('bus_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  description: text('description'),
  amenities: jsonb('amenities').$type<string[]>(),
  seatLayout: jsonb('seat_layout').$type<{
    rows: number;
    columns: number;
    seats: {
      number: string;
      type: 'regular' | 'premium' | 'disabled';
      position: { row: number; column: number };
    }[];
  }>(),
  totalSeats: integer('total_seats').notNull(),
});

// BUSES TABLE
export const buses = pgTable('buses', {
  id: serial('id').primaryKey(),
  busNumber: varchar('bus_number', { length: 32 }).notNull(),
  busTypeId: integer('bus_type_id').references(() => busTypes.id).notNull(),
  isActive: integer('is_active').default(1),
});

// TRIPS TABLE
export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => routes.id),
  busId: integer('bus_id').references(() => buses.id),
  departureDate: varchar('departure_date', { length: 10 }).notNull(),
  departureTime: varchar('departure_time', { length: 5 }).notNull(),
  arrivalTime: varchar('arrival_time', { length: 5 }).notNull(),
  price: varchar('price', { length: 10 }).notNull(),
  availableSeats: integer('available_seats'),
  status: varchar('status', { length: 32 }).default('scheduled'),
});

// BOOKINGS TABLE
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 64 }).references(() => users.id),
  tripId: integer('trip_id').references(() => trips.id),
  seatNumber: integer('seat_number'),
  bookingReference: varchar('booking_reference', { length: 32 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 32 }).default('pending'),
  totalAmount: varchar('total_amount', { length: 10 }),
  qrCode: varchar('qr_code', { length: 256 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// PAYMENTS TABLE
export const payments = pgTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  amount: varchar('amount', { length: 255 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  externalReference: varchar('external_reference', { length: 50 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  paymentDetails: text('payment_details'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  trips: many(trips),
}));

export const busTypesRelations = relations(busTypes, ({ many }) => ({
  buses: many(buses),
}));

export const busesRelations = relations(buses, ({ one, many }) => ({
  busType: one(busTypes, {
    fields: [buses.busTypeId],
    references: [busTypes.id],
  }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.id],
  }),
  bus: one(buses, {
    fields: [trips.busId],
    references: [buses.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

// Types
export type DBUser = InferModel<typeof users, 'select'>;
export type UpsertUser = InferModel<typeof users, 'insert'>;
export type Route = InferModel<typeof routes>;
export type InsertRoute = InferModel<typeof routes, 'insert'>;
export type BusType = InferModel<typeof busTypes>;
export type InsertBusType = InferModel<typeof busTypes, 'insert'>;
export type Bus = InferModel<typeof buses>;
export type InsertBus = InferModel<typeof buses, 'insert'>;
export type Trip = InferModel<typeof trips>;
export type InsertTrip = InferModel<typeof trips, 'insert'>;
export type Booking = InferModel<typeof bookings>;
export type InsertBooking = InferModel<typeof bookings, 'insert'>;
export type Payment = InferModel<typeof payments>;
export type InsertPayment = InferModel<typeof payments, 'insert'>;

// Composite types with relations
export type TripWithDetails = Trip & {
  route: Route;
  bus: Bus & { busType: BusType };
};

export type BookingWithDetails = Booking & {
  trip: TripWithDetails;
  payments?: Payment[];
};

export type PaymentWithDetails = Payment & {
  booking: BookingWithDetails;
};

// Validation schemas
export const userSchema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email().max(128),
  password: z.string().min(6).max(128),
  phone: z.string().min(10).max(32).optional(),
  is_admin: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});

export const routeSchema = z.object({
  origin: z.string().min(2).max(64),
  destination: z.string().min(2).max(64),
  distance: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  isActive: z.number().int().min(0).max(1).optional(),
});

export const busTypeSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  seatLayout: z.object({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
    seats: z.array(z.object({
      number: z.string(),
      type: z.enum(['regular', 'premium', 'disabled']),
      position: z.object({
        row: z.number().int(),
        column: z.number().int(),
      }),
    })),
  }).optional(),
  totalSeats: z.number().int().positive(),
});

export const busSchema = z.object({
  busNumber: z.string().min(2).max(32),
  busTypeId: z.number().int().positive(),
  isActive: z.number().int().min(0).max(1).optional(),
});

export const tripSchema = z.object({
  routeId: z.number().int().positive(),
  busId: z.number().int().positive(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.string().regex(/^\d+(\.\d{2})?$/),
  availableSeats: z.number().int().min(0).optional(),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
});

export const bookingSchema = z.object({
  userId: z.string().min(1).max(64),
  tripId: z.number().int().positive(),
  seatNumber: z.number().int().positive(),
  totalAmount: z.string().regex(/^\d+(\.\d{2})?$/),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
});

export const paymentSchema = z.object({
  bookingId: z.number().int().positive(),
  amount: z.string().regex(/^\d+(\.\d{2})?$/),
  paymentMethod: z.string().min(2).max(50),
  phoneNumber: z.string().regex(/^256[7][0-9]{8}$/),
});
