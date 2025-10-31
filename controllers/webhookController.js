import Order from "../models/Order.js";
import { sendEmail } from "../brevoEmail.js";
import { newOrderTemplate, orderUpdateTemplate } from "../utils/emailTemplates/index.js";

/**
 * Handle WooCommerce "Order Created" Webhook
 */
export const orderCreated = async (req, res) => {
  try {
    const order = req.body;

    // Basic validation
    if (!order?.id) {
      return res.status(400).json({ message: "Invalid order payload" });
    }

    const orderData = {
      orderId: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      customer: {
        name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
        email: order.billing?.email || "",
        phone: order.billing?.phone || "",
      },
      items: order.line_items || [],
    };

    await Order.findOneAndUpdate({ orderId: order.id }, orderData, {
      upsert: true,
      new: true,
    });

    // 📧 Send email
    if (order.billing?.email) {
      await sendEmail({
        to: order.billing.email,
        subject: `✅ Order Placed Successfully (#${order.id})`,
        html: newOrderTemplate(orderData),
      });
    }

    console.log(`🟢 [Webhook] Order Created/Updated → ID: ${order.id}`);
    return res.json({ message: "Order created or updated successfully" });
  } catch (err) {
    console.error("❌ Webhook Error (Created):", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Handle WooCommerce "Order Updated" Webhook
 */
export const orderUpdated = async (req, res) => {
  try {
    const order = req.body;

    if (!order?.id) {
      return res.status(400).json({ message: "Invalid order payload" });
    }

    // Prepare partial update fields
    const orderData = {
      status: order.status,
      total: order.total,
      currency: order.currency,
      customer: {
        name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
        email: order.billing?.email || "",
        phone: order.billing?.phone || "",
      },
      items: order.line_items || [],
    };

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: order.id },
      orderData,
      { new: true, upsert: true }
    );

    // 📧 Send email
    if (order.billing?.email) {
      await sendEmail({
        to: order.billing.email,
        subject: `📦 Order Update (#${order.id}) – ${order.status}`,
        html: orderUpdateTemplate(orderData),
      });
    }

    console.log(`🟡 [Webhook] Order Updated → ID: ${order.id}`);
    return res.json({
      message: "Order updated successfully",
      orderId: updatedOrder?.orderId,
      status: updatedOrder?.status,
    });
  } catch (err) {
    console.error("❌ Webhook Error (Updated):", err);
    return res.status(500).json({ message: err.message });
  }
};
