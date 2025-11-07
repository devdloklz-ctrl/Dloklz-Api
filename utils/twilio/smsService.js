// utils/smsService.js
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 📱 Send an SMS message via Twilio (with retry logic)
 * @param {string} phone - Recipient phone number (+91XXXXXXXXXX or 10-digit)
 * @param {string} message - Message text
 * @param {number} attempt - Internal: used for retry tracking
 * @returns {Promise<{ok: boolean, sid?: string, error?: string}>}
 */
export const sendSMS = async (phone, message, attempt = 1) => {
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

    // Send message
    const response = await client.messages.create(params);
    console.log(`📩 SMS sent successfully to ${formattedPhone} (SID: ${response.sid})`);

    return { ok: true, sid: response.sid };

  } catch (error) {
    console.error(`❌ SMS send error (attempt ${attempt}):`, error.message);

    // Stop retrying after 3 attempts
    if (attempt >= 3) {
      console.warn(`⛔ SMS failed after ${attempt} attempts for ${phone}`);
      return { ok: false, error: error.message };
    }

    // Retry only for transient errors (5xx, timeouts, etc.)
    const transient =
      /ECONNRESET|ETIMEDOUT|5\d\d|timeout|Rate|Limit|Temporary/i.test(error.message);

    if (transient) {
      const delay = attempt * 2000; // exponential backoff (2s, 4s, 6s)
      console.warn(`🔁 Retrying SMS to ${phone} (Attempt ${attempt + 1}) after ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
      return sendSMS(phone, message, attempt + 1);
    }

    return { ok: false, error: error.message };
  }
};
