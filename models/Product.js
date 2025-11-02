import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    wooId: { type: Number, required: true, unique: true, index: true },

    // 🔹 Basic Info
    name: { type: String, required: true },
    slug: { type: String },
    permalink: { type: String },
    description: { type: String },
    short_description: { type: String },
    type: { type: String, default: "simple" },
    status: { type: String, default: "publish" },

    // 🔹 Pricing & Sales
    sku: { type: String },
    price: { type: String },
    regular_price: { type: String },
    sale_price: { type: String },
    on_sale: { type: Boolean, default: false },
    purchasable: { type: Boolean, default: true },
    total_sales: { type: Number, default: 0 },

    // 🔹 Inventory
    manage_stock: { type: Boolean, default: false },
    stock_quantity: { type: Number, default: 0 },
    stock_status: { type: String, default: "instock" },

    // 🔹 Visibility & Features
    featured: { type: Boolean, default: false },
    catalog_visibility: { type: String, default: "visible" },

    // 🔹 Ratings
    average_rating: { type: String, default: "0.00" },
    rating_count: { type: Number, default: 0 },

    // 🔹 Categories
    categories: [
      {
        id: Number,
        name: String,
        slug: String,
      },
    ],

    // 🔹 Tags
    tags: [
      {
        id: Number,
        name: String,
        slug: String,
      },
    ],

    // 🔹 Images
    images: [
      {
        id: Number,
        src: String,
        name: String,
        alt: String,
      },
    ],

    // 🔹 Store Info (For Dokan or Multi-vendor setups)
    store: {
      id: Number,
      name: String,
      shop_name: String,
      url: String,
      address: {
        street_1: String,
        street_2: String,
        city: String,
        zip: String,
        country: String,
        state: String,
      },
    },

    // 🔹 Meta Data (Dynamic Key-Value Pairs)
    meta_data: [
      {
        id: Number,
        key: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
