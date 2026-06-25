import { supabase } from '../config/supabase.js';

// Genera folio único con formato VTA-YYYYMMDD-NNNN
// Usa columna fecha_hora (schema real de la tabla ventas)
export async function generarFolio() {
  const hoy = new Date();
  const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '');

  // Cuenta ventas del día para obtener el siguiente número secuencial
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

  const { count, error } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', inicioDia)   // columna correcta del schema
    .lt('fecha_hora', finDia);

  if (error) throw new Error('Error al generar folio: ' + error.message);

  const secuencial = String((count || 0) + 1).padStart(4, '0');
  return `VTA-${fecha}-${secuencial}`;
}
