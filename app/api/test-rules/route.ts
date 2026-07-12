import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { Trip } from "@/models/Trip";
import { saveVehicle } from "@/actions/vehicles";
import { saveTrip, dispatchTrip, completeTrip } from "@/actions/trips";

export async function GET() {
  const results: { test: string; status: "PASSED" | "FAILED"; message: string }[] = [];

  try {
    await connectToDatabase();

    // Setup: Create test vehicle
    const vehicleReg = `TEST-REG-${Date.now()}`;
    const vehicleFormData = new FormData();
    vehicleFormData.append("registrationNumber", vehicleReg);
    vehicleFormData.append("name", "Test Hauler");
    vehicleFormData.append("model", "Volvo V4");
    vehicleFormData.append("type", "Truck");
    vehicleFormData.append("capacity", "1000"); // 1000 kg capacity
    vehicleFormData.append("odometer", "100");
    vehicleFormData.append("acquisitionCost", "20000");
    vehicleFormData.append("purchaseDate", new Date().toISOString().split("T")[0]);
    vehicleFormData.append("status", "Available");

    // TEST 1: Register Vehicle
    const vRes = await saveVehicle(null, vehicleFormData);
    if (vRes.success) {
      results.push({
        test: "Register Vehicle",
        status: "PASSED",
        message: `Registered test vehicle ${vehicleReg}`,
      });
    } else {
      results.push({
        test: "Register Vehicle",
        status: "FAILED",
        message: "Failed to register test vehicle",
      });
    }

    const testVehicle = await Vehicle.findOne({ registrationNumber: vehicleReg });

    // TEST 2: Unique Registration Check
    const dupRes = await saveVehicle(null, vehicleFormData);
    if (!dupRes.success && dupRes.error?.registrationNumber) {
      results.push({
        test: "Unique Registration Check",
        status: "PASSED",
        message: "Blocked duplicate vehicle registration correctly.",
      });
    } else {
      results.push({
        test: "Unique Registration Check",
        status: "FAILED",
        message: "Allowed duplicate registration number registration.",
      });
    }

    // Setup: Create driver
    const licenseNum = `LIC-${Date.now()}`;
    const testDriver = await Driver.create({
      name: "Test Driver",
      phone: "+1 555 123",
      email: "test.driver@transitops.com",
      licenseNumber: licenseNum,
      licenseCategory: "Class A",
      licenseExpiry: new Date("2029-01-01"), // Valid License
      safetyScore: 95,
      status: "Available",
    });

    results.push({
      test: "Register Driver",
      status: "PASSED",
      message: `Registered test driver with valid license: ${licenseNum}`,
    });

    // TEST 3: Cargo Capacity Validation (Exceed vehicle capacity)
    const tripFormData = new FormData();
    tripFormData.append("source", "Seattle");
    tripFormData.append("destination", "Portland");
    tripFormData.append("vehicleId", testVehicle._id.toString());
    tripFormData.append("driverId", testDriver._id.toString());
    tripFormData.append("cargoWeight", "1500"); // 1500 kg > 1000 kg capacity
    tripFormData.append("plannedDistance", "300");
    tripFormData.append("revenue", "800");

    const tripRes = await saveTrip(null, tripFormData);
    if (!tripRes.success && tripRes.error?.cargoWeight) {
      results.push({
        test: "Cargo Capacity Validation",
        status: "PASSED",
        message: "Successfully blocked trip: cargo weight exceeds vehicle capacity.",
      });
    } else {
      results.push({
        test: "Cargo Capacity Validation",
        status: "FAILED",
        message: "Failed to block trip exceeding vehicle capacity.",
      });
    }

    // TEST 4: Dispatch Auto Updates & Driver Expiry Validation
    // Setup: Create valid draft trip
    const validTripFormData = new FormData();
    validTripFormData.append("source", "Seattle");
    validTripFormData.append("destination", "Portland");
    validTripFormData.append("vehicleId", testVehicle._id.toString());
    validTripFormData.append("driverId", testDriver._id.toString());
    validTripFormData.append("cargoWeight", "800"); // 800 kg <= 1000 kg
    validTripFormData.append("plannedDistance", "300");
    validTripFormData.append("revenue", "800");

    const validTripRes = await saveTrip(null, validTripFormData);
    const testTrip = await Trip.findOne({
      vehicleId: testVehicle._id,
      driverId: testDriver._id,
      status: "Draft",
    });

    if (testTrip) {
      // Dispatch trip
      const dispatchRes = await dispatchTrip(testTrip._id.toString());
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      const updatedDriver = await Driver.findById(testDriver._id);

      if (
        dispatchRes.success &&
        updatedVehicle?.status === "On Trip" &&
        updatedDriver?.status === "On Trip"
      ) {
        results.push({
          test: "Trip Dispatch State Shifts",
          status: "PASSED",
          message: "Trip status changed to Dispatched. Vehicle & Driver auto-shifted to 'On Trip'.",
        });
      } else {
        results.push({
          test: "Trip Dispatch State Shifts",
          status: "FAILED",
          message: "Failed to dispatch or verify resource state transitions.",
        });
      }

      // TEST 5: Double Dispatch Blocking
      // Try to dispatch another trip with the same vehicle
      const conflictTrip = await Trip.create({
        source: "Conflict S",
        destination: "Conflict D",
        vehicleId: testVehicle._id,
        driverId: testDriver._id,
        cargoWeight: 50,
        plannedDistance: 100,
        revenue: 100,
        status: "Draft",
      });

      const conflictRes = await dispatchTrip(conflictTrip._id.toString());
      if (!conflictRes.success) {
        results.push({
          test: "Double Dispatch Blocking",
          status: "PASSED",
          message: "Successfully blocked dispatch of vehicle/driver already marked 'On Trip'.",
        });
      } else {
        results.push({
          test: "Double Dispatch Blocking",
          status: "FAILED",
          message: "Failed to block double-booking: allowed resource dispatch twice.",
        });
      }
      await Trip.findByIdAndDelete(conflictTrip._id);

      // TEST 6: Complete Trip Workflow
      const completeRes = await completeTrip(testTrip._id.toString(), 310, 50, 60);
      const finalVehicle = await Vehicle.findById(testVehicle._id);
      const finalDriver = await Driver.findById(testDriver._id);
      const finalTrip = await Trip.findById(testTrip._id);

      if (
        completeRes.success &&
        finalVehicle?.status === "Available" &&
        finalDriver?.status === "Available" &&
        finalVehicle?.odometer === 410 && // 100 original + 310 actual
        finalTrip?.status === "Completed"
      ) {
        results.push({
          test: "Complete Trip Workflow",
          status: "PASSED",
          message: "Trip completed. Odometer incremented. Vehicle & Driver returned to 'Available'.",
        });
      } else {
        results.push({
          test: "Complete Trip Workflow",
          status: "FAILED",
          message: "Failed to complete trip or verify final state variables.",
        });
      }
    } else {
      results.push({
        test: "Trip Lifecycle Tests Setup",
        status: "FAILED",
        message: "Failed to set up draft trip for validation check.",
      });
    }

    // Cleanup test records
    await Vehicle.findByIdAndDelete(testVehicle?._id);
    await Driver.findByIdAndDelete(testDriver?._id);
    if (testTrip) await Trip.findByIdAndDelete(testTrip._id);

    return NextResponse.json({ success: true, testSuiteResults: results });
  } catch (error: any) {
    console.error("Test suite run error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
