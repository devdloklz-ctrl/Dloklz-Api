import express from "express";
import { getAllUsers, getUserById, updateUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Owner can view all users
router.get("/", authMiddleware, roleMiddleware("owner"), getAllUsers);

// Owner can view a single user by ID
router.get("/:id", authMiddleware, roleMiddleware("owner"), getUserById);

// Owner can update any user
router.put("/:id", authMiddleware, roleMiddleware("owner"), updateUser);

export default router;
