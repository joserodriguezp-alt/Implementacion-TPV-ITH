import { useEffect, useRef, useState } from 'react';
import { useProductos } from '../../hooks/useProductos.js';
import { useAuthStore } from '../../store/auth.store.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { Badge }   from '../../components/ui/Badge.jsx';
import { Button }  from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { ProductoForm } from './ProductoForm.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

function badgeStock(stock, minimo) {
  if (stock <= 0)      return <Badge variante="danger">Agotado</Badge>;
  if (stock <= minimo) return <Badge variante="warning">Bajo</Badge>;
  return <Badge variante="success">Normal</Badge>;
}

export function ProductosList() {
  const { productos, cargando, buscar } = useProductos();
  const usuario   = useAuthStore((s) => s.usuario);
  const esAdmin   = usuario?.rol === 'administrador';
  const [q,        setQ]        = useState('');
  const [modal,    setModal]    = useState(false);
  const [editando, setEditando] = useState(null);
  const debounce  = useRef(null);

  // Carga inicial
  useEffect(() => { buscar(''); }, []);

  // Búsqueda con debounce de 300 ms (TASK-F010)
  function handleBusqueda(e) {
    const val = e.target.value;
    setQ(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => buscar(val), 300);
  }

  function abrirNuevo()  { setEditando(null); setModal(true); }
  function abrirEditar(p){ setEditando(p);    setModal(true); }
  function cerrarModal() { setModal(false); setEditando(null); buscar(q); }

  return (
    <div>
      {/* Encabezado de página */}
      <div className="flex items-center justify-between mb-7 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de artículos disponibles para venta</p>
        </div>
        {esAdmin && (
          <Button onClick={abrirNuevo}>+ Nuevo producto</Button>
        )}
      </div>

      {/* Buscador (TASK-F010) */}
      <div className="mb-5">
        <input
          type="text"
          value={q}
          onChange={handleBusqueda}
          placeholder="Buscar por nombre o código de barras…"
          className="w-full max-w-sm px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {/* Estado de carga (TASK-F029) */}
      {cargando && <Spinner />}

      {/* Tabla de productos */}
      {!cargando && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-card bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Código</th>
                <th className="px-4 py-3 text-left font-semibold">Precio venta</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                {esAdmin && <th className="px-4 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5} className="px-4 py-10 text-center text-gray-400">
                    {q ? `Sin resultados para "${q}"` : 'No hay productos registrados'}
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id_producto} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.codigo_barras}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.precio_venta)}</td>
                    <td className="px-4 py-3">{p.stock_actual}</td>
                    <td className="px-4 py-3">{badgeStock(p.stock_actual, p.stock_minimo)}</td>
                    {esAdmin && (
                      <td className="px-4 py-3">
                        <Button variante="ghost" size="sm" onClick={() => abrirEditar(p)}>Editar</Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal alta/edición de producto */}
      <Modal
        abierto={modal}
        titulo={editando ? 'Editar producto' : 'Nuevo producto'}
        onClose={cerrarModal}
        ancho="max-w-lg"
      >
        <ProductoForm producto={editando} onGuardado={cerrarModal} />
      </Modal>
    </div>
  );
}
