// Middleware global de manejo de errores — captura todo lo que llega sin respuesta
export function errorMiddleware(err, req, res, next) {
  console.error('[Error]', err.message, err.stack);

  // Errores de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      detalles: err.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message })),
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }

  const status = err.status || err.statusCode || 500;
  const mensaje = status < 500 ? err.message : 'Error interno del servidor';

  return res.status(status).json({ success: false, error: mensaje });
}
