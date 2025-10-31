import crypto from "crypto";
import Order from "../models/Order.js";
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate } from "../utils/emailTemplates/index.js";

const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "Dloklz@123";

const verifySignature = (req) => {
  const signature = req.headers["x-wc-webhook-signature"];
  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("base64");

  return signature === expectedSignature;
};

export const handleWooWebhook = async (req, res) => {
  try {
    // 🧾 Verify signature
    if (!verifySignature(req)) {
      console.warn("⚠️ Webhook signature mismatch");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const eventType = req.headers["x-wc-webhook-topic"];
    const order = req.body;

    console.log(`📩 Webhook received: ${eventType} | Order ID: ${order.id}`);

    const orderData = {
      orderId: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      payment: order.payment_method_title || "N/A",
      customer: {
        name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
        email: order.billing?.email || "",
        phone: order.billing?.phone || "",
        address: order.billing?.address_1 || "",
      },
      items: order.line_items || [],
      date_created: order.date_created,
      date_modified: order.date_modified,
    };

    // 🧠 Upsert into MongoDB
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: order.id },
      { $set: orderData },
      { upsert: true, new: true }
    );

    // 📧 Send email only when order is created
    if (eventType === "order.created" && orderData.customer.email) {
      await sendEmail({
        to: orderData.customer.email,
        subject: `✅ Order Placed Successfully (#${orderData.orderId})`,
        html: newOrderTemplate(orderData),
      });
    }

    console.log(`✅ Webhook processed: ${eventType} for Order #${order.id}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
