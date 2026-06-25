import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware, requireRol } from '../../middlewares/auth.middleware.js';
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  obtenerPorBarcode,
  actualizarProducto,
} from './productos.service.js';
import { ok, created, serverError } from '../../utils/response.helper.js';

const router = Router();

// Campos alineados con el schema SQL de productos:
// - codigo_barras: NOT NULL UNIQUE → requerido
// - precio_compra: NOT NULL CHECK >= 0 → requerido
// - id_categoria: FK a categorias (INT) → opcional
// - categoria y unidad eliminados (no existen en el schema)
const productoSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }),
  codigo_barras: z.string().min(1, { message: 'El código de barras es requerido' }),
  descripcion: z.string().optional(),
  id_categoria: z.number().int().positive().optional(),
  precio_compra: z.number().nonnegative({ message: 'El precio de compra no puede ser negativo' }),
  precio_venta: z.number().positive({ message: 'El precio de venta debe ser mayor a 0' }),
  stock_actual: z.number().int().nonnegative().default(0),
  stock_minimo: z.number().int().nonnegative().default(5),
});

const productoUpdateSchema = productoSchema.partial();

// POST /api/productos — autenticado (cualquier rol puede registrar)
router.post('/', authMiddleware, validate(productoSchema), async (req, res) => {
  try {
    const producto = await crearProducto(req.body);
    return created(res, producto);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/productos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const productos = await listarProductos(req.query.q);
    return ok(res, productos);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /api/productos/barcode/:codigo — debe ir ANTES de /:id
router.get('/barcode/:codigo', authMiddleware, async (req, res) => {
  try {
    const producto = await obtenerPorBarcode(req.params.codigo);
    return ok(res, producto);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/productos/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const producto = await obtenerProducto(req.params.id);
    return ok(res, producto);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// PUT /api/productos/:id — solo administrador
router.put('/:id', authMiddleware, requireRol('administrador'), validate(productoUpdateSchema), async (req, res) => {
  try {
    const producto = await actualizarProducto(req.params.id, req.body);
    return ok(res, producto);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

export { router as productosRouter };
