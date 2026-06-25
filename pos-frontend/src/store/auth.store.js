import { create } from 'zustand';

// Recupera sesión persisitida del localStorage al arrancar
function cargarSesion() {
  try {
    const token   = localStorage.getItem('pos_token');
    const usuario = JSON.parse(localStorage.getItem('pos_usuario') || 'null');
    return { token, usuario };
  } catch {
    return { token: null, usuario: null };
  }
}

const inicial = cargarSesion();

export const useAuthStore = create((set) => ({
  token:   inicial.token,
  usuario: inicial.usuario,

  iniciarSesion: (token, usuario) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_usuario', JSON.stringify(usuario));
    set({ token, usuario });
  },

  cerrarSesion: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_usuario');
    set({ token: null, usuario: null });
  },
}));
