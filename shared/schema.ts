import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer").notNull(), // customer, staff, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bus routes
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  origin: varchar("origin").notNull(),
  destination: varchar("destination").notNull(),
  distance: integer("distance"), // in kilometers
  duration: integer("duration"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bus fleet
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  number: varchar("number").unique().notNull(), // Bus number/plate
  type: varchar("type").notNull(), // standard, executive, luxury
  capacity: integer("capacity").notNull(),
  amenities: text("amenities").array(), // wifi, ac, entertainment, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled trips
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  busId: integer("bus_id").notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: time("departure_time").notNull(),
  arrivalTime: time("arrival_time").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  availableSeats: integer("available_seats").notNull(),
  status: varchar("status").default("scheduled").notNull(), // scheduled, boarding, departed, arrived, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingReference: varchar("booking_reference").unique().notNull(),
  userId: varchar("user_id"),
  tripId: integer("trip_id").notNull(),
  passengerName: varchar("passenger_name").notNull(),
  passengerPhone: varchar("passenger_phone").notNull(),
  passengerEmail: varchar("passenger_email"),
  seatNumbers: text("seat_numbers").array().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default("2000"),
  status: varchar("status").default("pending").notNull(), // pending, confirmed, cancelled, completed
  paymentStatus: varchar("payment_status").default("pending").notNull(), // pending, paid, failed, refunded
  paymentMethod: varchar("payment_method"), // card, mobile_money, bank_transfer
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const routeRelations = relations(routes, ({ many }) => ({
  trips: many(trips),
}));

export const busRelations = relations(buses, ({ many }) => ({
  trips: many(trips),
}));

export const tripRelations = relations(trips, ({ one, many }) => ({
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

export const bookingRelations = relations(bookings, ({ one }) => ({
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingReference: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Extended types for API responses
export type TripWithDetails = Trip & {
  route: Route;
  bus: Bus;
};

export type BookingWithDetails = Booking & {
  trip: TripWithDetails;
};
