import Order from "../models/Order.js";
import wooClient from "../utils/wooClient.js";
import { sendEmail } from "../brevoEmail.js";
import { sendSMS } from "../utils/twilio/smsService.js";
import { newOrderTemplate, orderUpdateTemplate } from "../utils/emailTemplates/index.js";

/**
 * 📦 Get Orders (Role-aware)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, search, vendorId: queryVendorId, from, to, page, limit } = req.query;

    const query = {};

    /**
     * 🧩 Role-based restriction
     * - Vendor → Only their orders (nested: order.fullData.store.id)
     * - Owner → Can filter by any vendorId
     */
    if (req.user.role === "vendor") {
      query["fullData.store.id"] = req.user.vendorId;
    } else if (queryVendorId) {
      // Owner manually filters vendor
      query["fullData.store.id"] = Number(queryVendorId);
    }

    // 🟡 Filter by order status (top-level or inside Woo data)
    if (status) {
      query.$or = [
        { status: status },
        { "order.status": status },
      ];
    }

    // 🟡 Date range filtering (based on createdAt)
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    // 🟡 Search by customer name, email, phone, or orderId
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchConditions = [
        { "customer.name": searchRegex },
        { "customer.email": searchRegex },
        { "customer.phone": searchRegex },
        { "order.billing.first_name": searchRegex },
        { "order.billing.last_name": searchRegex },
        { "order.billing.email": searchRegex },
      ];
      if (!isNaN(search)) searchConditions.push({ orderId: Number(search) });
      query.$or = query.$or ? [...query.$or, ...searchConditions] : searchConditions;
    }

    // 🧾 Pagination setup
    let ordersQuery = Order.find(query).sort({ createdAt: -1 });

    const totalOrders = await Order.countDocuments(query);
    let totalPages = 1;

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      ordersQuery = ordersQuery.skip(skip).limit(Number(limit));
      totalPages = Math.ceil(totalOrders / Number(limit));
    }

    const orders = await ordersQuery.exec();

    res.status(200).json({
      success: true,
      totalOrders,
      currentPage: page ? Number(page) : null,
      totalPages,
      orders,
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🔄 Sync all orders from WooCommerce → MongoDB
 */
export const syncOrders = async (req, res) => {
  try {
    let allOrders = [];
    let page = 1;
    const perPage = 100;

    console.log("🔄 Starting full order sync from WooCommerce...");

    while (true) {
      const { data } = await wooClient.get("/orders", {
        params: { per_page: perPage, page },
      });

      if (!Array.isArray(data) || data.length === 0) break;
      allOrders.push(...data);
      console.log(`📦 Page ${page} fetched (${data.length} orders)`);

      if (data.length < perPage) break;
      page++;
    }

    console.log(`✅ Total WooCommerce orders fetched: ${allOrders.length}`);

    if (allOrders.length === 0) {
      return res.json({ message: "No new orders to sync", totalOrders: 0 });
    }

    const bulkOps = allOrders.map((order) => ({
      updateOne: {
        filter: { orderId: order.id },
        update: {
          $set: {
            orderId: order.id,
            vendorId: order.vendor_id || null, // 👈 Ensure vendor linkage is stored
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
          },
        },
        upsert: true,
      },
    }));

    const result = bulkOps.length > 0 ? await Order.bulkWrite(bulkOps) : null;

    if (result) {
      console.log("🧾 Bulk operation summary:", {
        matched: result.matchedCount,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      });
    }

    // 📨 Send new order email notifications
    if (result?.upsertedCount > 0 && result.upsertedIds) {
      const upsertedOrderIds = Object.values(result.upsertedIds).map(String);
      const newOrders = allOrders.filter((order) =>
        upsertedOrderIds.includes(String(order.id))
      );

      const emailPromises = newOrders.map(async (wcOrder) => {
        const orderData = {
          orderId: wcOrder.id,
          status: wcOrder.status,
          total: wcOrder.total,
          currency: wcOrder.currency,
          payment: wcOrder.payment_method_title || "N/A",
          customer: {
            name: `${wcOrder.billing?.first_name || ""} ${wcOrder.billing?.last_name || ""}`.trim(),
            email: wcOrder.billing?.email || "",
            phone: wcOrder.billing?.phone || "",
            address: wcOrder.billing?.address_1 || "",
          },
          items: wcOrder.line_items || [],
        };

        if (!orderData.customer.email) {
          console.log(`⚠️ Skipping email for order ${orderData.orderId} — no customer email`);
          return { ok: false, orderId: orderData.orderId, error: "No email" };
        }

        try {
          await sendEmail({
            to: orderData.customer.email,
            subject: `✅ Order Placed Successfully (#${orderData.orderId})`,
            html: newOrderTemplate(orderData),
          });
          return { ok: true, orderId: orderData.orderId };
        } catch (err) {
          console.error(`❌ Failed to send email for Order #${orderData.orderId}:`, err.message);
          return { ok: false, orderId: orderData.orderId, error: err.message };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      console.log(
        `📧 New order emails sent: ${emailResults.filter((r) => r.ok).length}, failed: ${
          emailResults.filter((r) => !r.ok).length
        }`
      );
    }

    console.log("✅ Orders synced successfully with MongoDB");
    return res.json({
      message: "Orders synced successfully",
      totalOrders: allOrders.length,
      upsertedCount: result?.upsertedCount || 0,
    });
  } catch (err) {
    console.error("❌ Woo Sync Error:", err.response?.data || err.message);
    return res.status(500).json({ message: err.response?.data || err.message });
  }
};

/**
 * 🔁 Update WooCommerce order status + local DB + send notifications
 */
export const updateWooOrder = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ message: "orderId and status are required" });
    }

    const localOrder = await Order.findOne({ orderId });
    if (!localOrder) {
      return res.status(404).json({ message: "Order not found in local database" });
    }

    const { data } = await wooClient.put(`/orders/${orderId}`, { status });

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { status: data.status, total: data.total },
      { new: true }
    );

    console.log(`🔄 Synced status to WooCommerce → Order #${orderId}: ${data.status}`);

    // 📧 Email
    const customerEmail = updatedOrder?.customer?.email;
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: `📦 Order Update (#${orderId}) – ${data.status.toUpperCase()}`,
          html: orderUpdateTemplate(updatedOrder),
        });
      } catch (emailErr) {
        console.error(`❌ Email send failed for Order #${orderId}:`, emailErr.message);
      }
    }

    // 📱 SMS
    const customerPhone = updatedOrder?.customer?.phone;
    if (customerPhone) {
      try {
        const smsMessage = `Your order #${orderId} status has been updated to "${data.status}". - Dloklz Store Team`;
        await sendSMS(customerPhone, smsMessage);
      } catch (smsErr) {
        console.error(`❌ SMS send failed for Order #${orderId}:`, smsErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Order updated successfully on WooCommerce and MongoDB",
      orderId,
      status: updatedOrder.status,
    });
  } catch (err) {
    console.error("❌ WooCommerce Update Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update WooCommerce order",
      error: err.response?.data || err.message,
    });
  }
};
