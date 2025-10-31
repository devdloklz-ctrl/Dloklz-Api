import express from "express";
import { syncOrders } from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/sync", authMiddleware, roleMiddleware("owner"), syncOrders);

export default router;
