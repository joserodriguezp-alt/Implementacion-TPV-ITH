import { create } from 'zustand';

export const useCarritoStore = create((set, get) => ({
  items:          [],
  descuento:      0,
  metodoPago:     'efectivo',
  montoRecibido:  0,

  // Agrega producto o incrementa cantidad si ya existe en el carrito
  agregarItem: (producto, cantidad = 1) => {
    const { items } = get();
    const existe = items.find((i) => i.id_producto === producto.id_producto);
    if (existe) {
      set({
        items: items.map((i) =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + cantidad, subtotal_linea: (i.cantidad + cantidad) * i.precio_unitario }
            : i
        ),
      });
    } else {
      set({
        items: [...items, {
          id_producto:     producto.id_producto,
          nombre:          producto.nombre,
          codigo_barras:   producto.codigo_barras,
          precio_unitario: Number(producto.precio_venta),
          cantidad,
          subtotal_linea:  Number(producto.precio_venta) * cantidad,
        }],
      });
    }
  },

  // Cambia cantidad de una línea; elimina la línea si llega a 0
  cambiarCantidad: (idProducto, cantidad) => {
    if (cantidad <= 0) { get().eliminarItem(idProducto); return; }
    set({
      items: get().items.map((i) =>
        i.id_producto === idProducto
          ? { ...i, cantidad, subtotal_linea: cantidad * i.precio_unitario }
          : i
      ),
    });
  },

  eliminarItem: (idProducto) =>
    set({ items: get().items.filter((i) => i.id_producto !== idProducto) }),

  aplicarDescuento: (monto) => set({ descuento: Number(monto) || 0 }),
  setMetodoPago:    (v)     => set({ metodoPago: v }),
  setMontoRecibido: (v)     => set({ montoRecibido: Number(v) || 0 }),
  limpiar: ()               => set({ items: [], descuento: 0, metodoPago: 'efectivo', montoRecibido: 0 }),

  // Valores calculados — accesibles como funciones para reactividad correcta con Zustand
  getSubtotal:      () => get().items.reduce((acc, i) => acc + i.subtotal_linea, 0),
  getTotal:         () => Math.max(0, get().getSubtotal() - get().descuento),
  getCambio:        () => {
    const total = get().getTotal();
    const monto = get().montoRecibido;
    return monto >= total ? monto - total : 0;
  },
  getFaltante:      () => {
    if (get().metodoPago !== 'efectivo') return 0;
    const total = get().getTotal();
    const monto = get().montoRecibido;
    return monto < total ? total - monto : 0;
  },
  getTotalItems:    () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
}));
