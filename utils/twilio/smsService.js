// utils/smsService.js
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 📱 Send an SMS message via Twilio (no retries)
 * @param {string} phone - Recipient phone number (+91XXXXXXXXXX or 10-digit)
 * @param {string} message - Message text
 * @returns {Promise<{ok: boolean, sid?: string, error?: string}>}
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

    // ✅ Use Messaging Service SID if available, otherwise fallback to phone number
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      params.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_SMS_NUMBER) {
      params.from = process.env.TWILIO_SMS_NUMBER;
    } else {
      throw new Error("Missing Twilio 'from' configuration");
    }

    // Send message (only one attempt)
    const response = await client.messages.create(params);
    console.log(`📩 SMS sent successfully to ${formattedPhone} (SID: ${response.sid})`);

    return { ok: true, sid: response.sid };

  } catch (error) {
    console.error(`❌ SMS send error:`, error.message);
    return { ok: false, error: error.message };
  }
};
