// Helpers para respuestas HTTP consistentes

export const ok = (res, data) => res.status(200).json({ success: true, data });

export const created = (res, data) => res.status(201).json({ success: true, data });

export const badRequest = (res, error) => res.status(400).json({ success: false, error });

export const notFound = (res, error = 'Recurso no encontrado') =>
  res.status(404).json({ success: false, error });

export const forbidden = (res, error = 'Acceso denegado') =>
  res.status(403).json({ success: false, error });

export const serverError = (res, error = 'Error interno del servidor') =>
  res.status(500).json({ success: false, error });
