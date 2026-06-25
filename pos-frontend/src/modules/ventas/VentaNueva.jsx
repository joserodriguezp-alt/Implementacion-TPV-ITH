import { useCarritoStore } from '../../store/carrito.store.js';
import { ProductoBusqueda } from '../productos/ProductoBusqueda.jsx';
import { VentaCarrito }     from './VentaCarrito.jsx';
import { formatCurrency }   from '../../utils/formatCurrency.js';

// Tarjeta de estadística para el dashboard de ventas
function StatCard({ icono, label, valor, color = 'blue' }) {
  const colores = {
    blue:  'bg-blue-50  text-blue-600  border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-500  border-slate-100',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base shrink-0 ${colores[color]}`}>
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900 leading-tight truncate">{valor}</p>
      </div>
    </div>
  );
}

export function VentaNueva() {
  const agregarItem = useCarritoStore((s) => s.agregarItem);
  const store       = useCarritoStore();
  const totalItems  = store.getTotalItems();
  const subtotal    = store.getSubtotal();
  const numLineas   = store.items.length;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* ── Cabecera con stats ── */}
      <div>
        <div className="mb-4">
          <h1 className="page-title">Nueva venta</h1>
          <p className="page-subtitle">Escanea el código de barras o busca por nombre del producto</p>
        </div>

        {/* Tarjetas de estadísticas de la venta en curso */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icono="🛒" label="Productos" valor={`${numLineas} línea${numLineas !== 1 ? 's' : ''}`} color="blue" />
          <StatCard icono="📦" label="Unidades"  valor={`${totalItems} ítem${totalItems !== 1 ? 's' : ''}`} color="slate" />
          <StatCard icono="💰" label="Subtotal"  valor={formatCurrency(subtotal)} color="green" />
        </div>
      </div>

      {/* ── Área principal: buscador + carrito ── */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Panel izquierdo */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Campo de búsqueda */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Buscar producto
            </p>
            <ProductoBusqueda onProductoEncontrado={(p) => agregarItem(p)} />
          </div>

          {/* Zona de instrucción */}
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-white/50">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-400">Escanea un código de barras</p>
              <p className="text-xs text-gray-300 mt-1">o escribe el nombre del producto en el buscador</p>
            </div>
          </div>
        </div>

        {/* ── Carrito fijo derecha ── */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-100 shadow-card flex flex-col overflow-hidden">
          {/* Header del carrito */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <h2 className="text-sm font-semibold text-gray-800">Carrito de venta</h2>
            {totalItems > 0 && (
              <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                {totalItems} ítem{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            <VentaCarrito />
          </div>
        </div>
      </div>
    </div>
  );
}
