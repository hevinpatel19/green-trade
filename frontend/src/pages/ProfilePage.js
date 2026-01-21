import React, { useState, useContext } from "react";
import UserContext from "../context/UserContext";
import axios from "axios";

const ProfilePage = () => {
  const { user, login } = useContext(UserContext); 
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await axios.put("http://localhost:5000/api/auth/profile", {
            id: user._id,
            name: formData.name,
            email: formData.email,
            token: user.token
        });
        login(res.data);
        setIsEditing(false);
        alert("✅ Identity Updated");
    } catch (error) {
        alert("❌ Update Failed");
    }
    setLoading(false);
  };

  if (!user) return <div className="p-20 text-center text-gray-500">Please Login</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] relative overflow-hidden">
      
      {/* 1. Abstract Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-400/30 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[100px] animate-pulse delay-700"></div>

      {/* 2. The Glass Card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-green-200/50">
            
            {/* Header / Avatar Section */}
            <div className="pt-12 pb-6 flex flex-col items-center justify-center relative">
                {/* Decorative Pattern */}
                <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-white/50 to-transparent"></div>

                <div className="relative group cursor-pointer">
                    {/* Glowing Ring */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                    
                    {/* Avatar Circle */}
                    <div className="relative w-28 h-28 bg-gray-900 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl ring-4 ring-white">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Role Badge */}
                    <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full border-4 border-white shadow-sm uppercase tracking-wide">
                        {user.role}
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="px-10 pb-10">
                <div className="flex justify-center mb-8">
                   <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Digital Identity</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    
                    {/* Name Input */}
                    <div className="relative group">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Full Name</label>
                        <input 
                            type="text" 
                            disabled={!isEditing}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className={`w-full bg-transparent border-b-2 py-2 px-1 text-lg font-bold text-gray-800 focus:outline-none transition-colors ${
                                isEditing 
                                ? 'border-green-500 placeholder-gray-300' 
                                : 'border-gray-200 text-center'
                            }`}
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative group">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Email Address</label>
                        <input 
                            type="email" 
                            disabled={!isEditing}
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className={`w-full bg-transparent border-b-2 py-2 px-1 text-lg font-bold text-gray-800 focus:outline-none transition-colors ${
                                isEditing 
                                ? 'border-green-500 placeholder-gray-300' 
                                : 'border-gray-200 text-center'
                            }`}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="pt-6">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => { setIsEditing(false); setFormData({name: user.name, email: user.email}); }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="w-full bg-white border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-500 font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </form>

                {/* Footer Decor */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">GreenTrade Verified ID</p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;