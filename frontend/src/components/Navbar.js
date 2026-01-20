import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/UserContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* 1. Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 tracking-tight">
              <span className="text-green-600 text-3xl">⚡</span>
              GreenTrade
            </Link>
          </div>

          {/* 2. Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-gray-500 hover:text-green-600 font-medium transition">
              Home
            </Link>
            <Link to="/market" className="text-gray-500 hover:text-green-600 font-medium transition">
              Live Market
            </Link>

            {/* 3. Dynamic Section (Logged In vs Guest) */}
            {user ? (
              <>
                {/* Protected Links */}
                <Link to="/dashboard" className="text-gray-500 hover:text-green-600 font-medium transition">
                  {user.role === 'seller' ? 'Seller Hub' : 'Dashboard'}
                </Link>
                <Link to="/orders" className="text-gray-500 hover:text-green-600 font-medium transition">
                  History
                </Link>

                {/* User Badge & Logout */}
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-800 leading-none">{user.name}</p>
                    <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {user.role || "Trader"}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              /* Guest Buttons */
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-900 font-bold hover:text-green-600 transition">
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;