// Rutas del módulo productos — TASK-021 a TASK-025
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../../config/supabase.js'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { ok, created, badRequest, notFound } from '../../utils/response.helper.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Schema de validación para crear/editar producto
const productSchema = z.object({
  codigo_barras: z.string().min(1, 'Código de barras requerido'),
  nombre:        z.string().min(1, 'Nombre requerido'),
  descripcion:   z.string().optional(),
  id_categoria:  z.number().int().positive().optional(),
  precio_compra: z.number().min(0, 'Precio de compra debe ser mayor o igual a 0'),
  precio_venta:  z.number().min(0, 'Precio de venta requerido'),
  stock_actual:  z.number().int().min(0, 'Inventario inicial requerido'),
  stock_minimo:  z.number().int().min(0).default(5),
})

const updateSchema = productSchema.partial().omit({ codigo_barras: true })

// ----------------------------------------------------------------
// GET /api/productos — listar productos activos con búsqueda
// ----------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query

    let query = supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('activo', true)
      .order('nombre')

    // Búsqueda por nombre o código de barras
    if (q && q.length >= 3) {
      query = query.or(`nombre.ilike.%${q}%,codigo_barras.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/productos/barcode/:codigo — búsqueda por código de barras
// ----------------------------------------------------------------
router.get('/barcode/:codigo', async (req, res, next) => {
  try {
    const { codigo } = req.params

    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('codigo_barras', codigo)
      .eq('activo', true)
      .single()

    if (error || !data) return notFound(res, 'Producto no encontrado')

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/productos/:id — obtener producto por ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('id_producto', req.params.id)
      .single()

    if (error || !data) return notFound(res, 'Producto no encontrado')

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// POST /api/productos — crear producto (solo administrador)
// ----------------------------------------------------------------
router.post('/', requireRol('administrador'), validate(productSchema), async (req, res, next) => {
  try {
    // Verificar código de barras duplicado
    const { data: existing } = await supabase
      .from('productos')
      .select('id_producto')
      .eq('codigo_barras', req.body.codigo_barras)
      .single()

    if (existing) return badRequest(res, 'El código de barras ya está registrado')

    const { data, error } = await supabase
      .from('productos')
      .insert({ ...req.body, actualizado_por: req.usuario.id })
      .select()
      .single()

    if (error) throw error

    // Registrar movimiento inicial de inventario
    await supabase.from('movimientos_inventario').insert({
      id_producto:    data.id_producto,
      tipo:           'entrada',
      cantidad:       data.stock_actual,
      stock_anterior: 0,
      stock_nuevo:    data.stock_actual,
      id_usuario:     req.usuario.id,
      observacion:    'Inventario inicial al registrar producto',
    })

    return created(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// PUT /api/productos/:id — editar producto (solo administrador)
// ----------------------------------------------------------------
router.put('/:id', requireRol('administrador'), validate(updateSchema), async (req, res, next) => {
  try {
    // Verificar que el producto existe
    const { data: existing } = await supabase
      .from('productos')
      .select('precio_compra')
      .eq('id_producto', req.params.id)
      .single()

    if (!existing) return notFound(res, 'Producto no encontrado')

    const updateData = {
      ...req.body,
      actualizado_en:  new Date().toISOString(),
      actualizado_por: req.usuario.id,
    }

    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id_producto', req.params.id)
      .select()
      .single()

    if (error) throw error

    // Advertencia si precio de venta queda menor al costo
    const warning =
      data.precio_venta < data.precio_compra
        ? 'Advertencia: el precio de venta es menor al precio de compra'
        : null

    return ok(res, { producto: data, warning })
  } catch (err) {
    next(err)
  }
})

export default router
