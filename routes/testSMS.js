import express from "express";
import twilio from "twilio";

const router = express.Router();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ✅ Send Test SMS
router.post("/", async (req, res) => {
  try {
    const { to = process.env.TEST_SMS_NUMBER, message = "Hello from Dloklz SMS API test!" } = req.body;

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_SMS_NUMBER,
      to,
    });

    res.status(200).json({
      success: true,
      message: "✅ SMS sent successfully!",
      sid: response.sid,
    });
  } catch (error) {
    console.error("❌ SMS send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send SMS.",
      error: error.message,
    });
  }
});

export default router;
