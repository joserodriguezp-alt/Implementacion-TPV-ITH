import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware, requireRol } from '../../middlewares/auth.middleware.js';
import { login, listarUsuarios } from './usuarios.service.js';
import { ok, created, serverError } from '../../utils/response.helper.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'Password requerido' }),
});

// POST /api/auth/login
router.post('/auth/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const resultado = await login(email, password);
    return ok(res, resultado);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// GET /api/usuarios — solo administrador
router.get('/', authMiddleware, requireRol('administrador'), async (req, res) => {
  try {
    const usuarios = await listarUsuarios();
    return ok(res, usuarios);
  } catch (err) {
    return serverError(res, err.message);
  }
});

export { router as usuariosRouter };
