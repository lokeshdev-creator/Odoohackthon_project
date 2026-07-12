import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Vehicle type is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Maximum load capacity (kg) is required"],
      min: [0, "Capacity cannot be negative"],
    },
    odometer: {
      type: Number,
      required: [true, "Odometer reading (km) is required"],
      min: [0, "Odometer cannot be negative"],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: [true, "Acquisition cost is required"],
      min: [0, "Cost cannot be negative"],
    },
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Available", "On Trip", "In Shop", "Retired"],
      default: "Available",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
export default Vehicle;
