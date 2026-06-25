// Rutas del módulo corte de caja — TASK-035 a TASK-039
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../../config/supabase.js'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { ok, created, badRequest, notFound } from '../../utils/response.helper.js'
import { generateCashReport } from '../../utils/pdf.generator.js'

const router = Router()

// Todas las rutas de corte requieren administrador
router.use(authenticate, requireRol('administrador'))

// Schema para cierre de corte
const cierreSchema = z.object({
  monto_contado_fisico: z.number().min(0, 'El monto contado es requerido'),
  observaciones:        z.string().optional(),
})

// ----------------------------------------------------------------
// POST /api/corte-caja — abrir nuevo corte del día
// ----------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    // Verificar que no exista un corte para hoy
    const { data: existing } = await supabase
      .from('corte_caja')
      .select('id_corte, estado')
      .eq('fecha_corte', today)
      .single()

    if (existing) {
      return badRequest(res, `Ya existe un corte para hoy con estado "${existing.estado}"`)
    }

    // Crear corte con estado abierto
    const { data, error } = await supabase
      .from('corte_caja')
      .insert({
        fecha_corte:    today,
        id_usuario:     req.usuario.id,
        estado:         'abierto',
        fecha_apertura: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return created(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// PUT /api/corte-caja/:id/cerrar — cerrar corte y generar PDF
// ----------------------------------------------------------------
router.put('/:id/cerrar', validate(cierreSchema), async (req, res, next) => {
  try {
    const { data: corte } = await supabase
      .from('corte_caja')
      .select('*')
      .eq('id_corte', req.params.id)
      .single()

    if (!corte)                   return notFound(res, 'Corte no encontrado')
    if (corte.estado === 'cerrado') return badRequest(res, 'Este corte ya fue cerrado')

    // Calcular totales del día con las ventas asociadas al corte
    const { data: ventas } = await supabase
      .from('ventas')
      .select('total, metodo_pago, estado')
      .eq('id_corte', corte.id_corte)

    const ventasCompletadas = (ventas || []).filter((v) => v.estado === 'completada')
    const devoluciones      = (ventas || []).filter((v) => v.estado === 'devolucion')

    const totalVentas    = ventasCompletadas.reduce((s, v) => s + v.total, 0)
    const totalEfectivo  = ventasCompletadas.filter((v) => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total, 0)
    const totalTarjeta   = ventasCompletadas.filter((v) => v.metodo_pago === 'tarjeta').reduce((s, v) => s + v.total, 0)
    const totalDevoluciones = devoluciones.reduce((s, v) => s + v.total, 0)

    const { monto_contado_fisico, observaciones } = req.body
    const diferencia = monto_contado_fisico - totalEfectivo

    // Cerrar el corte con los totales calculados
    const { data: corteCerrado, error } = await supabase
      .from('corte_caja')
      .update({
        estado:                 'cerrado',
        fecha_cierre:           new Date().toISOString(),
        total_ventas_sistema:   totalVentas,
        total_efectivo_sistema: totalEfectivo,
        total_tarjeta_sistema:  totalTarjeta,
        total_devoluciones:     totalDevoluciones,
        monto_contado_fisico,
        observaciones:          observaciones || null,
      })
      .eq('id_corte', req.params.id)
      .select('*, usuarios(nombre)')
      .single()

    if (error) throw error

    // Generar PDF del reporte de corte
    const pdfBuffer = await generateCashReport({
      fecha_corte:            corteCerrado.fecha_corte,
      usuario:                corteCerrado.usuarios?.nombre || req.usuario.nombre,
      fecha_apertura:         corteCerrado.fecha_apertura,
      fecha_cierre:           corteCerrado.fecha_cierre,
      total_ventas_sistema:   totalVentas,
      total_efectivo_sistema: totalEfectivo,
      total_tarjeta_sistema:  totalTarjeta,
      total_devoluciones:     totalDevoluciones,
      monto_contado_fisico,
      diferencia,
      observaciones,
    })

    // Devolver PDF como descarga
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="corte-${corteCerrado.fecha_corte}.pdf"`)
    return res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/corte-caja — historial de cortes con filtro de fechas
// ----------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { desde, hasta } = req.query

    let query = supabase
      .from('corte_caja')
      .select('*, usuarios(nombre)')
      .order('fecha_corte', { ascending: false })

    if (desde) query = query.gte('fecha_corte', desde)
    if (hasta) query = query.lte('fecha_corte', hasta)

    const { data, error } = await query
    if (error) throw error

    return ok(res, data)
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------------------
// GET /api/corte-caja/:id — obtener corte con ventas asociadas
// ----------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { data: corte, error } = await supabase
      .from('corte_caja')
      .select('*, usuarios(nombre)')
      .eq('id_corte', req.params.id)
      .single()

    if (error || !corte) return notFound(res, 'Corte no encontrado')

    // Obtener ventas del corte
    const { data: ventas } = await supabase
      .from('ventas')
      .select('folio, total, metodo_pago, estado, fecha_hora')
      .eq('id_corte', req.params.id)
      .order('fecha_hora')

    return ok(res, { ...corte, ventas: ventas || [] })
  } catch (err) {
    next(err)
  }
})

export default router
