import crypto from "crypto";
import Order from "../models/Order.js";
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate } from "../utils/emailTemplates/index.js";

const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "Dloklz@123";

/**
 * 🧩 Verify WooCommerce webhook signature
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
    console.log("✅ Signature verified successfully");
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

    // Ensure rawBody is a Buffer
    if (!Buffer.isBuffer(rawBody)) {
      console.warn("⚠️ Raw body is not a Buffer. Webhook may fail verification.");
      return res.status(400).json({ message: "Invalid raw body format" });
    }

    const rawString = rawBody.toString("utf8");

    // Handle WooCommerce test webhook (ping)
    if (!topic) {
      console.log("✅ Received WooCommerce webhook test ping");
      return res.status(200).json({ success: true, message: "Ping acknowledged" });
    }

    // Verify HMAC signature
    if (!verifySignature(rawBody, req.headers)) {
      console.warn("⚠️ Invalid WooCommerce webhook signature");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    // Parse JSON payload
    let data;
    try {
      data = JSON.parse(rawString);
    } catch (parseErr) {
      console.error("❌ Failed to parse webhook JSON:", parseErr.message);
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    console.log(`📦 Webhook received: ${topic} | Delivery ID: ${deliveryId} | Order ID: ${data.id}`);

    // Prepare order data
    const orderData = {
      orderId: data.id,
      status: data.status,
      total: data.total,
      currency: data.currency,
      payment: data.payment_method_title || "N/A",
      customer: {
        name: `${data.billing?.first_name || ""} ${data.billing?.last_name || ""}`.trim(),
        email: data.billing?.email || "",
        phone: data.billing?.phone || "",
        address: data.billing?.address_1 || "",
      },
      items: data.line_items || [],
      date_created: data.date_created,
      date_modified: data.date_modified,
    };

    // Upsert in MongoDB
    await Order.findOneAndUpdate(
      { orderId: data.id },
      { $set: orderData },
      { upsert: true, new: true }
    );

    console.log(`✅ Order ${data.id} saved/updated in MongoDB (${topic})`);

    // Send email only for new orders
    if (topic === "order.created" && orderData.customer.email) {
      try {
        await sendEmail({
          to: orderData.customer.email,
          subject: `✅ Order Placed Successfully (#${orderData.orderId})`,
          html: newOrderTemplate(orderData),
        });
        console.log(`📧 Email sent to ${orderData.customer.email}`);
      } catch (err) {
        console.error(`❌ Failed to send email for Order #${orderData.orderId}:`, err.message);
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
