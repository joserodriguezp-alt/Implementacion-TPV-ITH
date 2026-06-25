import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware, requireRol } from '../../middlewares/auth.middleware.js';
import {
  crearVenta,
  listarVentas,
  obtenerVenta,
  cancelarVenta,
  procesarDevolucion,
} from './ventas.service.js';
import { generarTicket } from '../../utils/pdf.generator.js';
import { ok, created, serverError } from '../../utils/response.helper.js';

const router = Router();

// id_producto e id_autorizador son SERIAL INT (no UUID)
// metodo_pago: schema CHECK solo permite efectivo | tarjeta | mixto (no transferencia)
// monto_recibido (no monto_pagado) — nombre real de la columna en ventas
const ventaSchema = z.object({
  items: z.array(
    z.object({
      id_producto: z.number().int().positive({ message: 'id_producto debe ser entero positivo' }),
      cantidad: z.number().int().positive(),
    })
  ).min(1, 'Se requiere al menos un producto'),
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'mixto']).default('efectivo'),
  monto_recibido: z.number().nonnegative().optional(),
  descuento: z.number().nonnegative().default(0),
  id_autorizador: z.number().int().positive().optional(),
});

const devolucionSchema = z.object({
  items: z.array(
    z.object({
      id_producto: z.number().int().positive(),
      cantidad: z.number().int().positive(),
    })
  ).min(1),
});

// POST /api/ventas
router.post('/', authMiddleware, validate(ventaSchema), async (req, res) => {
  try {
    const venta = await crearVenta(req.body, req.usuario.id);
    return created(res, venta);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/ventas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const ventas = await listarVentas(req.query);
    return ok(res, ventas);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /api/ventas/:id — debe ir antes de /:id/ticket para que Express no confunda rutas
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const venta = await obtenerVenta(req.params.id);
    return ok(res, venta);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/ventas/:id/ticket — genera PDF del ticket
router.get('/:id/ticket', authMiddleware, async (req, res) => {
  try {
    const venta = await obtenerVenta(req.params.id);
    const pdfBuffer = await generarTicket(venta);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${venta.folio}.pdf"`,
    });
    return res.send(pdfBuffer);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// POST /api/ventas/:id/cancelar — solo administrador
router.post('/:id/cancelar', authMiddleware, requireRol('administrador'), async (req, res) => {
  try {
    const venta = await cancelarVenta(req.params.id, req.usuario.id);
    return ok(res, venta);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// POST /api/ventas/:id/devolucion
router.post('/:id/devolucion', authMiddleware, validate(devolucionSchema), async (req, res) => {
  try {
    const devolucion = await procesarDevolucion(req.params.id, req.body.items, req.usuario.id);
    return created(res, devolucion);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

export { router as ventasRouter };
