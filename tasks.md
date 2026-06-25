# tasks.md — Backend POS Papelería

## Criterio general de "tarea terminada"
Una tarea se considera terminada cuando su criterio de verificación es comprobable de forma objetiva: el servidor responde, el archivo existe y ejecuta sin errores, o el endpoint devuelve el status y cuerpo esperados.

---

## BLOQUE 1 — Inicialización del proyecto

### TASK-001 · Inicializar repositorio y estructura base
Crear la carpeta `backend/`, ejecutar `npm init -y` e instalar las dependencias del stack.

**Terminada cuando:**
`npm start` ejecuta sin errores y `node_modules/` contiene express, @supabase/supabase-js, zod, dotenv, pdfkit, jsonwebtoken y bcrypt.

---

### TASK-002 · Configurar ESLint y Prettier
Crear `.eslintrc.js` y `.prettierrc` con las reglas del proyecto.

**Terminada cuando:**
`npx eslint src/` y `npx prettier --check src/` no reportan errores de configuración.

---

### TASK-003 · Crear estructura de carpetas del proyecto
Crear manualmente todos los directorios definidos en `plan.md`: `src/config`, `src/middlewares`, `src/modules/*`, `src/utils`.

**Terminada cuando:**
El árbol de directorios coincide exactamente con la estructura definida en `plan.md` y todos los archivos `.js` de módulo existen (aunque vacíos).

---

### TASK-004 · Configurar variables de entorno
Crear `.env` y `.env.example` con las variables: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`.

**Terminada cuando:**
`src/config/env.js` valida con zod que las cuatro variables están presentes al arrancar; si falta alguna, el proceso termina con un mensaje de error descriptivo.

---

### TASK-005 · Configurar cliente Supabase
Implementar `src/config/supabase.js` que inicialice y exporte el cliente de Supabase usando `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`.

**Terminada cuando:**
Un script de prueba `node src/config/supabase.js` ejecuta sin errores y no lanza excepciones de conexión.

---

### TASK-006 · Configurar instancia Express y server.js
Implementar `src/app.js` con middlewares globales (json, cors) y `server.js` que inicie el servidor en el `PORT` configurado.

**Terminada cuando:**
`node server.js` imprime `Servidor corriendo en puerto 3000` y `GET http://localhost:3000/` responde con status 200 o 404 (sin crash).

---

## BLOQUE 2 — Middlewares globales

### TASK-007 · Implementar middleware de manejo de errores
Crear `src/middlewares/error.middleware.js` que capture errores no controlados y devuelva `{ error: mensaje }` con el status HTTP apropiado.

**Terminada cuando:**
Una ruta de prueba que lanza un error deliberado devuelve `{ "error": "..." }` con status 500 en lugar de crashear el servidor.

---

### TASK-008 · Implementar middleware de validación con zod
Crear `src/middlewares/validate.middleware.js` que reciba un schema zod y valide `req.body`, devolviendo 400 con los errores si la validación falla.

**Terminada cuando:**
Una petición POST con body inválido a cualquier ruta que use el middleware devuelve status 400 con un objeto `{ errors: [...] }` describiendo los campos inválidos.

---

### TASK-009 · Implementar middleware de autenticación JWT
Crear `src/middlewares/auth.middleware.js` que verifique el token JWT del header `Authorization: Bearer <token>` y adjunte `req.usuario` con id y rol.

**Terminada cuando:**
Una petición sin token devuelve 401. Una petición con token inválido devuelve 401. Una petición con token válido permite continuar al controlador.

---

### TASK-010 · Implementar middleware de autorización por rol
Extender `auth.middleware.js` con una función `requireRol(...roles)` que devuelva 403 si `req.usuario.rol` no está en la lista permitida.

**Terminada cuando:**
Una ruta protegida con `requireRol('administrador')` devuelve 403 cuando la accede un usuario con rol `cajero`, y permite el acceso a un `administrador`.

---

## BLOQUE 3 — Utilidades

### TASK-011 · Implementar helper de respuestas HTTP
Crear `src/utils/response.helper.js` con funciones `ok(res, data)`, `created(res, data)`, `badRequest(res, errors)`, `notFound(res, msg)` y `forbidden(res)`.

**Terminada cuando:**
Cada función devuelve el status HTTP correcto (200, 201, 400, 404, 403) con la estructura `{ data }` o `{ error }` según corresponda.

---

### TASK-012 · Implementar generador de folios únicos
Crear `src/utils/folio.generator.js` que genere folios con formato `VTA-YYYYMMDD-NNNN` donde NNNN es un consecutivo diario.

**Terminada cuando:**
Dos llamadas seguidas en el mismo día generan folios distintos y con el formato correcto; una llamada en fecha diferente reinicia el consecutivo.

---

### TASK-013 · Implementar generador de PDF para tickets
Crear `src/utils/pdf.generator.js` con función `generarTicket(venta)` que produzca un Buffer PDF usando pdfkit con folio, productos, total y cambio.

**Terminada cuando:**
La función recibe un objeto de venta de prueba y genera un Buffer que al escribirse a disco produce un PDF legible con los datos correctos.

---

### TASK-014 · Implementar generador de PDF para corte de caja
Agregar función `generarReporteCorte(corte)` en `pdf.generator.js` que produzca un PDF con totales del día, método de pago, diferencia y observaciones.

**Terminada cuando:**
La función recibe un objeto de corte de prueba y produce un PDF legible con todos los campos del corte de caja.

---

## BLOQUE 4 — Base de datos

### TASK-015 · Crear tablas en Supabase
Ejecutar el script `schema.sql` en el SQL Editor de Supabase para crear las tablas: `usuarios`, `categorias`, `productos`, `ventas`, `detalle_venta`, `movimientos_inventario`, `corte_caja`.

**Terminada cuando:**
Todas las tablas aparecen en el Table Editor de Supabase sin errores, con sus columnas, tipos, constraints e índices correctamente creados.

---

### TASK-016 · Insertar datos iniciales en Supabase
Ejecutar los INSERT del script `schema.sql` para crear el usuario administrador por defecto y las categorías base de papelería.

**Terminada cuando:**
La tabla `usuarios` contiene un registro con rol `administrador` y la tabla `categorias` contiene los 7 registros base.

---

### TASK-017 · Configurar Row Level Security (RLS) en Supabase
Habilitar RLS en todas las tablas y crear políticas que permitan acceso solo a usuarios autenticados con el service key del backend.

**Terminada cuando:**
Una consulta directa desde el cliente anon sin token es rechazada, y una consulta desde el backend con service key devuelve datos correctamente.

---

## BLOQUE 5 — Módulo Usuarios

### TASK-018 · Implementar servicio de login
Crear `src/modules/usuarios/usuarios.service.js` con función `login(email, password)` que verifique credenciales contra Supabase y devuelva un JWT firmado con id, nombre y rol.

**Terminada cuando:**
`POST /api/auth/login` con credenciales válidas devuelve `{ token, usuario: { id, nombre, rol } }` con status 200. Credenciales inválidas devuelven 401.

---

### TASK-019 · Implementar endpoint de login
Crear `src/modules/usuarios/usuarios.routes.js` y `usuarios.controller.js` con la ruta `POST /api/auth/login`.

**Terminada cuando:**
`POST /api/auth/login` con `{ email, password }` devuelve token JWT válido. Sin body devuelve 400 con errores de validación.

---

### TASK-020 · Implementar listado de usuarios
Agregar endpoint `GET /api/usuarios` protegido con `requireRol('administrador')` que devuelva todos los usuarios activos sin exponer `password_hash`.

**Terminada cuando:**
`GET /api/usuarios` con token de administrador devuelve array de usuarios sin campo `password_hash`. Con token de cajero devuelve 403.

---

## BLOQUE 6 — Módulo Productos

### TASK-021 · Implementar creación de producto
Crear `POST /api/productos` con validación zod de campos obligatorios: `nombre`, `codigo_barras`, `precio_venta`, `stock_actual`.

**Terminada cuando:**
POST con todos los campos válidos devuelve 201 con el producto creado. POST con `codigo_barras` duplicado devuelve 400. POST con campos faltantes devuelve 400 con errores por campo.

---

### TASK-022 · Implementar listado de productos
Crear `GET /api/productos` que devuelva todos los productos activos con su categoría. Soportar query param `?q=` para búsqueda por nombre o código de barras.

**Terminada cuando:**
`GET /api/productos` devuelve array completo. `GET /api/productos?q=lapiz` devuelve solo productos cuyo nombre contiene "lapiz". Respuesta en menos de 500 ms con 10,000 registros de prueba.

---

### TASK-023 · Implementar obtención de producto por ID
Crear `GET /api/productos/:id` que devuelva el producto con su categoría o 404 si no existe.

**Terminada cuando:**
`GET /api/productos/1` devuelve el producto. `GET /api/productos/9999` devuelve `{ "error": "Producto no encontrado" }` con status 404.

---

### TASK-024 · Implementar búsqueda por código de barras
Crear `GET /api/productos/barcode/:codigo` que devuelva el producto correspondiente al código escaneado.

**Terminada cuando:**
`GET /api/productos/barcode/7501234567890` devuelve el producto con ese código. Código inexistente devuelve 404.

---

### TASK-025 · Implementar actualización de producto
Crear `PUT /api/productos/:id` protegido con `requireRol('administrador')` que actualice campos y registre `actualizado_en` y `actualizado_por`.

**Terminada cuando:**
PUT con campos válidos devuelve 200 con el producto actualizado y los campos `actualizado_en` y `actualizado_por` reflejan la operación. Precio de venta menor al costo devuelve 200 con advertencia en el body.

---

## BLOQUE 7 — Módulo Ventas

### TASK-026 · Implementar creación de venta
Crear `POST /api/ventas` que registre la venta, sus líneas en `detalle_venta`, descuente el stock de cada producto y genere el folio, todo en una transacción atómica.

**Terminada cuando:**
POST con carrito válido devuelve 201 con la venta completa y folio generado. El stock de cada producto disminuye exactamente en la cantidad vendida. Si cualquier producto tiene stock 0, devuelve 400 sin modificar nada.

---

### TASK-027 · Implementar listado de ventas
Crear `GET /api/ventas` con filtros opcionales por `?fecha=`, `?estado=` y `?id_corte=`.

**Terminada cuando:**
`GET /api/ventas` devuelve todas las ventas. `GET /api/ventas?estado=completada` filtra correctamente. `GET /api/ventas?fecha=2026-06-23` devuelve solo las ventas de ese día.

---

### TASK-028 · Implementar obtención de venta por ID
Crear `GET /api/ventas/:id` que devuelva la venta con su detalle completo (productos, cantidades, precios).

**Terminada cuando:**
`GET /api/ventas/1` devuelve la venta con array `detalle` que incluye nombre del producto, cantidad y precio unitario. ID inexistente devuelve 404.

---

### TASK-029 · Implementar cancelación de venta
Crear `POST /api/ventas/:id/cancelar` protegido con `requireRol('administrador')` que anule la venta, reintegre el stock y registre usuario, hora y motivo.

**Terminada cuando:**
POST con `{ motivo }` cambia el estado de la venta a `cancelada`, suma de vuelta las cantidades al stock de cada producto y registra el movimiento en `movimientos_inventario`. Una venta ya cancelada devuelve 400.

---

### TASK-030 · Implementar devolución parcial
Crear `POST /api/ventas/:id/devolucion` que reciba un array de `{ id_producto, cantidad }` y reintegre solo esos artículos al inventario.

**Terminada cuando:**
POST con items válidos devuelve 200, reintegra exactamente las cantidades indicadas al stock y registra cada movimiento como tipo `devolucion`. Cantidad mayor a la vendida devuelve 400.

---

### TASK-031 · Implementar aplicación de descuento
Agregar campo `descuento` y lógica de autorización en `POST /api/ventas`: descuentos mayores al 20% requieren `id_autorizador` en el body con rol administrador.

**Terminada cuando:**
POST con `descuento` del 10% procesa sin campo extra. POST con `descuento` del 25% sin `id_autorizador` devuelve 403. POST con `descuento` del 25% con `id_autorizador` válido de administrador procesa correctamente.

---

## BLOQUE 8 — Módulo Inventario

### TASK-032 · Implementar listado de inventario
Crear `GET /api/inventario` que devuelva todos los productos con `stock_actual`, `stock_minimo` y campo calculado `estado` (normal / bajo / agotado).

**Terminada cuando:**
`GET /api/inventario` devuelve array con campo `estado` correcto para cada producto. `GET /api/inventario?estado=bajo` devuelve solo productos con stock por debajo del mínimo.

---

### TASK-033 · Implementar registro de entrada de mercancía
Crear `POST /api/inventario/entrada` protegido con `requireRol('administrador')` que sume cantidad al stock y registre el movimiento.

**Terminada cuando:**
POST con `{ id_producto, cantidad }` válidos aumenta `stock_actual` del producto, crea registro en `movimientos_inventario` con tipo `entrada`, y devuelve 201 con el stock actualizado. Cantidad 0 o negativa devuelve 400.

---

### TASK-034 · Implementar historial de movimientos de inventario
Crear `GET /api/inventario/movimientos` con filtros opcionales `?id_producto=` y `?tipo=`.

**Terminada cuando:**
`GET /api/inventario/movimientos` devuelve todos los movimientos ordenados por `fecha_hora` descendente. Filtros reducen correctamente los resultados.

---

## BLOQUE 9 — Módulo Corte de Caja

### TASK-035 · Implementar apertura de corte de caja
Crear `POST /api/corte-caja` protegido con `requireRol('administrador')` que abra un nuevo corte para la fecha actual.

**Terminada cuando:**
POST crea un registro en `corte_caja` con estado `abierto` y `fecha_apertura` en timestamp actual. Un segundo POST el mismo día devuelve 400 indicando que ya existe un corte abierto.

---

### TASK-036 · Implementar cierre de corte de caja
Crear `PUT /api/corte-caja/:id/cerrar` que reciba `monto_contado_fisico` y `observaciones`, calcule totales del día y cierre el corte.

**Terminada cuando:**
PUT suma todas las ventas `completadas` del día agrupadas por método de pago, calcula `diferencia`, actualiza estado a `cerrado` y devuelve 200 con el resumen completo. Un corte ya cerrado devuelve 400.

---

### TASK-037 · Implementar generación de PDF del corte
Agregar a `PUT /api/corte-caja/:id/cerrar` la generación del PDF de reporte y devolverlo como descarga.

**Terminada cuando:**
La respuesta del cierre devuelve header `Content-Type: application/pdf` y el body es un PDF válido con todos los totales, diferencia y observaciones del corte.

---

### TASK-038 · Implementar historial de cortes de caja
Crear `GET /api/corte-caja` con filtro opcional `?desde=` y `?hasta=` por rango de fechas.

**Terminada cuando:**
`GET /api/corte-caja` devuelve todos los cortes con usuario responsable. `GET /api/corte-caja?desde=2026-06-01&hasta=2026-06-30` devuelve solo los del rango indicado.

---

### TASK-039 · Implementar obtención de corte por ID
Crear `GET /api/corte-caja/:id` que devuelva el corte con todas las ventas asociadas.

**Terminada cuando:**
`GET /api/corte-caja/1` devuelve el corte con array `ventas` con sus folios y totales. Si el corte tiene estado `cerrado`, el campo `diferencia` está presente. ID inexistente devuelve 404.

---

## BLOQUE 10 — Verificación final

### TASK-040 · Verificar cobertura de todos los endpoints
Revisar que cada historia de usuario del `spec.md` tiene al menos un endpoint que la implementa.

**Terminada cuando:**
Existe una tabla de trazabilidad que mapea cada HU del spec a su endpoint correspondiente, sin HU sin cobertura.

---

### TASK-041 · Verificar operaciones atómicas en ventas
Comprobar que si falla la inserción en `detalle_venta` o el descuento de stock durante una venta, la venta no queda registrada en la base de datos.

**Terminada cuando:**
Simulando un fallo en medio de una transacción de venta (ej. producto con stock insuficiente en el segundo ítem), ni la venta ni ningún movimiento de inventario quedan registrados.

---

### TASK-042 · Verificar cierre automático de sesión
Confirmar que tokens con más de 8 horas de antigüedad son rechazados por `auth.middleware.js`.

**Terminada cuando:**
Un token generado con `expiresIn: '8h'` es aceptado antes de las 8 horas y rechazado con 401 después.

---

## Resumen de tareas por bloque

| Bloque | Tareas | Total |
|---|---|---|
| 1 · Inicialización | TASK-001 a TASK-006 | 6 |
| 2 · Middlewares | TASK-007 a TASK-010 | 4 |
| 3 · Utilidades | TASK-011 a TASK-014 | 4 |
| 4 · Base de datos | TASK-015 a TASK-017 | 3 |
| 5 · Usuarios | TASK-018 a TASK-020 | 3 |
| 6 · Productos | TASK-021 a TASK-025 | 5 |
| 7 · Ventas | TASK-026 a TASK-031 | 6 |
| 8 · Inventario | TASK-032 a TASK-034 | 3 |
| 9 · Corte de Caja | TASK-035 a TASK-039 | 5 |
| 10 · Verificación | TASK-040 a TASK-042 | 3 |
| **Total** | | **42** |
