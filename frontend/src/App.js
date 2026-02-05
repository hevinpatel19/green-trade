import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context
import UserContext, { UserProvider } from "./context/UserContext";

// Components
import Navbar from "./components/Navbar";

// Pages
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import Dashboard from "./pages/Dashboard";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrderPage from "./pages/OrderPage";
import ProfilePage from "./pages/ProfilePage"; // ✅ Imported here
import AuctionPage from "./pages/AuctionPage"; // ✅ IMPORT THIS
import AdminPage from "./pages/AdminPage"; // ✅ Admin Dashboard

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <UserProvider>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/market" element={<MarketPage />} />

            {/* Private Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrderPage /></PrivateRoute>} />

            {/* ✅ ADDED THIS MISSING LINE */}
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            {/* ✅ ADD THIS ROUTE TO FIX THE ISSUE */}
            <Route path="/auction" element={<PrivateRoute><AuctionPage /></PrivateRoute>} />

            {/* ✅ ADMIN ROUTE - Admin only access */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;