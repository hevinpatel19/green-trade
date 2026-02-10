import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import orderRoutes from "./routes/orderRoutes.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import energyRoutes from "./routes/energyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// ...

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/greentrade")
  .then(async () => {
    console.log("✅ MongoDB Connected!");
    // Index cleanup (runs once on startup)
    try {
      await mongoose.connection.collection('users').dropIndex('walletAddress_1');
      console.log("✅ FIXED: Bad Index 'walletAddress_1' dropped successfully.");
    } catch (err) {
      // If the index is already gone, this is fine
      console.log("ℹ️ Index cleanup:", err.message);
    }
  })
  .catch((err) => console.log("⚠️ MongoDB Not Connected"));

// Basic Route
app.get("/", (req, res) => {
  res.send("Green-Trade Backend is Running! 🚀");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

