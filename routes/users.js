// routes/users.js
import express from "express";
import { getAllUsers, getProfile, updateProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Owner can see all users
router.get("/", authMiddleware, roleMiddleware("owner"), getAllUsers);

// Vendor or owner can view/update their own profile
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

export default router;
