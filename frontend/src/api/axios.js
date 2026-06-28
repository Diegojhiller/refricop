import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `http://${window.location.hostname}:5000/api`, // Ajustado al puerto de nuestro backend Backend
});

// Interceptor para inyectar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ref_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
