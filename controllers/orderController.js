import Order from "../models/Order.js";
import wooClient from "../utils/wooClient.js";

export const syncOrders = async (req, res) => {
  try {
    const { data } = await wooClient.get("/orders");
    for (const order of data) {
      await Order.findOneAndUpdate(
        { orderId: order.id },
        {
          orderId: order.id,
          status: order.status,
          total: order.total,
          currency: order.currency,
          customer: {
            name: order.billing.first_name + " " + order.billing.last_name,
            email: order.billing.email,
            phone: order.billing.phone,
          },
          items: order.line_items,
        },
        { upsert: true }
      );
    }
    res.json({ message: "Orders synced successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
