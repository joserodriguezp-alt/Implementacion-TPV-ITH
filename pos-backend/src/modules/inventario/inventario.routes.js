import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware, requireRol } from '../../middlewares/auth.middleware.js';
import { listarInventario, entradaMercancia, historialMovimientos } from './inventario.service.js';
import { ok, created, serverError } from '../../utils/response.helper.js';

const router = Router();

// id_producto es SERIAL INT en el schema (no UUID)
// costo_unitario, proveedor y notas no existen en movimientos_inventario
// el único campo de texto libre es observacion (TEXT, nullable)
const entradaSchema = z.object({
  id_producto: z.number().int().positive({ message: 'id_producto debe ser un entero positivo' }),
  cantidad: z.number().int().positive({ message: 'La cantidad debe ser un entero positivo' }),
  observacion: z.string().max(500).optional(),
});

// GET /api/inventario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const inventario = await listarInventario();
    return ok(res, inventario);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /api/inventario/entrada — solo administrador
router.post('/entrada', authMiddleware, requireRol('administrador'), validate(entradaSchema), async (req, res) => {
  try {
    const movimiento = await entradaMercancia(req.body, req.usuario.id);
    return created(res, movimiento);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/inventario/movimientos
router.get('/movimientos', authMiddleware, async (req, res) => {
  try {
    const movimientos = await historialMovimientos(req.query);
    return ok(res, movimientos);
  } catch (err) {
    return serverError(res, err.message);
  }
});

export { router as inventarioRouter };
