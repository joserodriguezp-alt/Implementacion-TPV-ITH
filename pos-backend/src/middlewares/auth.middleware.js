import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Verifica el token Bearer y adjunta req.usuario
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.usuario = { id: payload.id, rol: payload.rol, nombre: payload.nombre };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

// Verifica que req.usuario.rol esté en la lista de roles permitidos
export const requireRol = (...roles) =>
  (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
