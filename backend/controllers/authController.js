import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ── Geocode Helper ──
// Converts city + state + country → { lat, lng } using OpenWeatherMap Geo API
// Returns null if geocoding fails (invalid address)
const geocodeAddress = async (city, state, country) => {
  try {
    if (!city || !country) return null;
    const query = `${city},${state || ""},${country}`;
    const res = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${process.env.WEATHER_API_KEY}`
    );
    if (!res.data || res.data.length === 0) return null;
    return { lat: res.data[0].lat, lng: res.data[0].lon };
  } catch (err) {
    console.error("❌ Geocoding failed:", err.message);
    return null;
  }
};

// Helper: strip coordinates from user object before sending to frontend
const sanitizeUser = (userObj) => {
  const obj = typeof userObj.toObject === "function" ? userObj.toObject() : { ...userObj };
  delete obj.coordinates;
  delete obj.password;
  return obj;
};

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
  console.log("📝 Register Request:", req.body);

  const { name, email, password, role, phoneNumber } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // phoneNumber is REQUIRED for new users
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate phone number format
    if (!/^[0-9]+$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must contain only digits" });
    }
    if (phoneNumber.length < 10 || phoneNumber.length > 15) {
      return res.status(400).json({ message: "Phone number must be 10-15 digits" });
    }
    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address: { streetAddress: "", city: "", state: "", country: "" },
      coordinates: { lat: null, lng: null },
      role: role || "buyer",
    });

    if (user) {
      console.log("✅ User Created:", user.email);
      const safe = sanitizeUser(user);
      res.status(201).json({
        _id: safe._id,
        name: safe.name,
        email: safe.email,
        phoneNumber: safe.phoneNumber,
        address: safe.address,
        role: safe.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  console.log("🔑 Login Request:", req.body);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      console.log("✅ Login Successful:", user.email);
      const safe = sanitizeUser(user);
      res.json({
        _id: safe._id,
        name: safe.name,
        email: safe.email,
        phoneNumber: safe.phoneNumber,
        address: safe.address,
        role: safe.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile data
// @route   GET /api/auth/profile
export const getMe = async (req, res) => {
  // In a real app, you'd fetch by ID from the token middleware
  // For now, we just return a success message or the user object if passed
  res.status(200).json({ message: "Profile route working" });
};

// @desc    Update User Profile (Name, Email, Address)
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    // We expect the ID to be sent from the frontend
    const user = await User.findById(req.body.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      // Update phone number if provided
      if (req.body.phoneNumber !== undefined) {
        // Validate phone number
        if (req.body.phoneNumber && !/^[0-9]+$/.test(req.body.phoneNumber)) {
          return res.status(400).json({ message: "Phone number must contain only digits" });
        }
        if (req.body.phoneNumber && (req.body.phoneNumber.length < 10 || req.body.phoneNumber.length > 15)) {
          return res.status(400).json({ message: "Phone number must be 10-15 digits" });
        }
        // Check if phone number already exists (excluding current user)
        if (req.body.phoneNumber) {
          const phoneExists = await User.findOne({ phoneNumber: req.body.phoneNumber, _id: { $ne: user._id } });
          if (phoneExists) {
            return res.status(400).json({ message: "Phone number already in use" });
          }
        }
        user.phoneNumber = req.body.phoneNumber || undefined;
      }

      // ── Update structured address & recalculate coordinates ──
      if (req.body.address !== undefined && typeof req.body.address === "object") {
        const newAddr = req.body.address;
        const oldAddr = user.address || {};

        // Check if location-relevant fields changed (city/state/country)
        const locationChanged =
          (newAddr.city || "") !== (oldAddr.city || "") ||
          (newAddr.state || "") !== (oldAddr.state || "") ||
          (newAddr.country || "") !== (oldAddr.country || "");

        // Update all 4 address fields
        user.address = {
          streetAddress: newAddr.streetAddress || "",
          city: newAddr.city || "",
          state: newAddr.state || "",
          country: newAddr.country || "",
        };

        // Recalculate coordinates ONLY when city/state/country change
        if (locationChanged) {
          if (newAddr.city && newAddr.country) {
            const coords = await geocodeAddress(newAddr.city, newAddr.state, newAddr.country);
            if (coords) {
              user.coordinates = coords;
              console.log(`📍 Geocoded ${newAddr.city}, ${newAddr.state}, ${newAddr.country} → ${coords.lat}, ${coords.lng}`);
            } else {
              return res.status(400).json({
                message: "Could not verify address location. Please check your city, state, and country."
              });
            }
          } else {
            // Clear coordinates if city or country is removed
            user.coordinates = { lat: null, lng: null };
          }
        }
      }

      const updatedUser = await user.save();
      const safe = sanitizeUser(updatedUser);

      res.json({
        _id: safe._id,
        name: safe.name,
        email: safe.email,
        phoneNumber: safe.phoneNumber,
        address: safe.address,
        role: safe.role,
        token: req.body.token // Keep the existing token so they don't get logged out
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("❌ Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};