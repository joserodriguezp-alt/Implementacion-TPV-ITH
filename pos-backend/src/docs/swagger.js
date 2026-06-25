/**
 * src/docs/swagger.js
 *
 * Integra swagger-ui-express con el spec YAML del proyecto.
 * Se monta SOLO en entornos que no sean producción.
 *
 * Uso en server.js:
 *   import { montarSwagger } from './docs/swagger.js';
 *   montarSwagger(app);
 */

import swaggerUi   from 'swagger-ui-express';
import YAML        from 'yamljs';
import { fileURLToPath } from 'url';
import path              from 'path';

// Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Carga el spec ────────────────────────────────────────────────────────────
// YAML.load() es síncrono — se ejecuta una sola vez al iniciar el servidor.
// Si el archivo tiene un error de sintaxis YAML, lanzará aquí y el servidor
// no arrancará, lo cual es el comportamiento correcto.
const swaggerSpec = YAML.load(path.join(__dirname, 'swagger.yaml'));

// ─── Opciones de la UI ────────────────────────────────────────────────────────
const UI_OPTIONS = {
  // Abre la primera sección por defecto
  docExpansion: 'list',
  // Muestra el campo de entrada del token JWT
  persistAuthorization: true,
  // Ordena los tags alfabéticamente
  tagsSorter: 'alpha',
  // URL base de los servidores en el desplegable
  displayRequestDuration: true,
};

/**
 * Monta la documentación Swagger en la app de Express.
 *
 * @param {import('express').Application} app - Instancia de Express
 * @param {string} [ruta='/api/docs'] - Path donde se sirve la UI
 */
export function montarSwagger(app, ruta = '/api/docs') {
  // No montar en producción (la documentación no debe ser pública)
  if (process.env.NODE_ENV === 'production') {
    console.log('[swagger] UI deshabilitada en producción');
    return;
  }

  // Sirve el spec como JSON (útil para clientes Swagger externos)
  app.get(`${ruta}.json`, (_req, res) => res.json(swaggerSpec));

  // Monta la UI interactiva
  app.use(ruta, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { swaggerOptions: UI_OPTIONS }));

  console.log(`[swagger] Documentación disponible en http://localhost:${process.env.PORT ?? 3000}${ruta}`);
}
