import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store.js';

export function useAuth() {
  const navigate = useNavigate();
  const store    = useAuthStore();

  function cerrarSesion() {
    store.cerrarSesion();
    navigate('/login', { replace: true });
  }

  return {
    token:        store.token,
    usuario:      store.usuario,
    autenticado:  !!store.token,
    esAdmin:      store.usuario?.rol === 'administrador',
    iniciarSesion: store.iniciarSesion,
    cerrarSesion,
  };
}
