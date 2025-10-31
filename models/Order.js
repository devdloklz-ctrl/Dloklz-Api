import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true, unique: true },
  status: { type: String, required: true },
  total: { type: String },
  currency: { type: String },
  customer: {
    name: String,
    email: String,
    phone: String,
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: Array,
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
