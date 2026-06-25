import { create } from 'zustand';

// Almacena productos con stock bajo o agotado detectados tras ventas
export const useAlertasStore = create((set, get) => ({
  alertas: [],

  setAlertas:       (lista) => set({ alertas: lista }),
  descartarAlerta:  (idProducto) =>
    set({ alertas: get().alertas.filter((a) => a.id_producto !== idProducto) }),
  limpiarAlertas:   () => set({ alertas: [] }),
}));
