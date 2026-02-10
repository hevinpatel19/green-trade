import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phoneNumber: "" });
  const [phoneError, setPhoneError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear phone error when user types
    if (e.target.name === "phoneNumber") {
      setPhoneError("");
    }
  };

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required"; // Required for new users
    if (!/^[0-9]+$/.test(phone)) {
      return "Phone number must contain only digits";
    }
    if (phone.length < 10 || phone.length > 15) {
      return "Phone number must be 10-15 digits";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number before submission
    const phoneValidationError = validatePhone(formData.phoneNumber);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    try {
      // Call the Register Endpoint
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);

      toast.success("Registration Successful! Please Login.");
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" name="name" placeholder="Full Name"
            onChange={handleChange} required
            className="w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email" name="email" placeholder="Email Address"
            onChange={handleChange} required
            className="w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div>
            <input
              type="tel" name="phoneNumber" placeholder="Phone Number (10-15 digits)"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 ${phoneError ? "border-red-500 focus:ring-red-500" : "focus:ring-green-500"
                }`}
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>
          <input
            type="password" name="password" placeholder="Password"
            onChange={handleChange} required
            className="w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;