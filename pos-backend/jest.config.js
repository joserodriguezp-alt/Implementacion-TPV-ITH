/**
 * jest.config.js
 *
 * Configuración de Jest 29 para un proyecto Node.js con ES Modules.
 * babel-jest se encarga de transformar import/export → require/module.exports
 * en tiempo de prueba a través de babel.config.js.
 */
export default {
  testEnvironment: 'node',

  // babel-jest aplica babel.config.js a cada archivo .js antes de ejecutarlo
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Carpeta de pruebas
  testMatch: ['**/__tests__/**/*.test.js'],

  // Cobertura de los services bajo prueba
  collectCoverageFrom: [
    'src/modules/ventas/ventas.service.js',
    'src/modules/corte-caja/corte-caja.service.js',
  ],
  coverageReporters: ['text', 'lcov'],

  // Nombre de cada prueba en la salida de consola
  verbose: true,

  // Limpia mocks automáticamente entre pruebas
  clearMocks: true,
};
