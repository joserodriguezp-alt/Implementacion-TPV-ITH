// Rutas del módulo productos
import { Router } from 'express'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'

const router = Router()

// TODO: implementar endpoints de productos (TASK-021 a TASK-025)
// GET    /api/productos
// GET    /api/productos/:id
// GET    /api/productos/barcode/:codigo
// POST   /api/productos         (solo administrador)
// PUT    /api/productos/:id     (solo administrador)

export default router
