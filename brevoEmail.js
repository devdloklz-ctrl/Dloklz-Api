// utils/brevoEmail.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { BREVO_API_KEY, EMAIL_FROM } = process.env;

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: EMAIL_FROM, name: "Dloklz" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    console.log("✅ Email sent via Brevo:", response.data.messageId || response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Email send error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to send email");
  }
};
