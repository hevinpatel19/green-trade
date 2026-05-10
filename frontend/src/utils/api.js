// Central API URL configuration for deployment
// In development: reads from .env.development (localhost)
// In production: reads from .env.production (deployed URLs)

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const ML_URL = import.meta.env.VITE_ML_URL || "http://localhost:5001";
