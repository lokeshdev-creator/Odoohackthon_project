import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: ["Fuel", "Maintenance", "Toll", "Repair", "Insurance", "Other"],
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Expense date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Expense =
  mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
export default Expense;
