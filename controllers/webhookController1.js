import crypto from "crypto";
import Order from "../models/Order.js";
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate } from "../utils/emailTemplates/index.js";

const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "Dloklz@123";

/**
 * ✅ Verify WooCommerce webhook signature
 */
const verifySignature = (rawBody, headers) => {
  const signature = headers["x-wc-webhook-signature"];
  if (!signature || !rawBody) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("base64");

    return signature === expectedSignature;
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return false;
  }
};

/**
 * 🚀 WooCommerce Webhook Handler
 */
export const handleWooWebhook = async (req, res) => {
  try {
    const topic = req.headers["x-wc-webhook-topic"];
    const deliveryId = req.headers["x-wc-webhook-delivery-id"];
    const rawBody = req.body;

    // ✅ WooCommerce test ping
    if (!topic) {
      console.log("✅ WooCommerce webhook test ping received");
      return res.status(200).json({ message: "Ping acknowledged" });
    }

    // ✅ Validate Buffer
    if (!Buffer.isBuffer(rawBody)) {
      console.warn("⚠️ Raw body is not a Buffer. Webhook may fail verification.");
      return res.status(400).json({ message: "Invalid raw body format" });
    }

    // ✅ Verify signature
    if (!verifySignature(rawBody, req.headers)) {
      console.warn("⚠️ Invalid WooCommerce webhook signature");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const rawString = rawBody.toString("utf8");
    let data;

    try {
      data = JSON.parse(rawString);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    console.log(`📦 Webhook received: ${topic} | Delivery ID: ${deliveryId} | Order ID: ${data.id}`);

    // ✅ Store full data
    await Order.findOneAndUpdate(
      { orderId: data.id },
      { $set: { fullData: data, status: data.status, total: data.total } },
      { upsert: true, new: true }
    );

    console.log(`✅ Order ${data.id} saved/updated in MongoDB (${topic})`);

    // ✅ Send email only for new orders
    if (topic === "order.created" && data.billing?.email) {
      try {
        await sendEmail({
          to: data.billing.email,
          subject: `✅ Order Placed Successfully (#${data.id})`,
          html: newOrderTemplate(data),
        });
        console.log(`📧 Email sent to ${data.billing.email}`);
      } catch (err) {
        console.error(`❌ Failed to send email for Order #${data.id}:`, err.message);
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
