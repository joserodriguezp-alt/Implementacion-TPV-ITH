import { formatCurrency } from '../../utils/formatCurrency.js';
import { urlTicketPDF } from '../../api/ventas.api.js';
import { Button } from '../../components/ui/Button.jsx';

// Modal que aparece tras una venta exitosa con folio, total, cambio y descarga de ticket
export function ModalConfirmacion({ venta, cambio, onNuevaVenta }) {
  function descargarTicket() {
    window.open(urlTicketPDF(venta.id_venta), '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">¡Venta completada!</h2>
        <p className="text-xs font-mono text-gray-400 mb-5">{venta.folio}</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total cobrado</span>
            <span className="font-bold text-gray-900">{formatCurrency(venta.total)}</span>
          </div>
          {cambio > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cambio</span>
              <span className="font-bold text-emerald-600">{formatCurrency(cambio)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Método de pago</span>
            <span className="font-medium capitalize">{venta.metodo_pago}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variante="outline" onClick={descargarTicket} className="w-full">
            🖨️ Descargar ticket
          </Button>
          <Button onClick={onNuevaVenta} className="w-full">
            Nueva venta
          </Button>
        </div>
      </div>
    </div>
  );
}
