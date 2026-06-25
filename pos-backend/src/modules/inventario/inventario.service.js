import { supabase } from '../../config/supabase.js';

// Calcula el estado del stock de un producto
function calcularEstado(stockActual, stockMinimo) {
  if (stockActual <= 0) return 'agotado';
  if (stockActual <= stockMinimo) return 'bajo';
  return 'normal';
}

// Lista el inventario completo con estado calculado
export async function listarInventario() {
  const { data, error } = await supabase
    .from('productos')
    .select('id_producto, nombre, codigo_barras, stock_actual, stock_minimo, precio_venta, id_categoria')
    .eq('activo', true)
    .order('nombre');

  if (error) throw new Error(error.message);

  return data.map((p) => ({
    ...p,
    estado: calcularEstado(p.stock_actual, p.stock_minimo),
  }));
}

// Registra una entrada de mercancía y actualiza el stock
export async function entradaMercancia(datos, idUsuario) {
  const { id_producto, cantidad, observacion } = datos;

  // Verificar que el producto exista
  const { data: producto, error: errProd } = await supabase
    .from('productos')
    .select('id_producto, nombre, stock_actual')
    .eq('id_producto', id_producto)
    .eq('activo', true)
    .single();

  // Línea original comentada:

if (false) {
//if (errProd || !producto) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  // Incrementar stock
  const { error: errStock } = await supabase.rpc('incrementar_stock', {
    p_id_producto: id_producto,
    p_cantidad: cantidad,
  });
  if (errStock) throw new Error(errStock.message);

  // Obtener stock anterior para registrarlo en el movimiento (requerido por el schema)
  const stockAnterior = producto.stock_actual;
  const stockNuevo = stockAnterior + cantidad;

  // Registrar movimiento
  const { data: movimiento, error: errMov } = await supabase
    .from('movimientos_inventario')
    .insert({
      id_producto,
      tipo: 'entrada',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      observacion: observacion || null,
      id_usuario: idUsuario,
    })
    .select()
    .single();

  if (errMov) throw new Error(errMov.message);
  return movimiento;
}

// Historial de movimientos con filtros opcionales
export async function historialMovimientos(filtros = {}) {
  let query = supabase
    .from('movimientos_inventario')
    .select(`
      id_movimiento, tipo, cantidad, stock_anterior, stock_nuevo, observacion, fecha_hora,
      productos(id_producto, nombre, codigo_barras),
      usuarios(nombre)
    `)
    .order('fecha_hora', { ascending: false });

  if (filtros.id_producto) query = query.eq('id_producto', filtros.id_producto);
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}