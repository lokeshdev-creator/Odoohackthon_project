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

    // 3. Seed users (with Indian names)
    const users = await User.create([
      {
        name: "Rajesh Kumar",
        email: "admin@transitops.com",
        password: hashedPassword,
        role: "Admin",
      },
      {
        name: "Vikram Malhotra",
        email: "manager@transitops.com",
        password: hashedPassword,
        role: "Fleet Manager",
      },
      {
        name: "Priya Sharma",
        email: "dispatcher@transitops.com",
        password: hashedPassword,
        role: "Dispatcher",
      },
      {
        name: "Gurpreet Singh",
        email: "safety@transitops.com",
        password: hashedPassword,
        role: "Safety Officer",
      },
      {
        name: "Sunita Mehta",
        email: "finance@transitops.com",
        password: hashedPassword,
        role: "Financial Analyst",
      },
    ]);

    // Reference dates based on Current time: 2026-07-12
    const now = new Date();
    const getRelativeDate = (daysAgo: number, hoursAgo: number = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);
      return date;
    };

    // 4. Seed vehicles (Indian registration format and vehicle types)
    const vehicles = await Vehicle.create([
      {
        registrationNumber: "MH-12-PQ-8821",
        name: "Tata Signa 5530.S",
        model: "Tata Signa 2024",
        type: "Heavy Truck",
        capacity: 35000,
        odometer: 120150,
        acquisitionCost: 45000,
        purchaseDate: new Date("2024-02-15"),
        status: "On Trip", // Active on Trip 7
      },
      {
        registrationNumber: "DL-3C-AG-1420",
        name: "Ashok Leyland Ecomet 1615",
        model: "Leyland Ecomet 2023",
        type: "Box Truck",
        capacity: 10000,
        odometer: 45270,
        acquisitionCost: 28000,
        purchaseDate: new Date("2023-09-10"),
        status: "On Trip", // Active on Trip 6
      },
      {
        registrationNumber: "KA-03-MK-7744",
        name: "Mahindra Bolero Pickup",
        model: "Bolero Maxi Truck 2023",
        type: "Cargo Van",
        capacity: 1500,
        odometer: 25350,
        acquisitionCost: 11000,
        purchaseDate: new Date("2023-12-05"),
        status: "Available",
      },
      {
        registrationNumber: "HR-26-CN-5590",
        name: "BharatBenz 2823R",
        model: "BharatBenz 2823 2022",
        type: "Heavy Truck",
        capacity: 20000,
        odometer: 85530,
        acquisitionCost: 42000,
        purchaseDate: new Date("2022-05-20"),
        status: "In Shop", // In shop for brake overhaul
      },
      {
        registrationNumber: "MH-43-XY-1122",
        name: "Eicher Pro 2049",
        model: "Eicher Pro 2021",
        type: "Box Truck",
        capacity: 3500,
        odometer: 60570,
        acquisitionCost: 16000,
        purchaseDate: new Date("2021-08-18"),
        status: "Available",
      },
    ]);

    // 5. Seed drivers (Indian names, phone numbers and licenses)
    const drivers = await Driver.create([
      {
        name: "Ramesh Yadav",
        phone: "+91 98765 43210",
        email: "ramesh.yadav@transitops.com",
        licenseNumber: "DL-MH12-2020-0012345",
        licenseCategory: "Class A CDL",
        licenseExpiry: getRelativeDate(-500), // Far in the future
        safetyScore: 98,
        status: "Available",
      },
      {
        name: "Suresh Prasad",
        phone: "+91 87654 32109",
        email: "suresh.prasad@transitops.com",
        licenseNumber: "DL-DL03-2018-0987654",
        licenseCategory: "Class B CDL",
        licenseExpiry: getRelativeDate(-450),
        safetyScore: 92,
        status: "On Trip", // Active on Trip 6
      },
      {
        name: "Gurpreet Singh",
        phone: "+91 76543 21098",
        email: "gurpreet.singh@transitops.com",
        licenseNumber: "DL-HR26-2015-0123456",
        licenseCategory: "Class A CDL",
        licenseExpiry: getRelativeDate(-300),
        safetyScore: 88,
        status: "On Trip", // Active on Trip 7
      },
      {
        name: "Vijay Mhatre",
        phone: "+91 91234 56789",
        email: "vijay.mhatre@transitops.com",
        licenseNumber: "DL-KA03-2021-0087654",
        licenseCategory: "Class C",
        licenseExpiry: getRelativeDate(-600),
        safetyScore: 90,
        status: "Available",
      },
      {
        name: "Anil Kumble",
        phone: "+91 90123 45678",
        email: "anil.kumble@transitops.com",
        licenseNumber: "DL-MH43-2012-0011223",
        licenseCategory: "Class A CDL",
        licenseExpiry: getRelativeDate(30), // Expired 30 days ago
        safetyScore: 72,
        status: "Suspended",
      },
    ]);

    // 6. Seed active/completed trips spanning the last 1 week (July 5th to July 12th)
    const trips = await Trip.create([
      {
        source: "Mumbai, MH",
        destination: "Pune, MH",
        vehicleId: vehicles[0]._id, // Tata Signa
        driverId: drivers[0]._id, // Ramesh Yadav
        cargoWeight: 28000,
        plannedDistance: 150,
        actualDistance: 150,
        fuelConsumed: 60,
        revenue: 1200,
        status: "Completed",
        dispatchDate: getRelativeDate(6, 4), // 6 days ago
        completionDate: getRelativeDate(6),
      },
      {
        source: "Delhi, DL",
        destination: "Jaipur, RJ",
        vehicleId: vehicles[1]._id, // Ashok Leyland
        driverId: drivers[1]._id, // Suresh Prasad
        cargoWeight: 8500,
        plannedDistance: 270,
        actualDistance: 270,
        fuelConsumed: 90,
        revenue: 1800,
        status: "Completed",
        dispatchDate: getRelativeDate(5, 6), // 5 days ago
        completionDate: getRelativeDate(5),
      },
      {
        source: "Bangalore, KA",
        destination: "Chennai, TN",
        vehicleId: vehicles[2]._id, // Mahindra Bolero
        driverId: drivers[3]._id, // Vijay Mhatre
        cargoWeight: 1200,
        plannedDistance: 350,
        actualDistance: 360,
        fuelConsumed: 45,
        revenue: 950,
        status: "Completed",
        dispatchDate: getRelativeDate(4, 8), // 4 days ago
        completionDate: getRelativeDate(4),
      },
      {
        source: "Mumbai, MH",
        destination: "Ahmedabad, GJ",
        vehicleId: vehicles[3]._id, // BharatBenz
        driverId: drivers[2]._id, // Gurpreet Singh
        cargoWeight: 18000,
        plannedDistance: 530,
        actualDistance: 535,
        fuelConsumed: 175,
        revenue: 2800,
        status: "Completed",
        dispatchDate: getRelativeDate(3, 2), // 3 days ago
        completionDate: getRelativeDate(2), // 2 days ago
      },
      {
        source: "Hyderabad, TS",
        destination: "Bangalore, KA",
        vehicleId: vehicles[4]._id, // Eicher Pro
        driverId: drivers[0]._id, // Ramesh Yadav
        cargoWeight: 3000,
        plannedDistance: 570,
        actualDistance: 570,
        fuelConsumed: 120,
        revenue: 1600,
        status: "Completed",
        dispatchDate: getRelativeDate(2, 6), // 2 days ago
        completionDate: getRelativeDate(1), // 1 day ago
      },
      {
        source: "Delhi, DL",
        destination: "Chandigarh, CH",
        vehicleId: vehicles[1]._id, // Ashok Leyland (On Trip)
        driverId: drivers[1]._id, // Suresh Prasad (On Trip)
        cargoWeight: 7000,
        plannedDistance: 250,
        revenue: 1100,
        status: "Dispatched",
        dispatchDate: getRelativeDate(1, 2), // 1 day ago
      },
      {
        source: "Mumbai, MH",
        destination: "Pune, MH",
        vehicleId: vehicles[0]._id, // Tata Signa (On Trip)
        driverId: drivers[2]._id, // Gurpreet Singh (On Trip)
        cargoWeight: 25000,
        plannedDistance: 150,
        revenue: 1000,
        status: "Dispatched",
        dispatchDate: getRelativeDate(0, 5), // 5 hours ago
      },
      {
        source: "Chennai, TN",
        destination: "Bangalore, KA",
        vehicleId: vehicles[2]._id,
        driverId: drivers[3]._id,
        cargoWeight: 1400,
        plannedDistance: 350,
        revenue: 900,
        status: "Draft",
      },
    ]);

    // 7. Seed maintenance logs
    const maintenance = await MaintenanceLog.create([
      {
        vehicleId: vehicles[3]._id, // BharatBenz (In Shop)
        type: "Brake System Repair",
        description: "Replaced worn out brake pads and drums, bled the brake lines.",
        cost: 500,
        startDate: getRelativeDate(2),
        endDate: getRelativeDate(-2), // 2 days from now
        status: "Open",
      },
      {
        vehicleId: vehicles[4]._id, // Eicher Pro
        type: "Routine Service",
        description: "Replaced engine oil, air filter, and cabin filter.",
        cost: 150,
        startDate: getRelativeDate(7),
        endDate: getRelativeDate(7),
        status: "Closed",
      },
    ]);

    // 8. Seed fuel logs (matching completed trips)
    const fuelLogs = await FuelLog.create([
      {
        vehicleId: vehicles[0]._id,
        liters: 60,
        cost: 72,
        odometer: 120090,
        date: getRelativeDate(6, 2),
      },
      {
        vehicleId: vehicles[1]._id,
        liters: 90,
        cost: 108,
        odometer: 45180,
        date: getRelativeDate(5, 3),
      },
      {
        vehicleId: vehicles[2]._id,
        liters: 45,
        cost: 54,
        odometer: 25045,
        date: getRelativeDate(4, 4),
      },
      {
        vehicleId: vehicles[3]._id,
        liters: 175,
        cost: 210,
        odometer: 85175,
        date: getRelativeDate(3, 1),
      },
      {
        vehicleId: vehicles[4]._id,
        liters: 120,
        cost: 144,
        odometer: 60120,
        date: getRelativeDate(2, 3),
      },
    ]);

    // 9. Seed expenses
    await Expense.create([
      {
        vehicleId: vehicles[0]._id,
        category: "Fuel",
        amount: 72,
        description: "Fuel Refill: 60 Liters for Trip Mumbai-Pune",
        date: getRelativeDate(6, 2),
      },
      {
        vehicleId: vehicles[1]._id,
        category: "Fuel",
        amount: 108,
        description: "Fuel Refill: 90 Liters for Trip Delhi-Jaipur",
        date: getRelativeDate(5, 3),
      },
      {
        vehicleId: vehicles[2]._id,
        category: "Fuel",
        amount: 54,
        description: "Fuel Refill: 45 Liters for Trip Bangalore-Chennai",
        date: getRelativeDate(4, 4),
      },
      {
        vehicleId: vehicles[3]._id,
        category: "Fuel",
        amount: 210,
        description: "Fuel Refill: 175 Liters for Trip Mumbai-Ahmedabad",
        date: getRelativeDate(3, 1),
      },
      {
        vehicleId: vehicles[4]._id,
        category: "Fuel",
        amount: 144,
        description: "Fuel Refill: 120 Liters for Trip Hyderabad-Bangalore",
        date: getRelativeDate(2, 3),
      },
      {
        vehicleId: vehicles[3]._id,
        category: "Toll",
        amount: 45,
        description: "National Highway tolls (Mumbai-Ahmedabad)",
        date: getRelativeDate(3),
      },
      {
        vehicleId: vehicles[4]._id,
        category: "Toll",
        amount: 35,
        description: "Highway tolls (Hyderabad-Bangalore)",
        date: getRelativeDate(2),
      },
      {
        vehicleId: vehicles[2]._id,
        category: "Insurance",
        amount: 250,
        description: "Monthly fleet insurance premium allocation",
        date: getRelativeDate(7),
      },
      {
        vehicleId: vehicles[3]._id,
        category: "Repair",
        amount: 500,
        description: "Maintenance Service: Brake System Repair",
        date: getRelativeDate(2),
      },
      {
        vehicleId: vehicles[4]._id,
        category: "Maintenance",
        amount: 150,
        description: "Service: Routine oil change and air filters",
        date: getRelativeDate(7),
      },
    ]);

    // 10. Seed notifications
    await Notification.create([
      {
        type: "LicenseExpiry",
        title: "Driver License Expired/Suspended",
        message: "Driver Anil Kumble's license is suspended. Refrain from dispatching.",
        read: false,
      },
      {
        type: "MaintenanceReminder",
        title: "Upcoming Service Reminder",
        message: "Vehicle MH-12-PQ-8821 (Tata Signa) is approaching 150,000 km. Schedule routine maintenance.",
        read: false,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with Indian fleet data!",
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
