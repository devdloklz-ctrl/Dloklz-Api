// routes/testEmail.js
import express from "express";
import { sendEmail } from "../brevoEmail.js";
import { orderUpdateTemplate } from "../utils/emailTemplates/index.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  const result = await sendEmail({
    to: "monishranjan9@gmail.com",
    subject: "🧪 Test Email from Brevo Integration",
    html: orderUpdateTemplate({
      orderId: 9999,
      customerName: "Monish Test",
      status: "processing",
      total: "1998.00",
      currency: "INR",
    }),
  });

  res.json({ success: result });
});

export default router;
