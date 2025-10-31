import express from "express";
import { handleWooWebhook } from "../controllers/webhookController1.js";

const router = express.Router();
router.post("/woocommerce", express.json({ type: "application/json" }), handleWooWebhook);

export default router;
