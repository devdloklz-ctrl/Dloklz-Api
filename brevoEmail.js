// brevoEmail.js
import axios from "axios";

export const sendBrevoEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Dloklz", email: "no-reply@dloklz.com" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📨 Email sent to ${to}: ${subject}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending Brevo email:", error.response?.data || error.message);
  }
};
