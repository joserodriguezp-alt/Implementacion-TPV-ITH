# skill-ith-backend.md

## Convenciones de código
- Variables y funciones: en inglés (camelCase)
- Comentarios: en español
- Archivos: en inglés, minúsculas, con guión (ej. product-routes.js)

## Respuestas de API
- Éxito:  { success: true, data: [...] }
- Error:  { success: false, error: "Mensaje descriptivo" }

## Manejo de errores
- Códigos HTTP estándar: 200, 201, 400, 404, 500
- Siempre usar try/catch
- Nunca exponer errores internos al cliente

## Base de datos (Supabase)
- Credenciales siempre en .env, nunca en el código
- Tablas en español, plural (productos, ventas, usuarios)
