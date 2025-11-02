import express from "express";
import { register, login, refreshToken } from "../controllers/authController.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token (optional)
 * @access  Public
 */
router.post("/refresh-token", refreshToken);

export default router;
