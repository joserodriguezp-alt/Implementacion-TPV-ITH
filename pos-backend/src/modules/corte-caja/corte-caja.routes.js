import { Router } from 'express';
import { z } from 'zod';
import { validate }                        from '../../middlewares/validate.middleware.js';
import { authMiddleware, requireRol }      from '../../middlewares/auth.middleware.js';
import { abrirCorte, cerrarCorte, listarCortes, obtenerCorte } from './corte-caja.service.js';
import { generarReporteCorte }             from '../../utils/pdf.generator.js';
import { ok, created, serverError }        from '../../utils/response.helper.js';

const router = Router();

// Schema de apertura — sin monto_inicial (columna no existe en el schema)
const aperturaSchema = z.object({});   // el body puede llegar vacío; solo se requiere el token

// Schema de cierre — solo columnas reales del schema
const cierreSchema = z.object({
  monto_contado_fisico: z.number().nonnegative({ message: 'El monto contado no puede ser negativo' }),
  observaciones:        z.string().optional(),
});

// POST /api/corte-caja — apertura de corte
// No recibe monto_inicial porque la tabla no tiene esa columna
router.post('/', authMiddleware, requireRol('administrador'), async (req, res) => {
  try {
    const corte = await abrirCorte(req.usuario.id);
    return created(res, corte);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// PUT /api/corte-caja/:id/cerrar — cierre con PDF
// Devuelve el PDF como descarga; 'diferencia' la calcula PostgreSQL automáticamente
router.put('/:id/cerrar', authMiddleware, requireRol('administrador'), validate(cierreSchema), async (req, res) => {
  try {
    const corte     = await cerrarCorte(req.params.id, req.body);
    const pdfBuffer = await generarReporteCorte(corte);
    res.set({
      'Content-Type':        'application/pdf',
      // PK correcta: id_corte
      'Content-Disposition': `attachment; filename="corte-${corte.id_corte}.pdf"`,
    });
    return res.send(pdfBuffer);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/corte-caja — historial con filtros ?desde= y ?hasta=
router.get('/', authMiddleware, requireRol('administrador'), async (req, res) => {
  try {
    const cortes = await listarCortes(req.query);
    return ok(res, cortes);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /api/corte-caja/:id — corte por ID con ventas asociadas
router.get('/:id', authMiddleware, requireRol('administrador'), async (req, res) => {
  try {
    const corte = await obtenerCorte(req.params.id);
    return ok(res, corte);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

export { router as corteCajaRouter };
