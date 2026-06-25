/**
 * server.patch.js
 *
 * Muestra las TRES líneas que debes agregar a tu server.js existente
 * para activar la documentación Swagger.
 *
 * NO sustituyas tu server.js — solo agrega estas líneas.
 */

// ── 1. Importar al tope del archivo ──────────────────────────────────────────
import { montarSwagger } from './docs/swagger.js';

// ── 2. Después de registrar todas las rutas, antes de app.listen ─────────────
//       (esto se agrega una sola vez, no dentro de ninguna función)
montarSwagger(app);

// ── Tu app.listen existente queda igual ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  // La función montarSwagger() ya imprimió la URL de la documentación
});

/*
 * Resultado:
 *   http://localhost:3000/api/docs       → Swagger UI interactiva
 *   http://localhost:3000/api/docs.json  → Spec OpenAPI en JSON
 *
 * Para usar el token JWT en la UI:
 *   1. Ejecuta POST /api/auth/login
 *   2. Copia el valor de data.token
 *   3. Haz clic en el botón "Authorize" (candado)
 *   4. Pega el token en el campo "bearerAuth"
 *   5. Todos los requests siguientes incluirán el header Authorization
 */
