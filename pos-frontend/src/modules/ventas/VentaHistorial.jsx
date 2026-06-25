import { useEffect, useState } from 'react';
import { listarVentas, cancelarVenta } from '../../api/ventas.api.js';
import { useAuthStore } from '../../store/auth.store.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate }     from '../../utils/formatDate.js';
import { notifySuccess, notifyError } from '../../utils/notify.js';
import { Badge }   from '../../components/ui/Badge.jsx';
import { Button }  from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Modal }   from '../../components/ui/Modal.jsx';
import { Input }   from '../../components/ui/Input.jsx';

function badgeEstado(estado) {
  const mapa = { completada: 'success', cancelada: 'danger', devolucion: 'warning' };
  return <Badge variante={mapa[estado] ?? 'default'}>{estado}</Badge>;
}

export function VentaHistorial() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'administrador';

  const [ventas,    setVentas]    = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [filtroFecha,   setFiltroFecha]   = useState('');
  const [filtroEstado,  setFiltroEstado]  = useState('');
  const [modalCancelar, setModalCancelar] = useState(null);  // venta a cancelar
  const [motivo,         setMotivo]        = useState('');
  const [cancelando,     setCancelando]    = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const params = {};
      if (filtroFecha)  params.fecha  = filtroFecha;
      if (filtroEstado) params.estado = filtroEstado;
      const data = await listarVentas(params);
      setVentas(data);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function confirmarCancelacion() {
    if (!motivo.trim()) { notifyError('Ingresa el motivo de cancelación'); return; }
    setCancelando(true);
    try {
      await cancelarVenta(modalCancelar.id_venta, motivo);
      setVentas((prev) =>
        prev.map((v) => v.id_venta === modalCancelar.id_venta ? { ...v, estado: 'cancelada' } : v)
      );
      notifySuccess('Venta cancelada');
      setModalCancelar(null);
      setMotivo('');
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de ventas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Consulta y gestiona las ventas registradas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition">
          <option value="">Todos los estados</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
          <option value="devolucion">Devolución</option>
        </select>
        <Button onClick={cargar} variante="outline" size="sm">Buscar</Button>
      </div>

      {cargando && <Spinner />}

      {!cargando && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Folio</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha/Hora</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Método</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                {esAdmin && <th className="px-4 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5} className="px-4 py-10 text-center text-gray-400">
                    Sin ventas para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id_venta} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{v.folio}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha_hora)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(v.total)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{v.metodo_pago}</td>
                    <td className="px-4 py-3">{badgeEstado(v.estado)}</td>
                    {esAdmin && (
                      <td className="px-4 py-3">
                        {v.estado === 'completada' && (
                          <Button variante="danger" size="sm" onClick={() => { setModalCancelar(v); setMotivo(''); }}>
                            Cancelar
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de cancelación (TASK-F021) */}
      <Modal abierto={!!modalCancelar} titulo="Cancelar venta" onClose={() => setModalCancelar(null)}>
        {modalCancelar && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Folio: <span className="font-mono font-semibold">{modalCancelar.folio}</span><br />
              Total: <span className="font-semibold">{formatCurrency(modalCancelar.total)}</span>
            </p>
            <Input
              label="Motivo de cancelación"
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo…"
            />
            <div className="flex gap-2 justify-end">
              <Button variante="ghost" onClick={() => setModalCancelar(null)}>Cancelar</Button>
              <Button variante="danger" cargando={cancelando} onClick={confirmarCancelacion}>
                Confirmar cancelación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
