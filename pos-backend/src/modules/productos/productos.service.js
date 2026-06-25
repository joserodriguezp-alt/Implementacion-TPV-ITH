import { supabase } from '../../config/supabase.js';

// Crea un nuevo producto — solo campos que existen en el schema
export async function crearProducto(datos) {
  // Extraer solo los campos válidos del schema (evita insertar categoria/unidad que no existen)
  const { nombre, codigo_barras, descripcion, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo } = datos;

  const { data, error } = await supabase
    .from('productos')
    .insert({ nombre, codigo_barras, descripcion, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo })
    .select()
    .single();

  if (error) {
    // Código 23505 = unique constraint (código de barras duplicado)
    if (error.code === '23505') {
      throw Object.assign(new Error('El código de barras ya existe'), { status: 400 });
    }
    throw new Error(error.message);
  }
  return data;
}

// Lista productos con búsqueda opcional por nombre o código de barras
export async function listarProductos(q) {
  let query = supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Obtiene un producto por ID — PK es id_producto (SERIAL INT)
export async function obtenerProducto(id) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id_producto', id)
    .eq('activo', true)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }
  return data;
}

// Obtiene un producto por código de barras
export async function obtenerPorBarcode(codigo) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('codigo_barras', codigo)
    .eq('activo', true)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }
  return data;
}

// Actualiza datos de un producto existente — PK es id_producto (SERIAL INT)
export async function actualizarProducto(id, datos) {
  // Verifica que exista primero
  await obtenerProducto(id);

  // Solo campos válidos del schema
  const { nombre, codigo_barras, descripcion, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo, activo } = datos;
  const payload = { nombre, codigo_barras, descripcion, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo, activo };

  // Eliminar undefined para no sobreescribir campos no enviados
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  const { data, error } = await supabase
    .from('productos')
    .update(payload)
    .eq('id_producto', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
