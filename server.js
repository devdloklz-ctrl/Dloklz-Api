import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import webhookRoutes from "./routes/webhook.js";
import webhookRoute from "./routes/webhookroutes.js";

import testEmail from "./routes/testEmail.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());

app.use("/api/webhooks", webhookRoute);

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhook", webhookRoutes);

app.use("/api/test", testEmail);

app.get("/", (req, res) => {
  res.send("Dloklz backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
