import Order from "../models/Order.js";

export const orderCreated = async (req, res) => {
  try {
    const order = req.body;
    await Order.findOneAndUpdate({ orderId: order.id }, order, { upsert: true });
    res.json({ message: "Order created/updated in DB" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const orderUpdated = async (req, res) => {
  try {
    const order = req.body;
    await Order.findOneAndUpdate({ orderId: order.id }, order);
    res.json({ message: "Order updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
