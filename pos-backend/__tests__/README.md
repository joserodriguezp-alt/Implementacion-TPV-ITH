# Pruebas Jest — pos-backend

## 1. Instalar dependencias

```bash
npm install --save-dev jest@29 @babel/core @babel/preset-env babel-jest
```

O agregar al `package.json` existente:

```json
{
  "scripts": {
    "test":          "jest",
    "test:watch":    "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@babel/core":       "^7.24.0",
    "@babel/preset-env": "^7.24.0",
    "babel-jest":        "^29.7.0",
    "jest":              "^29.7.0"
  }
}
```

## 2. Archivos que se agregan al proyecto

```
pos-backend/
├── babel.config.js          ← transforma ESM → CJS durante los tests
├── jest.config.js           ← configuración de Jest 29
├── package.additions.json   ← dependencias a fusionar (no reemplaza tu package.json)
└── __tests__/
    ├── README.md
    ├── ventas.service.test.js
    └── corte-caja.service.test.js
```

**Ningún archivo existente del proyecto se modifica.**

## 3. Ejecutar

```bash
# Todas las pruebas
npm test

# Solo ventas
npm test -- ventas

# Solo corte de caja
npm test -- corte-caja

# Modo observador
npm run test:watch

# Con cobertura HTML en /coverage
npm run test:coverage
```

## 4. Por qué Babel + jest.mock() + ESM

El proyecto usa `"type": "module"` en `package.json`, lo que hace que Node
trate todos los `.js` como ES Modules con `import`/`export`.

`jest.mock()` funciona interceptando el sistema de módulos de **CommonJS**
(`require`/`module.exports`). La solución oficial es usar Babel para
**transpilar ESM → CJS solo durante las pruebas**:

```
import { supabase } from '../../config/supabase.js'
       ↓ babel-jest (modules: 'commonjs')
const { supabase } = require('../../config/supabase.js')
```

Con esta transformación, `jest.mock('../src/config/supabase.js', ...)` puede
reemplazar el módulo **antes de que el service lo cargue**, lo que es
exactamente lo que necesitamos para aislar las pruebas de la base de datos.

`babel.config.js` activa esto **únicamente cuando Jest lo invoca** — el
código de producción que Node ejecuta directamente sigue siendo ESM puro.

## 5. Mapa de tests → Historias de Usuario

### ventas.service.test.js (16 tests)

| Test | HU | Escenario |
|---|---|---|
| HU-004-E1 | HU-004 | Venta OK: folio, total, cambio, RPC decrementar |
| HU-004-E3 | HU-004 | Stock = 0 → error con nombre y disponible exacto |
| HU-004-E3b | HU-004 | Cantidad > stock → error con disponible exacto |
| HU-004-E1b | HU-004 | Subtotal multi-producto al centavo (toBeCloseTo) |
| HU-004-E2 | HU-004 | Monto insuficiente → cambio = 0 |
| HU-005-E1 | HU-005 | Descuento ≤20% sin autorizador → OK |
| HU-005-E2 | HU-005 | Descuento >20% sin autorizador → error |
| HU-005-E2b | HU-005 | Autorizador con rol cajero → error |
| HU-006-E1 | HU-006 | Cancelación + RPC incrementar_stock |
| HU-006-E1b | HU-006 | Cancelar venta ya cancelada → error |
| 404 cancelar | — | Venta inexistente → 404 |
| HU-006-E2 | HU-006 | Devolución parcial: solo producto devuelto |
| HU-006-E2b | HU-006 | Devolver más de lo vendido → error |
| Producto ajeno | — | Producto no pertenece a venta → error |
| Devol. cancelada | — | No devolver venta cancelada → error |

### corte-caja.service.test.js (14 tests)

| Test | HU | Escenario |
|---|---|---|
| HU-010-E1 | HU-010 | Apertura exitosa, sin monto_inicial en insert |
| HU-010-E3 | HU-010 | Corte duplicado → error 400, sin insert |
| HU-010-E1 cierre | HU-010 | Totales por método de pago + num_ventas + num_canceladas |
| HU-010-E2 | HU-010 | `diferencia` viene del DB (GENERATED), no del update |
| HU-010-E3 cierre | HU-010 | Corte ya cerrado → error 400, sin update |
| 404 cerrar | — | Corte inexistente → 404 |
| HU-010-E1b | HU-010 | Corte sin ventas → totales en 0 |
| test.each×3 | HU-010 | Solo efectivo / solo tarjeta / devoluciones no suman |
| HU-011-E1 | HU-011 | Filtros gte/lte aplicados correctamente |
| HU-011-E1b | HU-011 | Sin filtros → sin gte/lte |
| Con ventas | HU-011 | obtenerCorte incluye array de ventas |
| Sin ventas | HU-011 | obtenerCorte devuelve [] cuando no hay ventas |
| 404 obtener | — | Corte inexistente → 404 |

**Total: 29 pruebas.**

## 6. Patrón de mocks: `mockResolvedValueOnce` en cola

Cada test configura una **secuencia ordenada** de respuestas. El service
consume cada `mockResolvedValueOnce` en el mismo orden en que llama a
Supabase:

```
crearVenta → 1ª llamada: select productos
           → 2ª llamada: insert cabecera
           → 3ª llamada: insert detalle
```

Si el service cambia el orden de sus queries, el test falla con un
resultado incorrecto — no con un falso positivo. Esto hace que las pruebas
sean sensibles a regresiones reales.
