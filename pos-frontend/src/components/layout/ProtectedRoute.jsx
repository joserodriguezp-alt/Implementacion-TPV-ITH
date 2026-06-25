import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';

// Guarda de ruta: redirige a /login si no hay sesión, a /sin-acceso si el rol no está permitido
export function ProtectedRoute({ children, roles }) {
  const { token, usuario } = useAuthStore();
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ desde: location }} replace />;
  if (roles && !roles.includes(usuario?.rol)) return <Navigate to="/sin-acceso" replace />;

  return children;
}
