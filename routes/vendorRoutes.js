import express from "express";
import {
  syncVendors,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

// 🔁 Sync vendors from Dokan API
router.get("/sync", syncVendors);

// 📦 CRUD Routes
router.get("/", getAllVendors);
router.get("/:id", getVendorById);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
