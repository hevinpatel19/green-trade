import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("userInfo"));

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    alert("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-green-600 flex items-center gap-2">
          ⚡ GreenTrade
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">Home</Link>
          <Link to="/market" className="text-gray-700 hover:text-green-600 font-medium">Market</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-green-600 font-medium">Sell Energy</Link>
              <Link to="/orders" className="text-gray-700 hover:text-green-600 font-medium">My Orders</Link>
              
              <div className="flex items-center gap-4 ml-4">
                <span className="text-sm font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  👤 {user.name}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;