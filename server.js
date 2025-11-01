import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import webhookRoutes from "./routes/webhook.js"; // old webhook route (if needed)
import webhookRoute from "./routes/webhookroutes.js"; // WooCommerce webhooks

import testEmail from "./routes/testEmail.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());

// 🚨 Register WooCommerce webhook route FIRST with raw body parser
// This must come BEFORE bodyParser or express.json()
app.use("/api/webhooks", webhookRoute);

// ✅ Use normal JSON parser for the rest of your app
app.use(bodyParser.json());

// Other API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/test", testEmail);

// Root test route
app.get("/", (req, res) => {
  res.send("Dloklz backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
