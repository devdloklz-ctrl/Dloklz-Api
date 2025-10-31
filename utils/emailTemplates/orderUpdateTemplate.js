export const orderUpdateTemplate = (order) => {
  console.log("🧾 Incoming order data:", JSON.stringify(order, null, 2));

  const customer = order.customer || {};
  const customerName = customer.name || "N/A";
  const customerEmail = customer.email || "N/A";
  const customerPhone = customer.phone || "N/A";
  const items = Array.isArray(order.items) ? order.items : [];

  return `
    <div style="
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      padding: 32px;
      max-width: 640px;
      margin: 0 auto;
      color: #111827;
    ">
      <div style="
        background-color: #ffffff;
        border-radius: 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        padding: 32px;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px;">📦 Order Update</h2>
          <p style="margin-top: 8px; color: #6b7280; font-size: 15px;">
            Your order status has been updated successfully.
          </p>
        </div>

        <!-- Order Summary -->
        <table width="100%" cellspacing="0" cellpadding="0" style="
          border-collapse: collapse;
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
        ">
          <tr>
            <td style="padding: 12px 16px; font-weight: 600; width: 35%;">Order ID</td>
            <td style="padding: 12px 16px;">#${order.orderId || "N/A"}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 12px 16px; font-weight: 600;">Status</td>
            <td style="padding: 12px 16px; text-transform: capitalize;">
              ${order.status || "N/A"}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: 600;">Payment</td>
            <td style="padding: 12px 16px;">${order.payment || "N/A"}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 12px 16px; font-weight: 600;">Total Amount</td>
            <td style="padding: 12px 16px; color: #16a34a; font-weight: 600;">
              ₹${order.total || "0.00"}
            </td>
          </tr>
        </table>

        <!-- Customer Info -->
        <h3 style="font-size: 17px; margin-bottom: 10px;">👤 Customer Details</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 24px;
        ">
          <tr>
            <td style="padding: 10px 16px; font-weight: 600; width: 30%;">Name</td>
            <td style="padding: 10px 16px;">${customerName}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 10px 16px; font-weight: 600;">Email</td>
            <td style="padding: 10px 16px;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-weight: 600;">Phone</td>
            <td style="padding: 10px 16px;">${customerPhone}</td>
          </tr>
        </table>

        <!-- Items Table -->
        <h3 style="font-size: 17px; margin-bottom: 10px;">🛍️ Ordered Items</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          font-size: 14px;
        ">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th align="left" style="padding: 12px 16px;">Item</th>
              <th align="center" style="padding: 12px 16px;">Qty</th>
              <th align="right" style="padding: 12px 16px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item, i) => `
                  <tr style="background: ${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                    <td style="padding: 10px 16px;">${item.name || "Unnamed Item"}</td>
                    <td align="center" style="padding: 10px 16px;">${item.quantity || 1}</td>
                    <td align="right" style="padding: 10px 16px;">₹${item.total || 0}</td>
                  </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
            Thank you for shopping with <strong>Dloklz</strong> 💛
          </p>
        </div>
      </div>

      <p style="
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        margin-top: 20px;
      ">
        This is an automated message. Please do not reply.
      </p>
    </div>
  `;
};
