import { db } from "./db";
import { routes, busTypes, buses, trips } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(trips);
  await db.delete(buses);
  await db.delete(busTypes);
  await db.delete(routes);

  // Seed bus types
  const busTypeData = await db.insert(busTypes).values([
    {
      name: "Standard",
      description: "Comfortable seating with basic amenities",
      amenities: ["AC", "Reclining Seats"],
      seatLayout: { rows: 12, seatsPerRow: 4 },
      totalSeats: 48,
    },
    {
      name: "Executive",
      description: "Premium comfort with enhanced amenities",
      amenities: ["AC", "WiFi", "Power Outlets", "Entertainment"],
      seatLayout: { rows: 10, seatsPerRow: 3 },
      totalSeats: 30,
    },
    {
      name: "Luxury",
      description: "Highest level of comfort and service",
      amenities: ["AC", "WiFi", "Power Outlets", "Entertainment", "Refreshments", "Extra Legroom"],
      seatLayout: { rows: 8, seatsPerRow: 3 },
      totalSeats: 24,
    },
  ]).returning();

  // Seed routes
  const routeData = await db.insert(routes).values([
    { origin: "Kampala", destination: "Mbarara", distance: 290, estimatedDuration: 270 },
    { origin: "Kampala", destination: "Gulu", distance: 340, estimatedDuration: 315 },
    { origin: "Kampala", destination: "Jinja", distance: 87, estimatedDuration: 165 },
    { origin: "Kampala", destination: "Mbale", distance: 245, estimatedDuration: 240 },
    { origin: "Kampala", destination: "Fort Portal", distance: 320, estimatedDuration: 300 },
    { origin: "Kampala", destination: "Kasese", distance: 440, estimatedDuration: 360 },
    { origin: "Kampala", destination: "Arua", distance: 520, estimatedDuration: 420 },
    { origin: "Kampala", destination: "Lira", distance: 340, estimatedDuration: 330 },
    { origin: "Kampala", destination: "Soroti", distance: 350, estimatedDuration: 300 },
    { origin: "Kampala", destination: "Masaka", distance: 140, estimatedDuration: 150 },
    { origin: "Kampala", destination: "Hoima", distance: 230, estimatedDuration: 210 },
    { origin: "Kampala", destination: "Kabale", distance: 410, estimatedDuration: 390 },
    { origin: "Kampala", destination: "Tororo", distance: 200, estimatedDuration: 180 },
    { origin: "Mbarara", destination: "Kasese", distance: 150, estimatedDuration: 120 },
    { origin: "Jinja", destination: "Mbale", distance: 158, estimatedDuration: 120 },
  ]).returning();

  // Seed buses
  const busData = await db.insert(buses).values([
    { busNumber: "LB001", busTypeId: busTypeData[0].id },
    { busNumber: "LB002", busTypeId: busTypeData[0].id },
    { busNumber: "LB003", busTypeId: busTypeData[1].id },
    { busNumber: "LB004", busTypeId: busTypeData[1].id },
    { busNumber: "LB005", busTypeId: busTypeData[2].id },
    { busNumber: "LB006", busTypeId: busTypeData[0].id },
    { busNumber: "LB007", busTypeId: busTypeData[1].id },
    { busNumber: "LB008", busTypeId: busTypeData[2].id },
    { busNumber: "LB009", busTypeId: busTypeData[0].id },
    { busNumber: "LB010", busTypeId: busTypeData[1].id },
  ]).returning();

  // Seed trips for today and next few days
  const today = new Date();
  const tripData = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const tripDate = new Date(today);
    tripDate.setDate(today.getDate() + dayOffset);
    const dateString = tripDate.toISOString().split('T')[0];

    // Popular routes with multiple daily trips
    const popularRoutes = [
      { routeIndex: 0, times: ["06:00", "09:00", "12:00", "15:00", "18:00"], price: "45000" }, // Kampala-Mbarara
      { routeIndex: 1, times: ["07:00", "11:00", "15:00", "19:00"], price: "55000" }, // Kampala-Gulu
      { routeIndex: 2, times: ["06:30", "08:30", "10:30", "12:30", "14:30", "16:30", "18:30"], price: "25000" }, // Kampala-Jinja
      { routeIndex: 3, times: ["06:00", "10:00", "14:00", "17:00"], price: "40000" }, // Kampala-Mbale
      { routeIndex: 4, times: ["07:00", "13:00", "18:00"], price: "50000" }, // Kampala-Fort Portal
    ];

    popularRoutes.forEach(route => {
      route.times.forEach((time, timeIndex) => {
        const busIndex = (route.routeIndex + timeIndex) % busData.length;
        const bus = busData[busIndex];
        const routeInfo = routeData[route.routeIndex];
        
        // Calculate arrival time
        const [hours, minutes] = time.split(':').map(Number);
        const departureMinutes = hours * 60 + minutes;
        const arrivalMinutes = departureMinutes + (routeInfo.estimatedDuration || 180);
        const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
        const arrivalMins = arrivalMinutes % 60;
        const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;

        tripData.push({
          routeId: routeInfo.id,
          busId: bus.id,
          departureDate: dateString,
          departureTime: time,
          arrivalTime: arrivalTime,
          price: route.price,
          availableSeats: Math.floor(Math.random() * 20) + 15, // Random available seats
          status: "scheduled",
        });
      });
    });
  }

  await db.insert(trips).values(tripData);

  console.log("Database seeded successfully!");
  console.log(`- ${busTypeData.length} bus types`);
  console.log(`- ${routeData.length} routes`);
  console.log(`- ${busData.length} buses`);
  console.log(`- ${tripData.length} trips`);
}

// Run seeding if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };