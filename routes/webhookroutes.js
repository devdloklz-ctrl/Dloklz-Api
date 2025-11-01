import express from "express";
import { handleWooWebhook } from "../controllers/webhookController1.js";

const router = express.Router();

// ✅ Test endpoint (to verify WooCommerce can reach your server)
router.get("/woocommerce/test", (req, res) => {
  console.log("✅ WooCommerce webhook test ping received");
  res.status(200).json({ message: "WooCommerce Webhook URL is reachable ✅" });
});

// ✅ Actual WooCommerce webhook listener
router.post(
  "/woocommerce",
  express.raw({ type: "application/json" }), // use raw for signature validation
  handleWooWebhook
);

export default router;
