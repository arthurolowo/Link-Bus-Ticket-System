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
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bus routes
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  origin: varchar("origin", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  distance: integer("distance"), // in kilometers
  estimatedDuration: integer("estimated_duration"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bus types/classes
export const busTypes = pgTable("bus_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // Standard, Executive, Luxury
  description: text("description"),
  amenities: jsonb("amenities"), // WiFi, AC, etc.
  seatLayout: jsonb("seat_layout"), // seat configuration
  totalSeats: integer("total_seats").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buses
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: varchar("bus_number", { length: 20 }).notNull().unique(),
  busTypeId: integer("bus_type_id").references(() => busTypes.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled trips
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").references(() => routes.id),
  busId: integer("bus_id").references(() => buses.id),
  departureDate: date("departure_date").notNull(),
  departureTime: time("departure_time").notNull(),
  arrivalTime: time("arrival_time").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  availableSeats: integer("available_seats").notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, departed, arrived, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  bookingReference: varchar("booking_reference", { length: 20 }).notNull().unique(),
  passengerName: varchar("passenger_name", { length: 100 }).notNull(),
  passengerPhone: varchar("passenger_phone", { length: 20 }).notNull(),
  passengerEmail: varchar("passenger_email", { length: 100 }),
  seatNumbers: jsonb("seat_numbers").notNull(), // array of seat numbers
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default("2000"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, completed, failed
  paymentMethod: varchar("payment_method", { length: 20 }), // card, mobile_money, bank_transfer
  bookingStatus: varchar("booking_status", { length: 20 }).default("confirmed"), // confirmed, cancelled
  qrCode: text("qr_code"), // QR code data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
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

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
}));

// Insert schemas
export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertBusTypeSchema = createInsertSchema(busTypes).omit({
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
export type BusType = typeof busTypes.$inferSelect;
export type InsertBusType = z.infer<typeof insertBusTypeSchema>;
export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Extended types for API responses
export type TripWithDetails = Trip & {
  route: Route;
  bus: Bus & {
    busType: BusType;
  };
};

export type BookingWithDetails = Booking & {
  trip: TripWithDetails;
};
