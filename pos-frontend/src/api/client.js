import axios from 'axios';

// Cliente HTTP base — la URL se inyecta desde VITE_API_URL
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Adjunta el token JWT desde localStorage en cada request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normaliza errores del backend { success: false, error: "..." }
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Error de conexión con el servidor';

    // Token expirado → limpiar sesión y redirigir al login
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_usuario');
      window.location.href = '/login';
    }

    return Promise.reject(new Error(msg));
  }
);

export default client;
