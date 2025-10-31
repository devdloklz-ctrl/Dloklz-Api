import express from "express";
import { orderCreated, orderUpdated } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/order-created", orderCreated);
router.post("/order-updated", orderUpdated);

export default router;
