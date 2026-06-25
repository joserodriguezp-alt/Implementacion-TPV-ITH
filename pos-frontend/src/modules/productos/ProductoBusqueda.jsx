import { useRef } from 'react';
import { notifyError } from '../../utils/notify.js';
import { useProductos } from '../../hooks/useProductos.js';

// Campo de búsqueda por código de barras — Enter o scan dispara la búsqueda
export function ProductoBusqueda({ onProductoEncontrado }) {
  const inputRef = useRef(null);
  const { buscarBarcode, cargando } = useProductos();

  async function handleKeyDown(e) {
    if (e.key !== 'Enter') return;
    const codigo = e.target.value.trim();
    if (!codigo) return;

    const producto = await buscarBarcode(codigo);
    if (producto) {
      onProductoEncontrado(producto);
      e.target.value = '';
    } else {
      notifyError('Producto no encontrado');
      e.target.select();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder="Escanea o escribe el código de barras y presiona Enter…"
          onKeyDown={handleKeyDown}
          disabled={cargando}
          className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition
            disabled:opacity-60 disabled:cursor-not-allowed"
          autoFocus
        />
        {cargando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
