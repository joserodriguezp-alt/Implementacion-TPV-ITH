// Rutas del módulo inventario — TASK-032 a TASK-034
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../../config/supabase.js'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { ok, created, badRequest } from '../../utils/response.helper.js'

const router = Router()

router.use(authenticate)

// Schema para entrada de mercancía
const entradaSchema = z.object({
  id_producto:  z.number().int().positive('ID de producto requerido'),
  cantidad:     z.number().int().positive('La cantidad debe ser mayor a 0'),
  observacion:  z.string().optional(),
})

// ----------------------------------------------------------------
// GET /api/inventario — ver stock de todos los productos
// ----------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { estado } = req.query

    const { data, error } = await supabase
      .from('productos')
      .select('id_producto, nombre, codigo_barras, stock_actual, stock_minimo, categorias(nombre)')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    // Calcular estado de stock de cada producto
    let resultado = data.map((p) => ({
      ...p,
      estado:
        p.stock_actual === 0
          ? 'agotado'
          : p.stock_actual <= p.stock_minimo
          ? 'bajo'
          : 'normal',
    }))

    // Filtrar por estado si se indica
    if (estado) {
      resultado = resultado.filter((p) => p.estado === estado)
    }

    return ok(res, resultado)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// POST /api/inventario/entrada — registrar entrada de mercancía
// ----------------------------------------------------------------
router.post('/entrada', requireRol('administrador'), validate(entradaSchema), async (req, res, next) => {
  try {
    const { id_producto, cantidad, observacion } = req.body

    // Obtener stock actual del producto
    const { data: producto, error: prodError } = await supabase
      .from('productos')
      .select('stock_actual, nombre')
      .eq('id_producto', id_producto)
      .single()

    if (prodError || !producto) {
      return badRequest(res, 'Producto no encontrado')
    }

    const nuevoStock = producto.stock_actual + cantidad

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock, actualizado_en: new Date().toISOString() })
      .eq('id_producto', id_producto)

    if (updateError) throw updateError

    // Registrar movimiento de inventario
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos_inventario')
      .insert({
        id_producto,
        tipo:           'entrada',
        cantidad,
        stock_anterior: producto.stock_actual,
        stock_nuevo:    nuevoStock,
        id_usuario:     req.usuario.id,
        observacion:    observacion || 'Entrada de mercancía',
      })
      .select()
      .single()

    if (movError) throw movError

    return created(res, {
      producto: producto.nombre,
      stock_anterior: producto.stock_actual,
      cantidad_ingresada: cantidad,
      stock_nuevo: nuevoStock,
      movimiento_id: movimiento.id_movimiento,
    })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/inventario/movimientos — historial de movimientos
// ----------------------------------------------------------------
router.get('/movimientos', async (req, res, next) => {
  try {
    const { id_producto, tipo } = req.query

    let query = supabase
      .from('movimientos_inventario')
      .select('*, productos(nombre, codigo_barras), usuarios(nombre)')
      .order('fecha_hora', { ascending: false })

    if (id_producto) query = query.eq('id_producto', id_producto)
    if (tipo)        query = query.eq('tipo', tipo)

    const { data, error } = await query
    if (error) throw error

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

export default router
