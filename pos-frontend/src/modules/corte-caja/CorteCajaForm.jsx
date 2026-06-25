import { useEffect, useState } from 'react';
import { abrirCorte, cerrarCorte, listarCortes } from '../../api/corte-caja.api.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, formatDateOnly } from '../../utils/formatDate.js';
import { notifySuccess, notifyError } from '../../utils/notify.js';
import { Button }  from '../../components/ui/Button.jsx';
import { Input }   from '../../components/ui/Input.jsx';
import { Badge }   from '../../components/ui/Badge.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export function CorteCajaForm() {
  const [cargando,     setCargando]     = useState(false);
  const [corteActivo,  setCorteActivo]  = useState(null);   // corte abierto del día
  const [historial,    setHistorial]    = useState([]);
  const [filtroDesde,  setFiltroDesde]  = useState('');
  const [filtroHasta,  setFiltroHasta]  = useState('');

  // Estado del formulario de cierre
  const [montoContado,  setMontoContado]  = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cerrando,      setCerrando]      = useState(false);
  const [diferencia,    setDiferencia]    = useState(null);
  const [confirmando,   setConfirmando]   = useState(false);

  async function cargarCortes(params = {}) {
    setCargando(true);
    try {
      const data = await listarCortes(params);
      setHistorial(data);
      // Detectar si hay un corte abierto
      const abierto = data.find((c) => c.estado === 'abierto');
      setCorteActivo(abierto ?? null);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarCortes(); }, []);

  async function iniciarCorte() {
    setCargando(true);
    try {
      await abrirCorte({ monto_inicial: 0 });
      notifySuccess('Corte iniciado');
      cargarCortes();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Previsualiza la diferencia antes de confirmar (TASK-F027)
  function previsualizarDiferencia() {
    if (!montoContado) { notifyError('Ingresa el monto contado físico'); return; }
    const esperado = Number(corteActivo?.total_efectivo_sistema ?? 0);
    const contado  = Number(montoContado);
    setDiferencia(contado - esperado);
    setConfirmando(true);
  }

  async function confirmarCierre() {
    setCerrando(true);
    try {
      const response = await cerrarCorte(corteActivo.id_corte, {
        monto_contado_fisico: Number(montoContado),
        observaciones,
      });
      // El backend devuelve un blob PDF — descargarlo automáticamente
      const hoy  = new Date().toISOString().slice(0, 10);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `corte-${hoy}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      notifySuccess('Corte cerrado y PDF descargado');
      setConfirmando(false);
      setMontoContado('');
      setObservaciones('');
      setDiferencia(null);
      cargarCortes();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div>
      <div className="mb-7 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Corte de caja</h1>
        <p className="text-sm text-gray-500 mt-0.5">Apertura, cierre e historial de cortes</p>
      </div>

      {cargando && <Spinner />}

      {!cargando && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Panel de corte actual */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Corte del día</h2>

            {!corteActivo ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm text-gray-500 text-center">No hay ningún corte abierto para hoy</p>
                <Button onClick={iniciarCorte}>Iniciar corte del día</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-xs text-gray-500">
                  Apertura: <span className="font-medium text-gray-700">{formatDate(corteActivo.fecha_apertura)}</span>
                </div>

                {/* Resumen de totales (TASK-F026) */}
                <div className="bg-gray-50/70 rounded-xl p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Efectivo</span>
                    <span className="font-semibold">{formatCurrency(corteActivo.total_efectivo_sistema ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tarjeta</span>
                    <span className="font-semibold">{formatCurrency(corteActivo.total_tarjeta_sistema ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Devoluciones</span>
                    <span className="font-semibold text-red-600">{formatCurrency(corteActivo.total_devoluciones ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-1">
                    <span className="font-bold text-gray-900">Total sistema</span>
                    <span className="font-bold text-gray-900">{formatCurrency(corteActivo.total_ventas_sistema ?? 0)}</span>
                  </div>
                </div>

                {/* Formulario de cierre */}
                {!confirmando ? (
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Monto contado físico ($)"
                      type="number" step="0.01" min="0"
                      value={montoContado}
                      onChange={(e) => setMontoContado(e.target.value)}
                      placeholder="0.00"
                    />
                    <Input
                      label="Observaciones (opcional)"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas del cierre…"
                    />
                    <Button onClick={previsualizarDiferencia}>Ver diferencia y cerrar</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Diferencia (TASK-F027) */}
                    <div className={`rounded-lg p-4 text-sm font-semibold text-center border
                      ${diferencia < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      {diferencia < 0
                        ? `Diferencia: −${formatCurrency(Math.abs(diferencia))} (faltante)`
                        : diferencia === 0
                        ? 'Sin diferencia ✓'
                        : `Diferencia: +${formatCurrency(diferencia)} (sobrante)`}
                    </div>
                    <div className="flex gap-2">
                      <Button variante="ghost" onClick={() => setConfirmando(false)} className="flex-1">Revisar</Button>
                      <Button cargando={cerrando} onClick={confirmarCierre} className="flex-1">
                        Confirmar y cerrar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel de filtros de historial */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Buscar historial</h2>
            <div className="flex flex-col gap-3">
              <Input label="Desde" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
              <Input label="Hasta" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
              <Button
                variante="outline"
                onClick={() => cargarCortes({ desde: filtroDesde || undefined, hasta: filtroHasta || undefined })}
              >
                Buscar cortes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de cortes (TASK-F028) */}
      {!cargando && historial.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Historial de cortes</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-card bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Responsable</th>
                  <th className="px-4 py-3 text-right font-semibold">Total sistema</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto contado</th>
                  <th className="px-4 py-3 text-right font-semibold">Diferencia</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {historial.map((c) => {
                  const dif = c.diferencia ?? 0;
                  return (
                    <tr key={c.id_corte} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">{formatDateOnly(c.fecha_apertura)}</td>
                      <td className="px-4 py-3 text-gray-600">{c.usuarios?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(c.total_ventas_sistema)}</td>
                      <td className="px-4 py-3 text-right">{c.monto_contado_fisico != null ? formatCurrency(c.monto_contado_fisico) : '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${dif < 0 ? 'text-red-600' : dif > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {c.diferencia != null ? (dif >= 0 ? '+' : '') + formatCurrency(dif) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variante={c.estado === 'cerrado' ? 'success' : 'warning'}>{c.estado}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
