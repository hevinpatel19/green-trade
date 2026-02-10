import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Replaces walletAddress
  password: { type: String, required: true }, // Stores the login password
  phoneNumber: {
    type: String,
    required: false, // Optional for backward compatibility with existing users
    unique: true,
    sparse: true, // Allows multiple documents without phoneNumber (null/undefined)
    minlength: [10, "Phone number must be at least 10 digits"],
    maxlength: [15, "Phone number cannot exceed 15 digits"],
    match: [/^[0-9]+$/, "Phone number must contain only digits"],
  },
  address: {
    type: String,
    required: false, // Not required during signup, can be added via profile
    trim: true,
  },
  role: { type: String, default: "user" }, // Can be 'user' or 'admin'
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);