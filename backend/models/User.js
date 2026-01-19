import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Replaces walletAddress
  password: { type: String, required: true }, // Stores the login password
  role: { type: String, default: "user" }, // Can be 'user' or 'admin'
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);