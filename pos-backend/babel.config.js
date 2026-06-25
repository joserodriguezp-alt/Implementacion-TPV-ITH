/**
 * babel.config.js
 *
 * Transforma el código ESM (import/export) a CommonJS SOLO durante las
 * pruebas de Jest. El código de producción sigue usando ESM nativo de Node.
 *
 * ¿Por qué es necesario?
 * jest.mock() funciona interceptando el sistema de módulos de CommonJS
 * (require/module.exports). Cuando el proyecto usa "type": "module",
 * Babel traduce temporalmente cada import a require para que Jest pueda
 * aplicar los mocks ANTES de que se cargue el módulo bajo prueba.
 *
 * Esta configuración NO afecta el build ni el runtime de producción.
 */
export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' }, // usa la versión de Node instalada
        modules: 'commonjs',          // clave: convierte ESM → CJS en tests
      },
    ],
  ],
};
