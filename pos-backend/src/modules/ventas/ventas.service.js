import { supabase } from '../../config/supabase.js';
import { generarFolio } from '../../utils/folio.generator.js';

// Helper: obtiene stock actual de un producto antes de modificarlo (requerido por movimientos_inventario)
async function obtenerStockActual(idProducto) {
  const { data } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id_producto', idProducto)
    .single();
  return data?.stock_actual ?? 0;
}

// Crea una venta completa: cabecera + detalle + descuento de stock
export async function crearVenta(datos, idUsuario) {
  const { items, metodo_pago, monto_recibido, descuento = 0, id_autorizador } = datos;

  // Verificar productos — PK: id_producto (SERIAL INT)
  const ids = items.map((i) => i.id_producto);
  const { data: productos, error: errProd } = await supabase
    .from('productos')
    .select('id_producto, nombre, precio_venta, stock_actual')
    .in('id_producto', ids)
    .eq('activo', true);

  if (errProd) throw new Error(errProd.message);

  // Mapa keyed por id_producto (INT)
  const mapaProductos = Object.fromEntries(productos.map((p) => [p.id_producto, p]));

  for (const item of items) {
    const prod = mapaProductos[item.id_producto];
    if (!prod) throw Object.assign(new Error(`Producto ${item.id_producto} no encontrado`), { status: 404 });
    if (prod.stock_actual < item.cantidad) {
      throw Object.assign(
        new Error(`Stock insuficiente para "${prod.nombre}": disponible ${prod.stock_actual}`),
        { status: 400 }
      );
    }
  }

  // Validar autorización para descuentos > 20%
  const subtotal = items.reduce((acc, item) => {
    return acc + mapaProductos[item.id_producto].precio_venta * item.cantidad;
  }, 0);

  const pctDescuento = subtotal > 0 ? (descuento / subtotal) * 100 : 0;
  if (pctDescuento > 20 && !id_autorizador) {
    throw Object.assign(
      new Error('Descuentos mayores al 20% requieren id_autorizador con rol administrador'),
      { status: 400 }
    );
  }

  // Verificar rol del autorizador — PK: id_usuario
  if (id_autorizador) {
    const { data: autorizador } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id_usuario', id_autorizador)
      .single();
    if (!autorizador || autorizador.rol !== 'administrador') {
      throw Object.assign(new Error('El autorizador debe tener rol administrador'), { status: 400 });
    }
  }

  const total = subtotal - descuento;
  const cambio = (monto_recibido || 0) > total ? (monto_recibido - total) : 0;
  const folio = await generarFolio();

  // Insertar cabecera — columnas reales del schema:
  // monto_recibido (no monto_pagado), cambio NOT NULL, sin id_autorizador
  const { data: venta, error: errVenta } = await supabase
    .from('ventas')
    .insert({
      folio,
      id_usuario: idUsuario,
      metodo_pago,
      monto_recibido: monto_recibido || total,
      cambio,
      subtotal,
      descuento,
      total,
      estado: 'completada',
    })
    .select()
    .single();

  if (errVenta) throw new Error(errVenta.message);

  // Insertar detalle — tabla: detalle_venta (sin 's') | PK join: id_venta | subtotal → subtotal_linea
  const detalle = items.map((item) => ({
    id_venta: venta.id_venta,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precio_unitario: mapaProductos[item.id_producto].precio_venta,
    descuento_linea: 0,                       // NOT NULL DEFAULT 0 en schema
    subtotal_linea: mapaProductos[item.id_producto].precio_venta * item.cantidad,
  }));

  const { error: errDetalle } = await supabase.from('detalle_venta').insert(detalle);
  if (errDetalle) throw new Error(errDetalle.message);

  // Descontar stock y registrar movimientos — requiere stock_anterior y stock_nuevo (NOT NULL)
  for (const item of items) {
    const stockAnterior = mapaProductos[item.id_producto].stock_actual;
    const stockNuevo = stockAnterior - item.cantidad;

    const { error: errStock } = await supabase.rpc('decrementar_stock', {
      p_id_producto: item.id_producto,
      p_cantidad: item.cantidad,
    });
    if (errStock) throw new Error(`Error al actualizar stock: ${errStock.message}`);

    // tipo 'salida' existe en CHECK del schema
    await supabase.from('movimientos_inventario').insert({
      id_producto: item.id_producto,
      tipo: 'salida',
      cantidad: item.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      id_venta: venta.id_venta,               // referencia por FK (no campo 'referencia')
      id_usuario: idUsuario,
    });
  }

  return { ...venta, detalle };
}

// Listado de ventas — columnas reales: id_venta, fecha_hora (no id, created_at)
export async function listarVentas(filtros = {}) {
  let query = supabase
    .from('ventas')
    .select('id_venta, folio, total, estado, metodo_pago, fecha_hora, id_usuario, id_corte, usuarios(nombre)')
    .order('fecha_hora', { ascending: false });

  if (filtros.fecha) {
    const inicio = `${filtros.fecha}T00:00:00`;
    const fin    = `${filtros.fecha}T23:59:59`;
    query = query.gte('fecha_hora', inicio).lte('fecha_hora', fin);
  }
  if (filtros.estado)   query = query.eq('estado', filtros.estado);
  if (filtros.id_corte) query = query.eq('id_corte', filtros.id_corte);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Obtiene una venta con detalle completo — PK: id_venta | tabla: detalle_venta
export async function obtenerVenta(id) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      usuarios(nombre),
      detalle_venta(*, productos(nombre, codigo_barras))
    `)
    .eq('id_venta', id)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Venta no encontrada'), { status: 404 });
  }
  return data;
}

// Cancela una venta y reintegra el stock
export async function cancelarVenta(id, idUsuario) {
  const venta = await obtenerVenta(id);

  if (venta.estado === 'cancelada') {
    throw Object.assign(new Error('La venta ya está cancelada'), { status: 400 });
  }

  for (const item of venta.detalle_venta || []) {
    const stockAnterior = await obtenerStockActual(item.id_producto);
    const stockNuevo    = stockAnterior + item.cantidad;

    await supabase.rpc('incrementar_stock', {
      p_id_producto: item.id_producto,
      p_cantidad: item.cantidad,
    });

    // tipo 'ajuste' para reintegros por cancelación (CHECK: entrada|salida|ajuste|devolucion)
    await supabase.from('movimientos_inventario').insert({
      id_producto:    item.id_producto,
      tipo:           'ajuste',
      cantidad:       item.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo:    stockNuevo,
      id_venta:       venta.id_venta,
      id_usuario:     idUsuario,
      observacion:    `Cancelación de venta ${venta.folio}`,
    });
  }

  const { data, error } = await supabase
    .from('ventas')
    .update({ estado: 'cancelada', motivo_cancelacion: 'Cancelada por administrador' })
    .eq('id_venta', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Devolución parcial: array de { id_producto, cantidad }
// No existe tabla 'devoluciones' en el schema — se registra como estado 'devolucion' en ventas
// y movimientos de tipo 'devolucion' por cada producto
export async function procesarDevolucion(id, items, idUsuario) {
  const venta = await obtenerVenta(id);

  if (venta.estado === 'cancelada') {
    throw Object.assign(new Error('No se puede devolver una venta cancelada'), { status: 400 });
  }

  // Verificar que cada producto esté en el detalle con cantidad válida
  const mapaDetalle = Object.fromEntries(
    venta.detalle_venta.map((d) => [d.id_producto, d])
  );

  for (const item of items) {
    const linea = mapaDetalle[item.id_producto];
    if (!linea) {
      throw Object.assign(new Error(`Producto ${item.id_producto} no pertenece a esta venta`), { status: 400 });
    }
    if (item.cantidad > linea.cantidad) {
      throw Object.assign(
        new Error(`Cantidad a devolver (${item.cantidad}) supera la vendida (${linea.cantidad})`),
        { status: 400 }
      );
    }
  }

  // Reintegrar stock y registrar movimientos tipo 'devolucion'
  for (const item of items) {
    const stockAnterior = await obtenerStockActual(item.id_producto);
    const stockNuevo    = stockAnterior + item.cantidad;

    await supabase.rpc('incrementar_stock', {
      p_id_producto: item.id_producto,
      p_cantidad: item.cantidad,
    });

    await supabase.from('movimientos_inventario').insert({
      id_producto:    item.id_producto,
      tipo:           'devolucion',
      cantidad:       item.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo:    stockNuevo,
      id_venta:       venta.id_venta,
      id_usuario:     idUsuario,
      observacion:    `Devolución de venta ${venta.folio}`,
    });
  }

  // Actualizar estado — CHECK solo permite: completada | cancelada | devolucion
  const { data, error } = await supabase
    .from('ventas')
    .update({ estado: 'devolucion' })
    .eq('id_venta', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
