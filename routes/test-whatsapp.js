import express from "express";
import twilio from "twilio";

const router = express.Router();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post("/", async (req, res) => {
  try {
    const to = req.body.to || process.env.TEST_WHATSAPP_NUMBER;
    const variables = req.body.variables || ["Monish"];

    // Send using Messaging Service SID (recommended for templates)
    const message = await client.messages.create({
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to,
      contentSid: process.env.TWILIO_TEMPLATE_SID, // template SID
      contentVariables: JSON.stringify({
        "1": variables[0] || "there", // maps to your {{1}} variable in template
      }),
    });

    res.status(200).json({
      success: true,
      message: "✅ WhatsApp template message sent successfully!",
      sid: message.sid,
    });
  } catch (error) {
    console.error("❌ WhatsApp send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message.",
      error: error.message,
    });
  }
});

export default router;
