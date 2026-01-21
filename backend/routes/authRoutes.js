import express from "express";
import { registerUser, loginUser, getMe, updateProfile } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// GET profile data
router.get("/profile", getMe);

// PUT (Update) profile data - Name/Email
router.put("/profile", updateProfile);

export default router;