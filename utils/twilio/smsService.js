// utils/smsService.js
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 📱 Send an SMS message via Twilio
 * Automatically retries once on transient errors
 * @param {string} phone - Recipient phone number (+91XXXXXXXXXX or 10-digit)
 * @param {string} message - Message text
 */
export const sendSMS = async (phone, message) => {
  try {
    if (!phone) {
      console.warn("⚠️ No phone number provided for SMS");
      return { ok: false, error: "Missing phone number" };
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.trim()}`;

    const params = {
      body: message,
      to: formattedPhone,
    };

    // ✅ Use MessagingServiceSid if available, otherwise fallback to phone number
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      params.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_SMS_NUMBER) {
      params.from = process.env.TWILIO_SMS_NUMBER;
    } else {
      throw new Error("Missing Twilio 'from' configuration");
    }

    // Send message
    const response = await client.messages.create(params);
    console.log(`📩 SMS sent successfully to ${formattedPhone} (SID: ${response.sid})`);

    return { ok: true, sid: response.sid };
  } catch (error) {
    console.error("❌ SMS send error:", error.message);

    // 🔁 Retry once for temporary issues (e.g., timeout, 5xx)
    if (!error.message.includes("Missing") && !error.retried) {
      console.warn("🔁 Retrying SMS send...");
      await new Promise((r) => setTimeout(r, 3000));
      return sendSMS(phone, message, { retried: true });
    }

    return { ok: false, error: error.message };
  }
};
