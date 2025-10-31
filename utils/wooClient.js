import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // load environment variables

const { WOO_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET } = process.env;

// Basic validation
if (!WOO_BASE_URL || !WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
  console.error("❌ Missing WooCommerce environment variables in .env file");
  throw new Error("WooCommerce configuration is incomplete");
}

// Remove trailing slash if present
const cleanBaseURL = WOO_BASE_URL.endsWith("/")
  ? WOO_BASE_URL.slice(0, -1)
  : WOO_BASE_URL;

// Create axios instance
const wooClient = axios.create({
  baseURL: cleanBaseURL,
  auth: {
    username: WOO_CONSUMER_KEY,
    password: WOO_CONSUMER_SECRET,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional debug log
console.log("✅ WooCommerce Client Initialized:", cleanBaseURL);

export default wooClient;
