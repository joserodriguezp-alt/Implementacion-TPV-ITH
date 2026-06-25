import { supabase } from '../../config/supabase.js';

// Abre un nuevo corte de caja para la fecha actual
// Tabla: corte_caja | PK: id_corte
// NO existe monto_inicial — la tabla no tiene esa columna
export async function abrirCorte(idUsuario) {
  // Verificar que no haya un corte abierto hoy (fecha_corte es UNIQUE)
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: existente } = await supabase
    .from('corte_caja')
    .select('id_corte')
    .eq('fecha_corte', hoy)
    .maybeSingle();

  if (existente) {
    throw Object.assign(new Error('Ya existe un corte para hoy'), { status: 400 });
  }

  // Insertar solo columnas que existen en el schema
  // fecha_corte, fecha_apertura, id_usuario, estado son las únicas requeridas al abrir
  const { data, error } = await supabase
    .from('corte_caja')
    .insert({
      fecha_corte:   hoy,
      fecha_apertura: new Date().toISOString(),
      id_usuario:    idUsuario,
      estado:        'abierto',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Cierra un corte: calcula totales del día por método de pago y actualiza el registro
// 'diferencia' es GENERATED ALWAYS AS — no se inserta, PostgreSQL la calcula automáticamente
export async function cerrarCorte(id, datos) {
  const { monto_contado_fisico, observaciones } = datos;

  // Verificar que el corte exista y esté abierto — PK: id_corte
  const { data: corte, error: errCorte } = await supabase
    .from('corte_caja')
    .select('*')
    .eq('id_corte', id)
    .single();

  if (errCorte || !corte) {
    throw Object.assign(new Error('Corte no encontrado'), { status: 404 });
  }
  if (corte.estado !== 'abierto') {
    throw Object.assign(new Error('El corte ya está cerrado'), { status: 400 });
  }

  // Obtener todas las ventas del período (desde fecha_apertura)
  // Columna timestamp de ventas: fecha_hora (no created_at)
  const { data: ventas } = await supabase
    .from('ventas')
    .select('total, estado, metodo_pago')
    .gte('fecha_hora', corte.fecha_apertura)
    .is('id_corte', null);

  // Asignar este corte a todas las ventas del período
  await supabase
    .from('ventas')
    .update({ id_corte: id })
    .gte('fecha_hora', corte.fecha_apertura)
    .is('id_corte', null);

  const todasLasVentas     = ventas || [];
  const ventasCompletadas  = todasLasVentas.filter((v) => v.estado === 'completada');
  const ventasDevoluciones = todasLasVentas.filter((v) => v.estado === 'devolucion');

  // Calcular totales reales según columnas del schema
  const total_ventas_sistema   = ventasCompletadas.reduce((acc, v) => acc + Number(v.total), 0);
  const total_efectivo_sistema = ventasCompletadas
    .filter((v) => v.metodo_pago === 'efectivo')
    .reduce((acc, v) => acc + Number(v.total), 0);
  const total_tarjeta_sistema  = ventasCompletadas
    .filter((v) => v.metodo_pago === 'tarjeta')
    .reduce((acc, v) => acc + Number(v.total), 0);
  const total_devoluciones     = ventasDevoluciones.reduce((acc, v) => acc + Number(v.total), 0);

  // Actualizar solo columnas que existen en el schema
  // 'diferencia' NO se incluye — es GENERATED ALWAYS AS (monto_contado_fisico - total_efectivo_sistema)
  const { data, error } = await supabase
    .from('corte_caja')
    .update({
      fecha_cierre:           new Date().toISOString(),
      monto_contado_fisico,
      total_ventas_sistema,
      total_efectivo_sistema,
      total_tarjeta_sistema,
      total_devoluciones,
      observaciones:          observaciones || null,
      estado:                 'cerrado',
    })
    .eq('id_corte', id)
    .select(`*, usuarios(nombre)`)
    .single();

  if (error) throw new Error(error.message);

  // num_ventas y num_canceladas no existen en el schema —
  // se calculan aquí y se adjuntan solo para el PDF (no se persisten)
  return {
    ...data,
    num_ventas:     ventasCompletadas.length,
    num_canceladas: todasLasVentas.filter((v) => v.estado === 'cancelada').length,
  };
}

// Historial de cortes con filtros de fecha — columnas reales del schema
export async function listarCortes(filtros = {}) {
  let query = supabase
    .from('corte_caja')
    .select(`
      id_corte,
      fecha_corte,
      fecha_apertura,
      fecha_cierre,
      estado,
      total_ventas_sistema,
      total_efectivo_sistema,
      total_tarjeta_sistema,
      total_devoluciones,
      monto_contado_fisico,
      diferencia,
      observaciones,
      usuarios(nombre)
    `)
    .order('fecha_apertura', { ascending: false });

  if (filtros.desde) query = query.gte('fecha_apertura', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha_apertura', `${filtros.hasta}T23:59:59`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Obtiene un corte por ID con sus ventas asociadas
// PK: id_corte | ventas.fecha_hora (no created_at) | ventas.id_venta (no id)
export async function obtenerCorte(id) {
  const { data: corte, error } = await supabase
    .from('corte_caja')
    .select(`*, usuarios(nombre)`)
    .eq('id_corte', id)
    .single();

  if (error || !corte) {
    throw Object.assign(new Error('Corte no encontrado'), { status: 404 });
  }

  const { data: ventas } = await supabase
    .from('ventas')
    .select('id_venta, folio, total, estado, metodo_pago, fecha_hora')
    .eq('id_corte', id)
    .order('fecha_hora');

  return { ...corte, ventas: ventas || [] };
}
