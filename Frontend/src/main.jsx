import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios' // 💡 Step 1: Import axios
import './index.css'
import App from './App.jsx'

// 💡 Step 2: Bind the central zero-code environment route key parameter 
// This reads from your frontend/.env file automatically or falls back to relative paths
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)