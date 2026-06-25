// Middleware de validación con Zod — recibe un schema y valida req.body
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      detalles: result.error.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    });
  }
  // Reemplaza req.body con el valor parseado (incluye defaults de Zod)
  req.body = result.data;
  next();
};
