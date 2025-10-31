// utils/emailTemplates/newOrderTemplate.js
export default function newOrderTemplate(order) {
  return {
    subject: `🛒 New Order #${order.orderId}`,
    html: `
      <h2>New Order Received</h2>
      <p>Order ID: <strong>${order.orderId}</strong></p>
      <p>Status: ${order.status}</p>
      <p>Total: ${order.total} ${order.currency}</p>
      <p>Customer: ${order.customer?.name}</p>
      <p>Email: ${order.customer?.email}</p>
      <p>Phone: ${order.customer?.phone}</p>
    `,
  };
}
