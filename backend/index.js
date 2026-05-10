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
import walletRoutes from "./routes/walletRoutes.js";

// Import auction auto-close logic
import { closeExpiredAuctions } from "./controllers/marketController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed Frontend Origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow only whitelisted origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Block other origins
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);

// Database Connection
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/greentrade"
  )
  .then(async () => {
    console.log("✅ MongoDB Connected!");

    // Index cleanup
    try {
      await mongoose.connection
        .collection("users")
        .dropIndex("walletAddress_1");

      console.log(
        "✅ FIXED: Bad Index 'walletAddress_1' dropped successfully."
      );
    } catch (err) {
      console.log("ℹ️ Index cleanup:", err.message);
    }

    // Auction auto-close scheduler
    setInterval(() => {
      closeExpiredAuctions(null, null);
    }, 60 * 1000);

    console.log("⏱️ Auction auto-close scheduler started (every 60s).");
  })
  .catch((err) => {
    console.log("⚠️ MongoDB Not Connected");
    console.log(err.message);
  });

// Health Route
app.get("/", (req, res) => {
  res.send("Green-Trade Backend is Running! 🚀");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});