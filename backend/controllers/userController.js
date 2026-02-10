import User from "../models/User.js";

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // In a real app, you would hash the password here (e.g., bcrypt)
    // For this demo, we store it simply to ensure it works first
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get seller contact info (public fields only)
// @route   GET /api/users/seller/:email
export const getSellerContact = async (req, res) => {
  const { email } = req.params;

  try {
    const seller = await User.findOne({ email });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Return only public contact fields
    res.json({
      name: seller.name,
      email: seller.email,
      phoneNumber: seller.phoneNumber || null,
    });
  } catch (error) {
    console.error("Error fetching seller contact:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && user.password === password) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};