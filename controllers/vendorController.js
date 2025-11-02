// controllers/vendorController.js
import axios from "axios";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";

dotenv.config();

/**
 * 🔁 Sync all vendors from Dokan API
 */
export const syncVendors = async (req, res) => {
  try {
    const baseUrl = process.env.DOKAN_API_URL?.trim(); // e.g. https://dloklz.com/wp-json/dokan/v1/stores

    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing DOKAN_API_URL in environment variables.",
      });
    }

    const vendors = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Fetching vendors page ${page}...`);

      // No auth needed since endpoint is public
      const response = await axios.get(baseUrl, {
        params: { page, per_page: 50 },
      });

      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        vendors.push(...data);
        page++;
      }
    }

    console.log(`✅ Total vendors fetched: ${vendors.length}`);

    // Upsert all vendors
    for (const v of vendors) {
      await Vendor.findOneAndUpdate({ id: v.id }, v, {
        upsert: true,
        new: true,
      });
    }

    res.json({
      success: true,
      total: vendors.length,
      message: `✅ Synced ${vendors.length} vendors successfully.`,
    });
  } catch (err) {
    console.error("❌ Vendor Sync Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
};

/**
 * 📦 Get all vendors
 */
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🔍 Get single vendor
 */
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ id: req.params.id });
    if (!vendor)
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });

    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✏️ Update vendor details
 */
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true,
    });
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({
      success: true,
      message: "Vendor updated successfully",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ❌ Delete vendor
 */
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({ id: req.params.id });
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
