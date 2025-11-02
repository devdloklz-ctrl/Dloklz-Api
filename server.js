import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

// 🛠 Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import webhookRoutes from "./routes/webhook.js"; // legacy (optional)
import webhookRoute from "./routes/webhookroutes.js"; // WooCommerce Webhooks (Orders, Products)
import productRoutes from "./routes/products.js";
import testEmail from "./routes/testEmail.js";
import testWhatsapp from "./routes/test-whatsapp.js";
import testSMS from "./routes/testSMS.js";

dotenv.config();

// 🧩 Connect Database
connectDB();

const app = express();
app.use(cors());

// ⚠️ WooCommerce Webhook (raw body parser first!)
app.use("/api/webhooks", webhookRoute);

// ✅ Use JSON parser after webhooks route
app.use(bodyParser.json({ limit: "10mb" }));

// 🧭 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes); // 🆕 Product management routes
app.use("/api/webhook", webhookRoutes); // (Optional older webhook)
app.use("/api/test", testEmail);
app.use("/api/test/whatsapp", testWhatsapp);
app.use("/api/test/sms", testSMS);

// 🌐 Root endpoint
app.get("/", (req, res) => {
  res.send("🛍️ Dloklz Backend is running successfully 🚀");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
