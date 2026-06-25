// Rutas del módulo usuarios y autenticación
import { Router } from 'express'
import { authenticate, requireRol } from '../../middlewares/auth.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { supabase } from '../../config/supabase.js'
import { ok, created, badRequest, notFound } from '../../utils/response.helper.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { z } from 'zod'

const router = Router()

// Schema de validación para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

// POST /api/auth/login — autenticar usuario y devolver JWT
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Buscar usuario activo por email
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, password_hash, rol')
      .eq('email', email)
      .eq('activo', true)
      .single()

    if (error || !user) {
      return badRequest(res, 'Credenciales inválidas')
    }

    // Verificar contraseña contra el hash almacenado
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return badRequest(res, 'Credenciales inválidas')
    }

    // Generar JWT con datos del usuario
    const token = jwt.sign(
      { id: user.id_usuario, nombre: user.nombre, rol: user.rol },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    return ok(res, {
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/usuarios — listar usuarios activos (solo administrador)
router.get('/', authenticate, requireRol('administrador'), async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, activo, creado_en')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    return ok(res, users)
  } catch (err) {
    next(err)
  }
})

export default router
