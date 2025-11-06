import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js"; // ✅ import vendor model
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate } from "../utils/emailTemplates/index.js";
import { sendSMS } from "../utils/twilio/smsService.js";

const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "Dloklz@123";

/** Verify WooCommerce webhook signature */
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

/** WooCommerce Webhook Handler */
export const handleWooWebhook = async (req, res) => {
  try {
    const topic = req.headers["x-wc-webhook-topic"];
    const deliveryId = req.headers["x-wc-webhook-delivery-id"];
    const rawBody = req.body;

    if (!topic) return res.status(200).json({ message: "Ping acknowledged" });
    if (!Buffer.isBuffer(rawBody)) return res.status(400).json({ message: "Invalid raw body format" });
    if (!verifySignature(rawBody, req.headers)) return res.status(401).json({ message: "Invalid webhook signature" });

    let data;
    try {
      data = JSON.parse(rawBody.toString("utf8"));
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    const orderId = data.id;
    console.log(`📦 Webhook received: ${topic} | Order ID: ${orderId}`);

    const vendorMeta = data.meta_data?.find((meta) => meta.key === "_dokan_vendor_id");
    const vendorId = vendorMeta ? vendorMeta.value : data.store?.id || null;

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

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: mappedOrder },
      { upsert: true, new: true }
    );

    console.log(`✅ Order ${orderId} saved/updated in MongoDB (${topic})`);

    if (topic === "order.created") {
      const { email, phone, name } = mappedOrder.customer;
      const ownerPhone = process.env.OWNER_PHONE_NUMBER;

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
      }

      // 📱 Send Customer SMS
      if (phone && phone.trim() !== "") {
        const smsMessage = `Hi ${name || "Customer"}, your order #${orderId} of ₹${mappedOrder.total} has been placed successfully. We'll notify you once it's updated. - Dloklz Store Team`;
        try {
          await sendSMS(phone, smsMessage);
          console.log(`📩 SMS sent to Customer (${phone})`);
        } catch (err) {
          console.error(`❌ Failed to send customer SMS:`, err.message);
        }
      }

      // 📱 Send Owner SMS
      if (ownerPhone) {
        const ownerMsg = `📦 New order received!\nOrder #${orderId} | Total: ₹${mappedOrder.total}\nPlease check the dashboard for details.`;
        try {
          await sendSMS(ownerPhone, ownerMsg);
          console.log(`📩 SMS sent to Owner (${ownerPhone})`);
        } catch (err) {
          console.error(`❌ Failed to send owner SMS:`, err.message);
        }
      }

      // 📱 Send Vendor SMS
      if (vendorId) {
        try {
          const vendor = await Vendor.findOne({ id: vendorId });
          if (vendor?.phone) {
            const vendorMsg = `🛍️ You have a new order (#${orderId}). Please prepare the items for processing.`;
            await sendSMS(vendor.phone, vendorMsg);
            console.log(`📩 SMS sent to Vendor (${vendor.phone})`);
          } else {
            console.warn(`⚠️ Vendor phone not found for vendorId: ${vendorId}`);
          }
        } catch (err) {
          console.error(`❌ Error sending SMS to Vendor (ID: ${vendorId}):`, err.message);
        }
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
