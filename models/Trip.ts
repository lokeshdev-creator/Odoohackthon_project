import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, "Source destination is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Final destination is required"],
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Driver reference is required"],
    },
    cargoWeight: {
      type: Number,
      required: [true, "Cargo weight (kg) is required"],
      min: [0, "Cargo weight cannot be negative"],
    },
    plannedDistance: {
      type: Number,
      required: [true, "Planned distance (km) is required"],
      min: [0, "Planned distance cannot be negative"],
    },
    actualDistance: {
      type: Number,
      min: [0, "Actual distance cannot be negative"],
      default: null,
    },
    fuelConsumed: {
      type: Number,
      min: [0, "Fuel consumed cannot be negative"],
      default: null,
    },
    revenue: {
      type: Number,
      required: [true, "Expected revenue is required"],
      min: [0, "Revenue cannot be negative"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
    },
    dispatchDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
export default Trip;
