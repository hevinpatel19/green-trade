import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#0a0f1a' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0a0f1a' },
        },
      }}
    />
  </StrictMode>,
)
