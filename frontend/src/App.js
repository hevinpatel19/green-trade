import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 🔴 DELETE THIS LINE:
// import AuthContext, { AuthProvider } from "./context/UserContext";

// ✅ ADD THIS LINE (Import UserProvider, NOT AuthProvider):
import UserContext, { UserProvider } from "./context/UserContext"; 

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import Dashboard from "./pages/Dashboard";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrderPage from "./pages/OrderPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext); 
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      {/* ✅ USE UserProvider HERE */}
      <UserProvider> 
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/market" element={<MarketPage />} />
            
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrderPage /></PrivateRoute>} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;