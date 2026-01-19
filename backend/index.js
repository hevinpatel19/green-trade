import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";



// Import Routes
import authRoutes from "./routes/authRoutes.js";
import energyRoutes from "./routes/energyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/energy", energyRoutes);
// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/payment", paymentRoutes); 

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/greentrade")
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("⚠️ MongoDB Not Connected"));

// Basic Route
app.get("/", (req, res) => {
  res.send("Green-Trade Backend is Running! 🚀");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

