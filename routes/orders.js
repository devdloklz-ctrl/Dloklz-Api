import express from "express";
import { getAllOrders, syncOrders, updateWooOrder } from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get all orders
router.get("/", authMiddleware, roleMiddleware("owner", "vendor"), getAllOrders);

// Sync all orders from WooCommerce → MongoDB
router.get("/sync", authMiddleware, roleMiddleware("owner"), syncOrders);

// Update WooCommerce from MongoDB
router.put("/update", authMiddleware, roleMiddleware("owner"), updateWooOrder);

export default router;
