import { useEffect, useState } from 'react';
import { listarInventario, registrarEntrada } from '../../api/inventario.api.js';
import { listarProductos } from '../../api/productos.api.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { notifySuccess, notifyError } from '../../utils/notify.js';
import { Badge }   from '../../components/ui/Badge.jsx';
import { Button }  from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Modal }   from '../../components/ui/Modal.jsx';
import { Input }   from '../../components/ui/Input.jsx';

function badgeEstado(estado) {
  const m = { normal: 'success', bajo: 'warning', agotado: 'danger' };
  return <Badge variante={m[estado] ?? 'default'}>{estado}</Badge>;
}

export function InventarioPanel() {
  const [inventario, setInventario] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando]   = useState(false);
  const [modalEntrada, setModalEntrada] = useState(false);

  // Estado del formulario de entrada
  const [busqProd, setBusqProd] = useState('');
  const [prodSuger, setProdSuger] = useState([]);
  const [prodSel,   setProdSel]   = useState(null);
  const [cantidad,  setCantidad]  = useState('');
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar(estado = '') {
    setCargando(true);
    try {
      const data = await listarInventario(estado ? { estado } : {});
      setInventario(data);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  // Búsqueda de producto para el formulario de entrada
  async function buscarProducto(texto) {
    setBusqProd(texto);
    if (texto.length < 2) { setProdSuger([]); return; }
    try {
      const data = await listarProductos(texto);
      setProdSuger(data.slice(0, 6));
    } catch { setProdSuger([]); }
  }

  async function guardarEntrada() {
    if (!prodSel)             { notifyError('Selecciona un producto'); return; }
    if (!cantidad || Number(cantidad) <= 0) { notifyError('La cantidad debe ser mayor a 0'); return; }
    setGuardando(true);
    try {
      await registrarEntrada({ id_producto: prodSel.id_producto, cantidad: Number(cantidad), observacion });
      notifySuccess(`+${cantidad} unidades registradas para "${prodSel.nombre}"`);
      setModalEntrada(false);
      setProdSel(null); setBusqProd(''); setCantidad(''); setObservacion('');
      cargar(filtroEstado);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stock actual y movimientos de mercancía</p>
        </div>
        <Button onClick={() => setModalEntrada(true)}>+ Entrada de mercancía</Button>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 mb-5">
        {['', 'normal', 'bajo', 'agotado'].map((e) => (
          <button key={e} onClick={() => { setFiltroEstado(e); cargar(e); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize
              ${filtroEstado === e ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {e || 'Todos'}
          </button>
        ))}
      </div>

      {cargando && <Spinner />}

      {!cargando && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-card bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Producto</th>
                <th className="px-4 py-3 text-left font-semibold">Código</th>
                <th className="px-4 py-3 text-right font-semibold">Precio venta</th>
                <th className="px-4 py-3 text-center font-semibold">Stock actual</th>
                <th className="px-4 py-3 text-center font-semibold">Stock mínimo</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {inventario.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Sin productos para el filtro seleccionado
                  </td>
                </tr>
              ) : (
                inventario.map((p) => (
                  <tr key={p.id_producto} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo_barras}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.precio_venta)}</td>
                    <td className={`px-4 py-3 text-center font-bold ${p.stock_actual === 0 ? 'text-red-600' : p.stock_actual <= p.stock_minimo ? 'text-amber-600' : 'text-gray-900'}`}>
                      {p.stock_actual}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.stock_minimo}</td>
                    <td className="px-4 py-3">{badgeEstado(p.estado)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de entrada de mercancía (TASK-F023) */}
      <Modal abierto={modalEntrada} titulo="Registrar entrada de mercancía" onClose={() => setModalEntrada(false)}>
        <div className="flex flex-col gap-4">
          {/* Búsqueda de producto */}
          <div className="relative">
            <Input
              label="Producto"
              value={busqProd}
              onChange={(e) => buscarProducto(e.target.value)}
              placeholder="Escribe el nombre del producto…"
            />
            {prodSuger.length > 0 && !prodSel && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {prodSuger.map((p) => (
                  <button key={p.id_producto} onClick={() => { setProdSel(p); setBusqProd(p.nombre); setProdSuger([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-gray-400 ml-2 text-xs">Stock: {p.stock_actual}</span>
                  </button>
                ))}
              </div>
            )}
            {prodSel && (
              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded">
                ✓ {prodSel.nombre} — Stock actual: {prodSel.stock_actual}
                <button onClick={() => { setProdSel(null); setBusqProd(''); }} className="ml-auto text-gray-400 hover:text-red-500">✕</button>
              </div>
            )}
          </div>

          <Input label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" />
          <Input label="Observación (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Ej: Compra a proveedor ABC" />

          <div className="flex gap-2 justify-end">
            <Button variante="ghost" onClick={() => setModalEntrada(false)}>Cancelar</Button>
            <Button cargando={guardando} onClick={guardarEntrada}>Registrar entrada</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
