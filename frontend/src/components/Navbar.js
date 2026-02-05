import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="group flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-green-200 shadow-lg group-hover:scale-110 transition-transform duration-300">
                ⚡
              </div>
              <span className="font-extrabold text-2xl text-gray-900 tracking-tight group-hover:text-green-600 transition-colors">
                GreenTrade
              </span>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition">
              HOME
            </Link>
            <Link to="/market" className="text-sm font-bold text-gray-500 hover:text-green-600 transition">
              MARKET
            </Link>

            {user && (
              <>
                <Link to="/orders" className="text-sm font-bold text-gray-500 hover:text-green-600 transition">
                  ORDERS
                </Link>
                {/* ✅ DASHBOARD IS NOW VISIBLE FOR EVERYONE LOGGED IN */}
                <Link to="/dashboard" className="text-sm font-bold text-gray-500 hover:text-green-600 transition">
                  DASHBOARD
                </Link>
                {/* ✅ ADMIN BUTTON - Only visible for admin users */}
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm font-bold text-purple-600 hover:text-purple-800 transition flex items-center gap-1">
                    <span>🛡️</span> ADMIN
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">

                <Link to="/profile" className="hidden md:block text-right group cursor-pointer">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-green-500 transition">
                    ACCOUNT
                  </p>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition">
                    {user.name}
                  </p>
                </Link>

                <Link
                  to="/profile"
                  className="h-10 w-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition"
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>

                <button
                  onClick={handleLogout}
                  className="ml-2 text-gray-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 font-bold hover:text-green-600 transition px-4 py-2">
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-bold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign Up
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