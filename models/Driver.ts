import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    licenseCategory: {
      type: String,
      required: [true, "License category is required"],
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
    },
    safetyScore: {
      type: Number,
      required: true,
      min: [0, "Safety score cannot be less than 0"],
      max: [100, "Safety score cannot be more than 100"],
      default: 100,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Available", "On Trip", "Off Duty", "Suspended"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

export const Driver = mongoose.models.Driver || mongoose.model("Driver", DriverSchema);
export default Driver;
