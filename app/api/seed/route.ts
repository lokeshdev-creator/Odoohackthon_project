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
        email: "driver@transitops.com",
        password: hashedPassword,
        role: "Driver",
      },
      {
        name: "Anil Deshmukh",
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

    // Setup base timeline variables
    const now = new Date();
    const getRelativeDate = (daysAgo: number, hoursAgo: number = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);
      return date;
    };

    // 4. Seed initial vehicles (Indian registration format and vehicle types)
    const seededVehicles = await Vehicle.create([
      {
        registrationNumber: "MH-12-PQ-8821",
        name: "Tata Signa 5530.S",
        model: "Tata Signa 2024",
        type: "Heavy Truck",
        capacity: 35000,
        odometer: 120000, // will be updated dynamically
        acquisitionCost: 45000,
        purchaseDate: new Date("2024-02-15"),
        status: "Available",
        region: "West",
      },
      {
        registrationNumber: "DL-3C-AG-1420",
        name: "Ashok Leyland Ecomet 1615",
        model: "Leyland Ecomet 2023",
        type: "Box Truck",
        capacity: 10000,
        odometer: 45000, // will be updated dynamically
        acquisitionCost: 28000,
        purchaseDate: new Date("2023-09-10"),
        status: "Available",
        region: "North",
      },
      {
        registrationNumber: "KA-03-MK-7744",
        name: "Mahindra Bolero Pickup",
        model: "Bolero Maxi Truck 2023",
        type: "Cargo Van",
        capacity: 1500,
        odometer: 25000, // will be updated dynamically
        acquisitionCost: 11000,
        purchaseDate: new Date("2023-12-05"),
        status: "Available",
        region: "South",
      },
      {
        registrationNumber: "HR-26-CN-5590",
        name: "BharatBenz 2823R",
        model: "BharatBenz 2823 2022",
        type: "Heavy Truck",
        capacity: 20000,
        odometer: 85000, // will be updated dynamically
        acquisitionCost: 42000,
        purchaseDate: new Date("2022-05-20"),
        status: "Available",
        region: "East",
      },
      {
        registrationNumber: "MH-43-XY-1122",
        name: "Eicher Pro 2049",
        model: "Eicher Pro 2021",
        type: "Box Truck",
        capacity: 3500,
        odometer: 60000, // will be updated dynamically
        acquisitionCost: 16000,
        purchaseDate: new Date("2021-08-18"),
        status: "Available",
        region: "Central",
      },
    ]);

    // 5. Seed drivers (Indian names, phone numbers and licenses)
    const seededDrivers = await Driver.create([
      {
        name: "Ramesh Yadav",
        phone: "+91 98765 43210",
        email: "ramesh.yadav@transitops.com",
        licenseNumber: "DL-MH12-2020-0012345",
        licenseCategory: "Class A CDL",
        licenseExpiry: getRelativeDate(-500),
        safetyScore: 98,
        status: "Available",
        region: "West",
      },
      {
        name: "Suresh Prasad",
        phone: "+91 87654 32109",
        email: "suresh.prasad@transitops.com",
        licenseNumber: "DL-DL03-2018-0987654",
        licenseCategory: "Class B CDL",
        licenseExpiry: getRelativeDate(-450),
        safetyScore: 92,
        status: "Available",
        region: "North",
      },
      {
        name: "Gurpreet Singh",
        phone: "+91 76543 21098",
        email: "gurpreet.singh@transitops.com",
        licenseNumber: "DL-HR26-2015-0123456",
        licenseCategory: "Class A CDL",
        licenseExpiry: getRelativeDate(-300),
        safetyScore: 88,
        status: "Available",
        region: "East",
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
        region: "South",
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
        region: "Central",
      },
    ]);

    // Odometer state tracking for dynamic addition
    const odometers = [120000, 45000, 25000, 85000, 60000];

    const routes = [
      { source: "Mumbai, MH", destination: "Pune, MH", distance: 150 },
      { source: "Delhi, DL", destination: "Jaipur, RJ", distance: 270 },
      { source: "Bangalore, KA", destination: "Chennai, TN", distance: 350 },
      { source: "Mumbai, MH", destination: "Ahmedabad, GJ", distance: 530 },
      { source: "Hyderabad, TS", destination: "Bangalore, KA", distance: 570 },
      { source: "Delhi, DL", destination: "Chandigarh, CH", distance: 250 },
      { source: "Kolkata, WB", destination: "Patna, BR", distance: 580 },
      { source: "Chennai, TN", destination: "Bangalore, KA", distance: 350 },
    ];

    const tripsToCreate = [];
    const fuelLogsToCreate = [];
    const expensesToCreate = [];

    // 6. Generate completed trips & related records spread over the last 30 days (excluding today)
    for (let day = 29; day >= 1; day--) {
      // Generate 1 or 2 completed trips per day (approx 45 trips total)
      const dailyCount = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < dailyCount; i++) {
        // Randomly pick a route, vehicle and driver (excluding suspended drivers)
        const route = routes[Math.floor(Math.random() * routes.length)];
        const vehicleIdx = Math.floor(Math.random() * seededVehicles.length);
        const driverIdx = Math.floor(Math.random() * 4); // index 0-3 (excluding suspended index 4)

        const vehicle = seededVehicles[vehicleIdx];
        const driver = seededDrivers[driverIdx];

        const actualDistance = route.distance + Math.floor(Math.random() * 21) - 5; // dist +/- 5 to 15km
        
        // Calculate fuel efficiency based on vehicle type
        let efficiency = 5.0;
        if (vehicle.type === "Heavy Truck") {
          efficiency = 2.5 + Math.random() * 0.8; // 2.5 to 3.3
        } else if (vehicle.type === "Box Truck") {
          efficiency = 4.5 + Math.random() * 1.5; // 4.5 to 6.0
        } else {
          efficiency = 7.5 + Math.random() * 2.5; // 7.5 to 10.0
        }

        const fuelConsumed = Math.round((actualDistance / efficiency) * 10) / 10;
        const fuelCost = Math.round(fuelConsumed * 1.2 * 100) / 100; // ~$1.2/liter
        const revenue = Math.round(route.distance * (5 + Math.random() * 3)); // Revenue scale

        // Accumulate odometer
        odometers[vehicleIdx] += actualDistance;
        const currentOdo = odometers[vehicleIdx];

        // Timing
        const dispatchDate = getRelativeDate(day, 8 + Math.floor(Math.random() * 4)); // Dispatched between 8 AM and 12 PM
        const travelHours = Math.ceil(actualDistance / 60); // average 60km/h
        const completionDate = new Date(dispatchDate);
        completionDate.setHours(completionDate.getHours() + travelHours);

        // Add Trip
        tripsToCreate.push({
          source: route.source,
          destination: route.destination,
          vehicleId: vehicle._id,
          driverId: driver._id,
          cargoWeight: Math.floor(vehicle.capacity * 0.5) + Math.floor(Math.random() * (vehicle.capacity * 0.4)),
          plannedDistance: route.distance,
          actualDistance: actualDistance,
          fuelConsumed: fuelConsumed,
          revenue: revenue,
          status: "Completed",
          dispatchDate: dispatchDate,
          completionDate: completionDate,
        });

        // Add Fuel Log
        fuelLogsToCreate.push({
          vehicleId: vehicle._id,
          liters: fuelConsumed,
          cost: fuelCost,
          odometer: currentOdo - Math.floor(actualDistance * 0.3), // Fueled mid-trip
          date: dispatchDate,
        });

        // Add Fuel Expense
        expensesToCreate.push({
          vehicleId: vehicle._id,
          category: "Fuel",
          amount: fuelCost,
          description: `Fuel Refill: ${fuelConsumed} Liters for trip ${route.source} - ${route.destination}`,
          date: dispatchDate,
        });

        // Add Toll Expense (30% chance)
        if (Math.random() < 0.3) {
          const tollAmount = Math.floor(Math.random() * 31) + 20; // 20-50
          expensesToCreate.push({
            vehicleId: vehicle._id,
            category: "Toll",
            amount: tollAmount,
            description: `Toll Charges: ${route.source} to ${route.destination}`,
            date: dispatchDate,
          });
        }
      }
    }

    // 7. Seed active/cancelled/draft trips for today (day 0)
    // Active Trip 1: Vehicle 1 (Ashok Leyland) and Driver 1 (Suresh Prasad)
    tripsToCreate.push({
      source: "Delhi, DL",
      destination: "Chandigarh, CH",
      vehicleId: seededVehicles[1]._id,
      driverId: seededDrivers[1]._id,
      cargoWeight: 7500,
      plannedDistance: 250,
      revenue: 1100,
      status: "Dispatched",
      dispatchDate: getRelativeDate(0, 4), // 4 hours ago
    });

    // Active Trip 2: Vehicle 0 (Tata Signa) and Driver 2 (Gurpreet Singh)
    tripsToCreate.push({
      source: "Mumbai, MH",
      destination: "Pune, MH",
      vehicleId: seededVehicles[0]._id,
      driverId: seededDrivers[2]._id,
      cargoWeight: 26000,
      plannedDistance: 150,
      revenue: 1000,
      status: "Dispatched",
      dispatchDate: getRelativeDate(0, 1), // 1 hour ago
    });

    // Draft Trip: Vehicle 2 (Mahindra Bolero) and Driver 3 (Vijay Mhatre)
    tripsToCreate.push({
      source: "Chennai, TN",
      destination: "Bangalore, KA",
      vehicleId: seededVehicles[2]._id,
      driverId: seededDrivers[3]._id,
      cargoWeight: 1300,
      plannedDistance: 350,
      revenue: 900,
      status: "Draft",
    });

    // Cancelled Trip: Vehicle 4 (Eicher Pro) and Driver 0 (Ramesh Yadav)
    tripsToCreate.push({
      source: "Hyderabad, TS",
      destination: "Mumbai, MH",
      vehicleId: seededVehicles[4]._id,
      driverId: seededDrivers[0]._id,
      cargoWeight: 3100,
      plannedDistance: 710,
      revenue: 2200,
      status: "Cancelled",
      dispatchDate: getRelativeDate(1),
    });

    // Insert all accumulated trips, fuel logs, and expenses
    const trips = await Trip.create(tripsToCreate);
    const fuelLogs = await FuelLog.create(fuelLogsToCreate);

    // 8. Seed Maintenance Logs
    const maintenanceLogsToCreate = [
      {
        vehicleId: seededVehicles[3]._id, // BharatBenz (In Shop)
        type: "Brake System Repair",
        description: "Replaced worn out brake pads and drums, bled the brake lines.",
        cost: 500,
        startDate: getRelativeDate(2),
        endDate: getRelativeDate(-2), // expected completion in 2 days
        status: "Open",
      },
      {
        vehicleId: seededVehicles[4]._id, // Eicher Pro (Completed service 25 days ago)
        type: "Routine Service",
        description: "Standard oil change, fuel filters inspection and air filter cleaning.",
        cost: 150,
        startDate: getRelativeDate(25),
        endDate: getRelativeDate(25),
        status: "Closed",
      },
      {
        vehicleId: seededVehicles[2]._id, // Mahindra Bolero (Completed tyre replacement 15 days ago)
        type: "Tyre Replacement",
        description: "Replaced two worn out front tyres with new tubeless radials.",
        cost: 220,
        startDate: getRelativeDate(15),
        endDate: getRelativeDate(15),
        status: "Closed",
      },
      {
        vehicleId: seededVehicles[0]._id, // Tata Signa (Completed suspension service 8 days ago)
        type: "Suspension Service",
        description: "Greased suspension pins and replaced front shock absorbers.",
        cost: 380,
        startDate: getRelativeDate(8),
        endDate: getRelativeDate(8),
        status: "Closed",
      },
    ];

    const maintenance = await MaintenanceLog.create(maintenanceLogsToCreate);

    // Add corresponding maintenance expenses to the pool
    expensesToCreate.push(
      {
        vehicleId: seededVehicles[3]._id,
        category: "Repair",
        amount: 500,
        description: "Service Charge: Brake System Repair (Open)",
        date: getRelativeDate(2),
      },
      {
        vehicleId: seededVehicles[4]._id,
        category: "Maintenance",
        amount: 150,
        description: "Service Charge: Routine Service (Closed)",
        date: getRelativeDate(25),
      },
      {
        vehicleId: seededVehicles[2]._id,
        category: "Repair",
        amount: 220,
        description: "Service Charge: Tyre Replacement (Closed)",
        date: getRelativeDate(15),
      },
      {
        vehicleId: seededVehicles[0]._id,
        category: "Maintenance",
        amount: 380,
        description: "Service Charge: Suspension Service (Closed)",
        date: getRelativeDate(8),
      }
    );

    // Add weekly insurance expenses across the last 30 days
    for (let w = 4; w >= 1; w--) {
      expensesToCreate.push({
        vehicleId: seededVehicles[2]._id,
        category: "Insurance",
        amount: 250,
        description: `Insurance: Weekly fleet premium allocation (W-${w})`,
        date: getRelativeDate(w * 7),
      });
    }

    // Insert all accumulated expenses
    await Expense.create(expensesToCreate);

    // 9. Seed notifications
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

    // 10. Update Vehicles with calculated final odometers and statuses
    // Final alignment check:
    // Vehicle index 0 (Tata) -> On Trip
    // Vehicle index 1 (Leyland) -> On Trip
    // Vehicle index 2 (Bolero) -> Available
    // Vehicle index 3 (BharatBenz) -> In Shop
    // Vehicle index 4 (Eicher) -> Available
    for (let i = 0; i < seededVehicles.length; i++) {
      const finalStatus = i === 0 || i === 1 ? "On Trip" : i === 3 ? "In Shop" : "Available";
      await Vehicle.findByIdAndUpdate(seededVehicles[i]._id, {
        odometer: odometers[i],
        status: finalStatus,
      });
    }

    // 11. Update Drivers with final statuses based on active trips
    // Driver index 0 (Ramesh) -> Available (Trip cancelled, no active trip)
    // Driver index 1 (Suresh) -> On Trip (Active Trip 1)
    // Driver index 2 (Gurpreet) -> On Trip (Active Trip 2)
    // Driver index 3 (Vijay) -> Available (Trip draft, not active)
    // Driver index 4 (Anil) -> Suspended
    for (let i = 0; i < seededDrivers.length; i++) {
      const finalStatus = i === 1 || i === 2 ? "On Trip" : i === 4 ? "Suspended" : "Available";
      await Driver.findByIdAndUpdate(seededDrivers[i]._id, {
        status: finalStatus,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with 1-month Indian fleet data!",
      seededCounts: {
        users: users.length,
        vehicles: seededVehicles.length,
        drivers: seededDrivers.length,
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
