import { useState } from 'react';
import { useCarritoStore } from '../../store/carrito.store.js';
import { useAlertasStore } from '../../store/alertas.store.js';
import { crearVenta } from '../../api/ventas.api.js';
import { listarInventario } from '../../api/inventario.api.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { notifyError, notifyWarning } from '../../utils/notify.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal }  from '../../components/ui/Modal.jsx';
import { ModalConfirmacion } from './ModalConfirmacion.jsx';

const METODOS = ['efectivo', 'tarjeta', 'mixto'];

export function VentaCarrito() {
  const store      = useCarritoStore();
  const setAlertas = useAlertasStore((s) => s.setAlertas);

  const [cargando,        setCargando]        = useState(false);
  const [modalDescuento,  setModalDescuento]  = useState(false);
  const [pctDescuento,    setPctDescuento]    = useState('');
  const [idAutorizador,   setIdAutorizador]   = useState('');
  const [ventaCompletada, setVentaCompletada] = useState(null);

  const subtotal     = store.getSubtotal();
  const total        = store.getTotal();
  const cambio       = store.getCambio();
  const faltante     = store.getFaltante();
  const puedesCobrar = store.items.length > 0 && (store.metodoPago !== 'efectivo' || faltante === 0);

  function aplicarDescuento() {
    const pct = Number(pctDescuento);
    if (!pct || pct <= 0 || pct > 100) { notifyWarning('Ingresa un porcentaje válido (1-100)'); return; }
    if (pct > 20 && !idAutorizador.trim()) { notifyWarning('Se requiere ID del administrador para descuentos mayores al 20%'); return; }
    store.aplicarDescuento((subtotal * pct) / 100);
    setModalDescuento(false);
    setPctDescuento('');
    setIdAutorizador('');
  }

  async function cobrar() {
    if (!puedesCobrar) return;
    setCargando(true);
    try {
      const payload = {
        items:          store.items.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        metodo_pago:    store.metodoPago,
        monto_recibido: store.montoRecibido || total,
        descuento:      store.descuento,
      };
      const venta = await crearVenta(payload);
      try {
        const inv = await listarInventario();
        const ids = store.items.map((i) => i.id_producto);
        const enAlerta = inv.filter((p) => ids.includes(p.id_producto) && p.stock_actual <= p.stock_minimo);
        if (enAlerta.length > 0) setAlertas(enAlerta);
      } catch { /* alertas no bloquean */ }
      setVentaCompletada({ ...venta, cambio: store.getCambio() });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function nuevaVenta() {
    store.limpiar();
    setVentaCompletada(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Lista de ítems ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {store.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-2 text-sm">
            <span className="text-3xl">🛒</span>
            <span>Carrito vacío</span>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {store.items.map((item) => (
              <div key={item.id_producto} className="group flex items-center gap-2 py-2.5">
                {/* Info producto */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{item.nombre}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{formatCurrency(item.precio_unitario)} c/u</p>
                </div>

                {/* Controles cantidad */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => store.cambiarCantidad(item.id_producto, item.cantidad - 1)}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 font-bold text-sm transition-colors flex items-center justify-center"
                  >−</button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800">{item.cantidad}</span>
                  <button
                    onClick={() => store.cambiarCantidad(item.id_producto, item.cantidad + 1)}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-brand-50 hover:text-brand-600 text-gray-500 font-bold text-sm transition-colors flex items-center justify-center"
                  >+</button>
                </div>

                {/* Subtotal + eliminar */}
                <div className="text-right shrink-0 w-16">
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(item.subtotal_linea)}</p>
                  <button
                    onClick={() => store.eliminarItem(item.id_producto)}
                    className="text-[10px] text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Panel de cobro ── */}
      {store.items.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mx-3 pb-3 flex flex-col gap-3 mt-1">
          {/* Totales */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {store.descuento > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs font-medium">
                <span>Descuento</span><span>−{formatCurrency(store.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200 mt-0.5">
              <span>Total</span><span className="text-brand-700">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex gap-1">
            {METODOS.map((m) => (
              <button
                key={m}
                onClick={() => store.setMetodoPago(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                  ${store.metodoPago === m
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Monto recibido (solo efectivo) */}
          {store.metodoPago === 'efectivo' && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Monto recibido</label>
              <input
                type="number" step="0.01" min={0}
                value={store.montoRecibido || ''}
                onChange={(e) => store.setMontoRecibido(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition bg-white"
              />
              {cambio > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                  <span className="text-emerald-500 text-base">✓</span>
                  <span className="text-sm font-semibold text-emerald-700">Cambio: {formatCurrency(cambio)}</span>
                </div>
              )}
              {faltante > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                  <span className="text-red-500 text-base">⚠</span>
                  <span className="text-sm font-semibold text-red-600">Faltante: {formatCurrency(faltante)}</span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button variante="ghost" size="sm" onClick={() => setModalDescuento(true)} className="flex-1 text-gray-600">
              % Desc.
            </Button>
            <Button size="sm" onClick={cobrar} cargando={cargando} disabled={!puedesCobrar} className="flex-1">
              Cobrar
            </Button>
          </div>
          <button
            onClick={store.limpiar}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center w-full py-1"
          >
            Vaciar carrito
          </button>
        </div>
      )}

      {/* Modal descuento */}
      <Modal abierto={modalDescuento} titulo="Aplicar descuento" onClose={() => setModalDescuento(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Porcentaje de descuento</label>
            <input
              type="number" min="1" max="100" step="1"
              value={pctDescuento}
              onChange={(e) => setPctDescuento(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
          {Number(pctDescuento) > 20 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800 mb-3 font-semibold">
                ⚠ Se requiere ID del administrador para descuentos mayores al 20%
              </p>
              <input
                type="text"
                value={idAutorizador}
                onChange={(e) => setIdAutorizador(e.target.value)}
                placeholder="ID del administrador"
                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg outline-none focus:border-amber-500 transition bg-white"
              />
            </div>
          )}
          <Button onClick={aplicarDescuento} disabled={Number(pctDescuento) > 20 && !idAutorizador.trim()}>
            Aplicar descuento
          </Button>
        </div>
      </Modal>

      {/* Modal confirmación de venta */}
      {ventaCompletada && (
        <ModalConfirmacion venta={ventaCompletada} cambio={ventaCompletada.cambio} onNuevaVenta={nuevaVenta} />
      )}
    </div>
  );
}
