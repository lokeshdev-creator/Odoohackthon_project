import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { Trip } from "@/models/Trip";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { FuelLog } from "@/models/FuelLog";
import { Expense } from "@/models/Expense";
import { Notification } from "@/models/Notification";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Clear database collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});
    await Notification.deleteMany({});

    // 2. Hash default password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 3. Seed users
    const users = await User.create([
      {
        name: "Alice Admin",
        email: "admin@transitops.com",
        password: hashedPassword,
        role: "Admin",
      },
      {
        name: "Bob Fleet Manager",
        email: "manager@transitops.com",
        password: hashedPassword,
        role: "Fleet Manager",
      },
      {
        name: "Charlie Dispatcher",
        email: "dispatcher@transitops.com",
        password: hashedPassword,
        role: "Dispatcher",
      },
      {
        name: "Dave Safety Officer",
        email: "safety@transitops.com",
        password: hashedPassword,
        role: "Safety Officer",
      },
      {
        name: "Eve Financial Analyst",
        email: "finance@transitops.com",
        password: hashedPassword,
        role: "Financial Analyst",
      },
    ]);

    // 4. Seed vehicles
    const vehicles = await Vehicle.create([
      {
        registrationNumber: "NY-9872-TX",
        name: "Heavy Duty Volvo FH16",
        model: "Volvo FH16 2024",
        type: "Heavy Truck",
        capacity: 25000,
        odometer: 142000,
        acquisitionCost: 135000,
        purchaseDate: new Date("2023-05-15"),
        status: "Available",
      },
      {
        registrationNumber: "CA-1234-SF",
        name: "Ford Transit Delivery Van",
        model: "Ford Transit 2023",
        type: "Cargo Van",
        capacity: 1500,
        odometer: 48000,
        acquisitionCost: 42000,
        purchaseDate: new Date("2023-08-10"),
        status: "Available",
      },
      {
        registrationNumber: "TX-5541-DA",
        name: "Kenworth T680 Semi",
        model: "Kenworth T680 2022",
        type: "Semi Trailer",
        capacity: 36000,
        odometer: 285000,
        acquisitionCost: 155000,
        purchaseDate: new Date("2022-03-20"),
        status: "In Shop",
      },
      {
        registrationNumber: "FL-8890-MI",
        name: "Mercedes-Benz Sprinter",
        model: "Sprinter 2500 2023",
        type: "Cargo Van",
        capacity: 2000,
        odometer: 32000,
        acquisitionCost: 48000,
        purchaseDate: new Date("2023-11-05"),
        status: "On Trip",
      },
      {
        registrationNumber: "IL-4455-CH",
        name: "Isuzu NPR Box Truck",
        model: "Isuzu NPR-HD 2020",
        type: "Box Truck",
        capacity: 6500,
        odometer: 189000,
        acquisitionCost: 65000,
        purchaseDate: new Date("2020-07-18"),
        status: "Retired",
      },
    ]);

    // 5. Seed drivers
    const drivers = await Driver.create([
      {
        name: "John Doe",
        phone: "+1 (555) 019-2834",
        email: "john.doe@transitops.com",
        licenseNumber: "DL-NY883921",
        licenseCategory: "Class A CDL",
        licenseExpiry: new Date("2027-10-15"),
        safetyScore: 98,
        status: "Available",
      },
      {
        name: "Sarah Jenkins",
        phone: "+1 (555) 014-9988",
        email: "sarah.j@transitops.com",
        licenseNumber: "DL-CA112233",
        licenseCategory: "Class B CDL",
        licenseExpiry: new Date("2028-04-20"),
        safetyScore: 95,
        status: "Available",
      },
      {
        name: "Michael Miller",
        phone: "+1 (555) 012-7744",
        email: "michael.m@transitops.com",
        licenseNumber: "DL-TX445566",
        licenseCategory: "Class A CDL",
        licenseExpiry: new Date("2026-12-05"),
        safetyScore: 88,
        status: "On Trip",
      },
      {
        name: "Robert Smith",
        phone: "+1 (555) 017-6655",
        email: "robert.s@transitops.com",
        licenseNumber: "DL-FL887799",
        licenseCategory: "Class C",
        licenseExpiry: new Date("2023-01-10"), // Expired License
        safetyScore: 90,
        status: "Off Duty",
      },
      {
        name: "David Lopez",
        phone: "+1 (555) 011-2233",
        email: "david.l@transitops.com",
        licenseNumber: "DL-IL998877",
        licenseCategory: "Class A CDL",
        licenseExpiry: new Date("2027-02-14"),
        safetyScore: 72,
        status: "Suspended", // Suspended Driver
      },
    ]);

    // 6. Seed active/completed trips
    const trips = await Trip.create([
      {
        source: "Los Angeles, CA",
        destination: "San Francisco, CA",
        vehicleId: vehicles[1]._id, // Ford Transit
        driverId: drivers[0]._id, // John Doe
        cargoWeight: 1200,
        plannedDistance: 615,
        actualDistance: 620,
        fuelConsumed: 95,
        revenue: 1800,
        status: "Completed",
        dispatchDate: new Date("2026-07-01T08:00:00"),
        completionDate: new Date("2026-07-02T16:30:00"),
      },
      {
        source: "Dallas, TX",
        destination: "Houston, TX",
        vehicleId: vehicles[0]._id, // Volvo Heavy Truck
        driverId: drivers[1]._id, // Sarah Jenkins
        cargoWeight: 18500,
        plannedDistance: 385,
        actualDistance: 385,
        fuelConsumed: 140,
        revenue: 2900,
        status: "Completed",
        dispatchDate: new Date("2026-07-05T06:00:00"),
        completionDate: new Date("2026-07-05T12:00:00"),
      },
      {
        source: "New York, NY",
        destination: "Chicago, IL",
        vehicleId: vehicles[3]._id, // Sprinter (On Trip)
        driverId: drivers[2]._id, // Michael Miller (On Trip)
        cargoWeight: 1600,
        plannedDistance: 1270,
        revenue: 4500,
        status: "Dispatched",
        dispatchDate: new Date("2026-07-10T10:00:00"),
      },
      {
        source: "Miami, FL",
        destination: "Atlanta, GA",
        vehicleId: vehicles[1]._id,
        driverId: drivers[0]._id,
        cargoWeight: 1100,
        plannedDistance: 1060,
        revenue: 3800,
        status: "Draft",
      },
    ]);

    // 7. Seed maintenance logs
    const maintenance = await MaintenanceLog.create([
      {
        vehicleId: vehicles[2]._id, // Kenworth (In Shop)
        type: "Engine Overhaul",
        description: "Replaced cylinder head gaskets and inspected injectors.",
        cost: 4500,
        startDate: new Date("2026-07-08"),
        endDate: new Date("2026-07-15"),
        status: "Open",
      },
      {
        vehicleId: vehicles[0]._id, // Volvo
        type: "Scheduled Oil Change",
        description: "Standard 50k mile service, replaced oil and fuel filters.",
        cost: 350,
        startDate: new Date("2026-06-12"),
        endDate: new Date("2026-06-12"),
        status: "Closed",
      },
    ]);

    // 8. Seed fuel logs
    const fuelLogs = await FuelLog.create([
      {
        vehicleId: vehicles[1]._id,
        liters: 95,
        cost: 114,
        odometer: 48000,
        date: new Date("2026-07-02"),
      },
      {
        vehicleId: vehicles[0]._id,
        liters: 140,
        cost: 210,
        odometer: 142000,
        date: new Date("2026-07-05"),
      },
    ]);

    // 9. Seed expenses
    await Expense.create([
      {
        vehicleId: vehicles[1]._id,
        category: "Fuel",
        amount: 114,
        description: "Fuel Refill: 95 Liters for trip SF-LA",
        date: new Date("2026-07-02"),
      },
      {
        vehicleId: vehicles[0]._id,
        category: "Fuel",
        amount: 210,
        description: "Fuel Refill: 140 Liters for trip DL-HS",
        date: new Date("2026-07-05"),
      },
      {
        vehicleId: vehicles[0]._id,
        category: "Maintenance",
        amount: 350,
        description: "Service: Scheduled Oil Change - Standard 50k mile service",
        date: new Date("2026-06-12"),
      },
      {
        vehicleId: vehicles[0]._id,
        category: "Toll",
        amount: 45,
        description: "Dallas Turnpike toll charges",
        date: new Date("2026-07-05"),
      },
      {
        vehicleId: vehicles[1]._id,
        category: "Insurance",
        amount: 250,
        description: "Monthly fleet insurance premium allocation",
        date: new Date("2026-07-01"),
      },
    ]);

    // 10. Seed notifications
    await Notification.create([
      {
        type: "LicenseExpiry",
        title: "Driver License Expired",
        message: "Driver Robert Smith license expired on 2023-01-10. Suspension active.",
        read: false,
      },
      {
        type: "MaintenanceReminder",
        title: "Upcoming Service Reminder",
        message: "Vehicle CA-1234-SF is approaching 50,000 km. Schedule regular maintenance.",
        read: false,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      seededCounts: {
        users: users.length,
        vehicles: vehicles.length,
        drivers: drivers.length,
        trips: trips.length,
        maintenanceLogs: maintenance.length,
        fuelLogs: fuelLogs.length,
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
