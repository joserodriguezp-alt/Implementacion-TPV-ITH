// Rutas del módulo ventas — TASK-026 a TASK-031
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../../config/supabase.js'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { ok, created, badRequest, notFound } from '../../utils/response.helper.js'
import { generateFolio } from '../../utils/folio.generator.js'
import { generateTicket } from '../../utils/pdf.generator.js'

const router = Router()

router.use(authenticate)

// Schema para cada línea del carrito
const itemSchema = z.object({
  id_producto:     z.number().int().positive(),
  cantidad:        z.number().int().positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z.number().min(0),
  descuento_linea: z.number().min(0).default(0),
})

// Schema completo de venta
const saleSchema = z.object({
  detalle:        z.array(itemSchema).min(1, 'La venta debe tener al menos un producto'),
  metodo_pago:    z.enum(['efectivo', 'tarjeta', 'mixto']),
  monto_recibido: z.number().min(0),
  descuento:      z.number().min(0).default(0),
  id_autorizador: z.number().int().positive().optional(),
})

const cancelSchema = z.object({
  motivo: z.string().min(1, 'El motivo de cancelación es requerido'),
})

const devolucionSchema = z.object({
  items: z.array(z.object({
    id_producto: z.number().int().positive(),
    cantidad:    z.number().int().positive(),
  })).min(1, 'Debe indicar al menos un artículo a devolver'),
})

// ----------------------------------------------------------------
// POST /api/ventas — registrar venta (atómica)
// ----------------------------------------------------------------
router.post('/', validate(saleSchema), async (req, res, next) => {
  try {
    const { detalle, metodo_pago, monto_recibido, descuento, id_autorizador } = req.body

    // Validar autorización si descuento supera 20%
    const subtotal = detalle.reduce(
      (sum, item) => sum + item.precio_unitario * item.cantidad - item.descuento_linea, 0
    )
    const porcentajeDescuento = subtotal > 0 ? (descuento / subtotal) * 100 : 0

    if (porcentajeDescuento > 20) {
      if (!id_autorizador) {
        return res.status(403).json({
          success: false,
          error: 'Descuentos mayores al 20% requieren autorización de un administrador',
        })
      }
      // Verificar que el autorizador existe y es administrador
      const { data: auth } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id_usuario', id_autorizador)
        .single()

      if (!auth || auth.rol !== 'administrador') {
        return res.status(403).json({
          success: false,
          error: 'El usuario autorizador no tiene permisos de administrador',
        })
      }
    }

    // Verificar stock de todos los productos antes de proceder
    for (const item of detalle) {
      const { data: producto } = await supabase
        .from('productos')
        .select('stock_actual, nombre')
        .eq('id_producto', item.id_producto)
        .single()

      if (!producto) return badRequest(res, `Producto ID ${item.id_producto} no encontrado`)

      if (producto.stock_actual < item.cantidad) {
        return badRequest(res, `Sin existencia suficiente para "${producto.nombre}" (disponible: ${producto.stock_actual})`)
      }
    }

    // Calcular totales
    const total          = subtotal - descuento
    const cambio         = metodo_pago === 'efectivo' ? Math.max(0, monto_recibido - total) : 0

    if (metodo_pago === 'efectivo' && monto_recibido < total) {
      return badRequest(res, `Monto insuficiente. Faltante: $${(total - monto_recibido).toFixed(2)}`)
    }

    // Obtener corte de caja abierto del día (si existe)
    const today = new Date().toISOString().slice(0, 10)
    const { data: corte } = await supabase
      .from('corte_caja')
      .select('id_corte')
      .eq('fecha_corte', today)
      .eq('estado', 'abierto')
      .single()

    // Generar folio único
    const folio = await generateFolio()

    // Insertar encabezado de venta
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        folio,
        id_usuario:     req.usuario.id,
        subtotal,
        descuento,
        total,
        metodo_pago,
        monto_recibido,
        cambio,
        estado:         'completada',
        id_corte:       corte?.id_corte || null,
      })
      .select()
      .single()

    if (ventaError) throw ventaError

    // Insertar líneas del detalle
    const detalleInsert = detalle.map((item) => ({
      id_venta:        venta.id_venta,
      id_producto:     item.id_producto,
      cantidad:        item.cantidad,
      precio_unitario: item.precio_unitario,
      descuento_linea: item.descuento_linea,
      subtotal_linea:  item.precio_unitario * item.cantidad - item.descuento_linea,
    }))

    const { error: detalleError } = await supabase.from('detalle_venta').insert(detalleInsert)
    if (detalleError) throw detalleError

    // Descontar stock y registrar movimientos
    for (const item of detalle) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id_producto', item.id_producto)
        .single()

      const nuevoStock = prod.stock_actual - item.cantidad

      await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', item.id_producto)

      await supabase.from('movimientos_inventario').insert({
        id_producto:    item.id_producto,
        tipo:           'salida',
        cantidad:       item.cantidad,
        stock_anterior: prod.stock_actual,
        stock_nuevo:    nuevoStock,
        id_usuario:     req.usuario.id,
        id_venta:       venta.id_venta,
      })

      // Verificar si el stock quedó en mínimo para alerta
      const { data: prodMin } = await supabase
        .from('productos')
        .select('stock_minimo, nombre')
        .eq('id_producto', item.id_producto)
        .single()

      if (nuevoStock <= prodMin.stock_minimo) {
        console.warn(`⚠️  Stock bajo: "${prodMin.nombre}" — stock actual: ${nuevoStock}`)
      }
    }

    // Obtener venta completa con detalle para el ticket
    const { data: ventaCompleta } = await supabase
      .from('ventas')
      .select('*, detalle_venta(*, productos(nombre))')
      .eq('id_venta', venta.id_venta)
      .single()

    return created(res, ventaCompleta)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/ventas — listar ventas con filtros opcionales
// ----------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { fecha, estado, id_corte } = req.query

    let query = supabase
      .from('ventas')
      .select('*, usuarios(nombre)')
      .order('fecha_hora', { ascending: false })

    if (estado)   query = query.eq('estado', estado)
    if (id_corte) query = query.eq('id_corte', id_corte)
    if (fecha) {
      query = query
        .gte('fecha_hora', `${fecha}T00:00:00`)
        .lte('fecha_hora', `${fecha}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/ventas/:id — obtener venta con detalle completo
// ----------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, usuarios(nombre), detalle_venta(*, productos(nombre, codigo_barras))')
      .eq('id_venta', req.params.id)
      .single()

    if (error || !data) return notFound(res, 'Venta no encontrada')

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// POST /api/ventas/:id/cancelar — cancelar venta (solo administrador)
// ----------------------------------------------------------------
router.post('/:id/cancelar', requireRol('administrador'), validate(cancelSchema), async (req, res, next) => {
  try {
    const { data: venta } = await supabase
      .from('ventas')
      .select('*, detalle_venta(*)')
      .eq('id_venta', req.params.id)
      .single()

    if (!venta) return notFound(res, 'Venta no encontrada')
    if (venta.estado !== 'completada') {
      return badRequest(res, `La venta ya tiene estado "${venta.estado}" y no puede cancelarse`)
    }

    // Reintegrar stock de cada producto
    for (const item of venta.detalle_venta) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id_producto', item.id_producto)
        .single()

      const nuevoStock = prod.stock_actual + item.cantidad

      await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', item.id_producto)

      await supabase.from('movimientos_inventario').insert({
        id_producto:    item.id_producto,
        tipo:           'devolucion',
        cantidad:       item.cantidad,
        stock_anterior: prod.stock_actual,
        stock_nuevo:    nuevoStock,
        id_usuario:     req.usuario.id,
        id_venta:       venta.id_venta,
        observacion:    `Cancelación — ${req.body.motivo}`,
      })
    }

    // Actualizar estado de la venta
    const { data: updated, error } = await supabase
      .from('ventas')
      .update({ estado: 'cancelada', motivo_cancelacion: req.body.motivo })
      .eq('id_venta', req.params.id)
      .select()
      .single()

    if (error) throw error

    return ok(res, updated)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// POST /api/ventas/:id/devolucion — devolución parcial (solo administrador)
// ----------------------------------------------------------------
router.post('/:id/devolucion', requireRol('administrador'), validate(devolucionSchema), async (req, res, next) => {
  try {
    const { data: venta } = await supabase
      .from('ventas')
      .select('*, detalle_venta(*)')
      .eq('id_venta', req.params.id)
      .single()

    if (!venta) return notFound(res, 'Venta no encontrada')
    if (venta.estado === 'cancelada') {
      return badRequest(res, 'No se puede devolver una venta cancelada')
    }

    // Validar que la cantidad devuelta no supere la vendida
    for (const retorno of req.body.items) {
      const lineaOriginal = venta.detalle_venta.find(
        (d) => d.id_producto === retorno.id_producto
      )
      if (!lineaOriginal) {
        return badRequest(res, `El producto ID ${retorno.id_producto} no pertenece a esta venta`)
      }
      if (retorno.cantidad > lineaOriginal.cantidad) {
        return badRequest(res, `Cantidad a devolver (${retorno.cantidad}) supera la vendida (${lineaOriginal.cantidad})`)
      }
    }

    // Reintegrar stock de los artículos devueltos
    for (const retorno of req.body.items) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id_producto', retorno.id_producto)
        .single()

      const nuevoStock = prod.stock_actual + retorno.cantidad

      await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', retorno.id_producto)

      await supabase.from('movimientos_inventario').insert({
        id_producto:    retorno.id_producto,
        tipo:           'devolucion',
        cantidad:       retorno.cantidad,
        stock_anterior: prod.stock_actual,
        stock_nuevo:    nuevoStock,
        id_usuario:     req.usuario.id,
        id_venta:       venta.id_venta,
        observacion:    'Devolución parcial de cliente',
      })
    }

    // Marcar venta como devolución
    const { data: updated, error } = await supabase
      .from('ventas')
      .update({ estado: 'devolucion' })
      .eq('id_venta', req.params.id)
      .select()
      .single()

    if (error) throw error

    return ok(res, { venta: updated, items_devueltos: req.body.items })
  } catch (err) {
    next(err)
  }
})

export default router
