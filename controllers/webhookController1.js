import dotenv from "dotenv";
dotenv.config(); // ✅ Ensure env vars are loaded early

import crypto from "crypto";
import Order from "../models/Order.js";
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate } from "../utils/emailTemplates/index.js";
import { sendSMS } from "../utils/twilio/smsService.js";

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

    // ✅ Handle WooCommerce test ping
    if (!topic) {
      console.log("✅ WooCommerce webhook test ping received");
      return res.status(200).json({ message: "Ping acknowledged" });
    }

    // ✅ Validate raw body
    if (!Buffer.isBuffer(rawBody)) {
      console.warn("⚠️ Raw body is not a Buffer. Webhook may fail verification.");
      return res.status(400).json({ message: "Invalid raw body format" });
    }

    // ✅ Verify signature
    if (!verifySignature(rawBody, req.headers)) {
      console.warn("⚠️ Invalid WooCommerce webhook signature");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    // ✅ Parse JSON payload
    let data;
    try {
      data = JSON.parse(rawBody.toString("utf8"));
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    const orderId = data.id;
    console.log(`📦 Webhook received: ${topic} | Delivery ID: ${deliveryId} | Order ID: ${orderId}`);

    // ✅ Map WooCommerce order to Mongo schema
    const mappedOrder = {
      orderId,
      status: data.status,
      total: data.total,
      currency: data.currency,
      paymentMethod: data.payment_method,
      dateCreated: data.date_created,
      dateModified: data.date_modified,
      customer: {
        name: `${data.billing?.first_name || ""} ${data.billing?.last_name || ""}`.trim(),
        email: data.billing?.email || "",
        phone: data.billing?.phone || "",
        address: `${data.billing?.address_1 || ""}, ${data.billing?.city || ""}, ${data.billing?.state || ""}, ${data.billing?.country || ""}`.trim(),
      },
      items:
        data.line_items?.map((item) => ({
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          sku: item.sku || "",
        })) || [],
      notes: data.customer_note || "",
      shippingMethod: data.shipping_lines?.[0]?.method_title || "",
      fullData: data,
      webhookTopic: topic,
      webhookDeliveryId: deliveryId,
    };

    // ✅ Save or update order in MongoDB
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: mappedOrder },
      { upsert: true, new: true }
    );

    console.log(`✅ Order ${orderId} saved/updated in MongoDB (${topic})`);

    // ✅ Send email + SMS only for new orders
    if (topic === "order.created") {
      const { email, phone, name } = mappedOrder.customer;

      // 🧩 Check Twilio config before trying SMS
      console.log("🧩 Twilio Env Check:", {
        SID: process.env.TWILIO_SID ? "✅" : "❌ missing",
        FROM: process.env.TWILIO_PHONE_NUMBER || "❌ missing",
      });

      // ✉️ Send Email
      if (email) {
        try {
          await sendEmail({
            to: email,
            subject: `✅ Order Placed Successfully (#${orderId})`,
            html: newOrderTemplate(mappedOrder),
          });
          console.log(`📧 Email sent to ${email}`);
        } catch (err) {
          console.error(`❌ Failed to send email for Order #${orderId}:`, err.message);
        }
      } else {
        console.warn(`⚠️ No customer email found for Order #${orderId}, skipping email.`);
      }

      // 📱 Send SMS
      if (phone && phone.trim() !== "") {
        const smsMessage = `Hi ${name || "Customer"}, your order #${orderId} of ₹${mappedOrder.total} has been placed successfully. We'll notify you once it's updated. - Dloklz Store Team`;
        try {
          const smsResult = await sendSMS(phone, smsMessage);
          if (smsResult.ok) {
            console.log(`📩 SMS sent to ${phone} (SID: ${smsResult.sid})`);
          } else {
            console.warn(`⚠️ SMS failed for Order #${orderId}: ${smsResult.error}`);
          }
        } catch (smsErr) {
          console.error(`❌ SMS send error for Order #${orderId}:`, smsErr.message);
        }
      } else {
        console.warn(`⚠️ No valid phone number for Order #${orderId}, skipping SMS.`);
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
