import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      
      // Save User Data to Local Storage (Basic Session)
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      
      alert(`👋 Welcome back, ${res.data.name}!`);
      navigate("/"); // Redirect to Home
      window.location.reload(); // Refresh to update Navbar
    } catch (error) {
      console.error(error);
      alert("Invalid Email or Password");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" name="email" placeholder="Email Address" 
            onChange={handleChange} required
            className="w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input 
            type="password" name="password" placeholder="Password" 
            onChange={handleChange} required
            className="w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          
          <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          New here? <Link to="/register" className="text-blue-600 font-bold">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;