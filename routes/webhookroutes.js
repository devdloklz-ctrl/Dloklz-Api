import express from "express";
import { handleWooWebhook } from "../controllers/webhookController1.js";

const router = express.Router();

/**
 * ✅ Test endpoint to verify WooCommerce can reach your API
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
  express.raw({ type: "*/*" }), // use * to accept any content-type Woo sends
  (req, res, next) => {
    // Ensure body is a Buffer for signature validation
    if (!Buffer.isBuffer(req.body)) {
      console.warn("⚠️ Raw body is not a Buffer. Converting manually...");
      try {
        req.body = Buffer.from(JSON.stringify(req.body || {}));
      } catch (err) {
        console.error("❌ Failed to convert body to Buffer:", err);
        return res.status(400).json({ error: "Invalid webhook body" });
      }
    }
    next();
  },
  handleWooWebhook
);

/**
 * ⚠️ Catch unexpected GET requests to /woocommerce
 * WooCommerce sometimes sends GET pings during validation
 */
router.get("/woocommerce", (req, res) => {
  console.log("⚠️ WooCommerce sent a GET to webhook URL (likely test validation)");
  res.status(200).json({ message: "WooCommerce Webhook endpoint active ✅" });
});

export default router;
