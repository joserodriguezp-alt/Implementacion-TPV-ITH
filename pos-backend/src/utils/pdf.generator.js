import PDFDocument from 'pdfkit';

// Genera el buffer del PDF de un ticket de venta
export function generarTicket(venta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: [226, 800] }); // 80mm ~226pt
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.fontSize(12).font('Helvetica-Bold').text('PAPELERÍA', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text('RFC: XXXX000000XXX', { align: 'center' });
    doc.text('Dirección de la papelería', { align: 'center' });
    doc.moveDown(0.5);
    doc.text('─'.repeat(32), { align: 'center' });

    // Datos del ticket
    doc.text(`Folio: ${venta.folio}`);
    doc.text(`Fecha: ${new Date(venta.created_at).toLocaleString('es-MX')}`);
    doc.text(`Cajero: ${venta.usuario?.nombre || 'N/A'}`);
    doc.text('─'.repeat(32));

    // Detalle de productos
    doc.font('Helvetica-Bold').text('CANT  DESCRIPCIÓN         IMPORTE');
    doc.font('Helvetica');
    (venta.detalle || []).forEach((item) => {
      const cant = String(item.cantidad).padEnd(6);
      const desc = (item.producto?.nombre || 'Producto').substring(0, 18).padEnd(20);
      const imp = `$${(item.precio_unitario * item.cantidad).toFixed(2)}`;
      doc.text(`${cant}${desc}${imp}`);
    });

    doc.text('─'.repeat(32));

    // Totales
    if (venta.descuento > 0) {
      doc.text(`Descuento:        $${Number(venta.descuento).toFixed(2)}`);
    }
    doc.font('Helvetica-Bold').text(`TOTAL:            $${Number(venta.total).toFixed(2)}`);
    doc.font('Helvetica');
    doc.text(`Método de pago: ${venta.metodo_pago || 'efectivo'}`);
    if (venta.monto_pagado) {
      doc.text(`Pagado:           $${Number(venta.monto_pagado).toFixed(2)}`);
      doc.text(`Cambio:           $${(venta.monto_pagado - venta.total).toFixed(2)}`);
    }

    doc.moveDown(0.5);
    doc.text('─'.repeat(32));
    doc.text('¡Gracias por su compra!', { align: 'center' });
    doc.text('Conserve su ticket', { align: 'center' });

    doc.end();
  });
}

// Genera el buffer del PDF del corte de caja
export function generarReporteCorte(corte) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.fontSize(16).font('Helvetica-Bold').text('CORTE DE CAJA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('PAPELERÍA', { align: 'center' });
    doc.moveDown();

    // Datos del corte
    doc.fontSize(11).font('Helvetica-Bold').text('Información del Corte');
    doc.font('Helvetica').fontSize(10);
    doc.text(`ID: ${corte.id}`);
    doc.text(`Apertura: ${new Date(corte.fecha_apertura).toLocaleString('es-MX')}`);
    doc.text(`Cierre: ${corte.fecha_cierre ? new Date(corte.fecha_cierre).toLocaleString('es-MX') : '—'}`);
    doc.text(`Responsable: ${corte.usuario?.nombre || 'N/A'}`);
    doc.moveDown();

    // Resumen financiero
    doc.font('Helvetica-Bold').text('Resumen Financiero');
    doc.font('Helvetica');
    doc.text(`Monto inicial:          $${Number(corte.monto_inicial || 0).toFixed(2)}`);
    doc.text(`Total ventas:           $${Number(corte.total_ventas || 0).toFixed(2)}`);
    doc.text(`Total devoluciones:     $${Number(corte.total_devoluciones || 0).toFixed(2)}`);
    doc.text(`Monto esperado en caja: $${Number(corte.monto_esperado || 0).toFixed(2)}`);
    doc.text(`Monto contado físico:   $${Number(corte.monto_contado_fisico || 0).toFixed(2)}`);

    const diferencia = (corte.monto_contado_fisico || 0) - (corte.monto_esperado || 0);
    doc.font('Helvetica-Bold').text(`Diferencia:             $${diferencia.toFixed(2)}`);
    doc.font('Helvetica');
    doc.moveDown();

    // Estadísticas de ventas
    doc.font('Helvetica-Bold').text('Estadísticas');
    doc.font('Helvetica');
    doc.text(`Número de ventas:       ${corte.num_ventas || 0}`);
    doc.text(`Ventas canceladas:      ${corte.num_canceladas || 0}`);
    doc.moveDown();

    // Observaciones
    if (corte.observaciones) {
      doc.font('Helvetica-Bold').text('Observaciones:');
      doc.font('Helvetica').text(corte.observaciones);
    }

    doc.moveDown(2);
    doc.text('_________________________     _________________________', { align: 'center' });
    doc.text('    Responsable de caja              Administrador     ', { align: 'center' });

    doc.end();
  });
}
