// utils/emailTemplates/orderUpdateTemplate.js
export default function orderUpdateTemplate(order) {
  return {
    subject: `📦 Order #${order.orderId} Status Updated`,
    html: `
      <h2>Order Status Updated</h2>
      <p>Order ID: <strong>${order.orderId}</strong></p>
      <p>New Status: <strong>${order.status}</strong></p>
      <p>Total: ${order.total} ${order.currency}</p>
    `,
  };
}
