import express from "express";
import { handleWooWebhook } from "../controllers/webhookController1.js";

const router = express.Router();

/**
 * ✅ Simple test endpoint to verify WooCommerce can reach your API
 * Example: GET https://dloklz-api.onrender.com/api/webhooks/woocommerce/test
 */
router.get("/woocommerce/test", (req, res) => {
  console.log("✅ WooCommerce test ping received successfully");
  res.status(200).json({ message: "WooCommerce Webhook URL is reachable ✅" });
});

/**
 * 🚀 Webhook listener for WooCommerce events (order.created / order.updated)
 * Must use raw body for proper HMAC signature validation
 */
router.post(
  "/woocommerce",
  express.raw({ type: "application/json" }), // important: raw body needed for signature
  handleWooWebhook
);

/**
 * ⚠️ Optional: Catch unexpected GET requests to /woocommerce
 * WooCommerce sometimes sends GET pings during validation
 */
router.get("/woocommerce", (req, res) => {
  console.log("⚠️ WooCommerce sent a GET to webhook URL (likely test validation)");
  res.status(200).json({ message: "WooCommerce Webhook endpoint active ✅" });
});

export default router;
