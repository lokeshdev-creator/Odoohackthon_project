import mongoose from "mongoose";

const FuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },
    liters: {
      type: Number,
      required: [true, "Liters quantity is required"],
      min: [0.1, "Liters must be positive"],
    },
    cost: {
      type: Number,
      required: [true, "Refueling cost is required"],
      min: [0, "Cost cannot be negative"],
    },
    odometer: {
      type: Number,
      required: [true, "Odometer at refueling is required"],
      min: [0, "Odometer cannot be negative"],
    },
    date: {
      type: Date,
      required: [true, "Refuel date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const FuelLog =
  mongoose.models.FuelLog || mongoose.model("FuelLog", FuelLogSchema);
export default FuelLog;
