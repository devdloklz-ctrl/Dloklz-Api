import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // 🔹 WooCommerce Order ID
    orderId: { type: Number, required: true, unique: true, index: true },

    // 🔹 Basic Info
    status: { type: String, required: true },
    total: { type: String, default: "0.00" },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, default: "" },
    dateCreated: { type: Date },
    dateModified: { type: Date },

    // 🔹 Customer Info
    customer: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    // 🔹 Vendor / Restaurant (if multi-vendor or multi-branch)
    vendorId: {
      type: mongoose.Schema.Types.Mixed, // can be ObjectId, Number, or String (Woo often sends ID)
      ref: "User",
    },

    // 🔹 Order Items
    items: [
      {
        productId: { type: Number },
        name: { type: String },
        quantity: { type: Number },
        price: { type: String },
        total: { type: String },
        sku: { type: String },
      },
    ],

    // 🔹 Meta info (optional)
    notes: { type: String },
    shippingMethod: { type: String },

    // 🔹 Store entire WooCommerce JSON (for debugging/sync reference)
    fullData: { type: mongoose.Schema.Types.Mixed },

    // 🔹 Webhook tracking (for WooCommerce webhook debugging)
    webhookTopic: { type: String },
    webhookDeliveryId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
