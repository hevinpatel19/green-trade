import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env file");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  console.log("📝 Register Request:", req.body); // Debug Log

  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "buyer",
    });

    if (user) {
      console.log("✅ User Created:", user.email);
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("❌ Register Error:", error.message); // This will show in terminal
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  console.log("🔑 Login Request:", req.body); // Debug Log
  
  const { email, password } = req.body;

  try {
    // 1. Find User
    const user = await User.findOne({ email });

    if (!user) {
        console.log("❌ User not found");
        return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      console.log("✅ Login Successful:", user.email);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      console.log("❌ Password Mismatch");
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile (Placeholder)
export const getMe = async (req, res) => {
    res.status(200).json({ message: "Profile route working" });
};