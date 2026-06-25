# tasks-frontend.md — Frontend POS Papelería

## Criterio general de "tarea terminada"
Una tarea se considera terminada cuando su criterio de verificación es comprobable de forma visual y objetiva: el componente renderiza sin errores en el navegador, muestra los datos correctos, y responde a la interacción del usuario según el escenario Given/When/Then descrito.

---

## BLOQUE 1 — Inicialización del proyecto

### TASK-F001 · Inicializar proyecto React + Vite + Tailwind
Crear el proyecto con `npm create vite@latest`, instalar dependencias del stack: `react-router-dom`, `axios`, `zustand`, `react-hot-toast`, `react-hook-form`, `zod`, `@hookform/resolvers`, y configurar Tailwind CSS con `postcss`.

**Terminada cuando:**
- **Given** que el proyecto está recién inicializado
- **When** se ejecuta `npm run dev`
- **Then** el navegador muestra la página en `localhost:5173` sin errores en consola y el CSS de Tailwind está activo (una clase como `bg-blue-600` aplica color)

---

### TASK-F002 · Configurar variables de entorno
Crear `.env` y `.env.example` con `VITE_API_URL=http://localhost:3000/api`. Todas las variables del frontend deben iniciar con `VITE_` para que Vite las exponga al navegador.

**Terminada cuando:**
- **Given** que `.env` contiene `VITE_API_URL=http://localhost:3000/api`
- **When** se imprime `import.meta.env.VITE_API_URL` en cualquier componente
- **Then** la consola del navegador muestra `http://localhost:3000/api` sin `undefined`

---

### TASK-F003 · Configurar cliente HTTP axios con interceptor JWT
Crear `src/api/client.js` con `baseURL: import.meta.env.VITE_API_URL`, interceptor de request que adjunte el token JWT desde `localStorage` como `Authorization: Bearer <token>`, e interceptor de response que redirija a `/login` si recibe 401.

**Terminada cuando:**
- **Given** que hay un token guardado en `localStorage` con la clave `pos_token`
- **When** se ejecuta cualquier llamada a la API
- **Then** la pestaña Network del navegador muestra el header `Authorization: Bearer <token>` en la request

---

### TASK-F004 · Configurar store de autenticación con Zustand
Crear `src/store/auth.store.js` con estado `{ token, usuario }`, acciones `iniciarSesion(token, usuario)` y `cerrarSesion()`, y persistencia en `localStorage` para sobrevivir recargas de página.

**Terminada cuando:**
- **Given** que se llama a `iniciarSesion` con un token y objeto usuario de prueba
- **When** se recarga la página con F5
- **Then** el store recupera token y usuario desde `localStorage` sin perder la sesión

---

### TASK-F005 · Configurar enrutamiento con React Router
Crear `src/router/AppRouter.jsx` con rutas públicas (`/login`) y protegidas (`/ventas`, `/productos`, `/inventario`, `/corte-caja`). Implementar `src/components/layout/ProtectedRoute.jsx` que redirige a `/login` si no hay token, y a `/sin-acceso` si el rol no está permitido.

**Terminada cuando:**
- **Given** que el usuario no está autenticado
- **When** intenta acceder a `/ventas` escribiendo la URL directamente
- **Then** el navegador lo redirige automáticamente a `/login` sin mostrar el contenido protegido

---

### TASK-F006 · Configurar notificaciones con react-hot-toast
Agregar `<Toaster position="top-right" toastOptions={{ duration: 4000 }} />` en `App.jsx`. Crear `src/utils/notify.js` con funciones `notifySuccess(msg)`, `notifyError(msg)` y `notifyWarning(msg)`.

**Terminada cuando:**
- **Given** que se llama a `notifyError('Producto no encontrado')`
- **When** la función ejecuta en cualquier pantalla
- **Then** aparece un toast rojo con el texto en la esquina superior derecha y desaparece solo a los 4 segundos

---

## BLOQUE 2 — Layout y navegación

### TASK-F007 · Implementar Sidebar con filtro por rol
Crear `src/components/layout/Sidebar.jsx` con enlaces a todas las secciones. Los ítems deben filtrarse según el rol del usuario autenticado: el cajero solo ve Ventas y Productos; el administrador ve además Inventario, Corte de Caja y Usuarios. El enlace activo debe tener estilo visual diferenciado (fondo resaltado).

**Terminada cuando:**
- **Given** que el usuario autenticado tiene rol `cajero`
- **When** visualiza el sidebar
- **Then** solo aparecen los ítems Ventas y Productos; Inventario y Corte de Caja no están en el DOM

---

### TASK-F008 · Implementar Navbar con datos de sesión y botón de cierre
Crear `src/components/layout/Navbar.jsx` que muestre el nombre del usuario autenticado, su rol, y un botón "Cerrar sesión" que llame a `cerrarSesion()` del store y redirija a `/login`.

**Terminada cuando:**
- **Given** que el usuario `Ana López` con rol `cajero` ha iniciado sesión
- **When** visualiza el navbar
- **Then** aparece "Ana López · Cajero"; al hacer clic en "Cerrar sesión" la sesión se elimina de `localStorage` y la pantalla regresa al login

---

### TASK-F009 · Implementar componentes UI reutilizables
Crear en `src/components/ui/`: `Button.jsx` (variantes: primary, danger, ghost, outline), `Input.jsx` (con label y mensaje de error integrado), `Badge.jsx` (variantes: success, warning, danger), `Modal.jsx` (cierra con Escape o clic fuera), `Table.jsx` (columnas y filas configurables por props).

**Terminada cuando:**
- **Given** que se usa `<Button variante="danger" cargando={true}>Eliminar</Button>`
- **When** el componente renderiza
- **Then** muestra el botón en rojo con un spinner girando y en estado deshabilitado

---

## BLOQUE 3 — Módulo Productos (HU-001, HU-002, HU-003)

### TASK-F010 · Implementar catálogo de productos con buscador
Crear `src/modules/productos/ProductosList.jsx` que cargue productos desde `GET /api/productos` y los muestre en una tabla con columnas: nombre, código de barras, categoría, precio de venta y stock actual. Incluir un campo de búsqueda que filtre enviando `?q=texto` a la API con debounce de 300 ms.

**Terminada cuando:**
- **Given** que el usuario está en la pantalla de Productos
- **When** escribe "cuaderno" en el buscador y espera 300 ms
- **Then** la tabla se actualiza mostrando solo los productos cuyo nombre o código contiene "cuaderno", sin recargar la página completa

---

### TASK-F011 · Implementar búsqueda por código de barras
Crear `src/modules/productos/ProductoBusqueda.jsx` con un campo de texto que al presionar Enter llame a `GET /api/productos/barcode/:codigo`. Si el producto existe, lo retorna al componente padre vía prop `onProductoEncontrado`; si no, muestra `notifyError('Producto no encontrado')` y limpia el campo.

**Terminada cuando:**
- **Given** que el cajero está enfocado en el campo de código de barras
- **When** escanea o escribe un código válido y presiona Enter
- **Then** el componente padre recibe el producto inmediatamente; con un código inexistente aparece el toast de error y el campo queda listo para un nuevo intento

---

### TASK-F012 · Implementar formulario de alta de producto
Crear `src/modules/productos/ProductoForm.jsx` con `react-hook-form` + `zod`. Campos requeridos: nombre, código de barras, precio de compra (≥ 0), precio de venta (> 0), stock inicial (≥ 0), categoría (select). Al guardar llama a `POST /api/productos` y muestra `notifySuccess` o `notifyError` según el resultado.

**Terminada cuando:**
- **Given** que el administrador deja el campo "Nombre" vacío e intenta guardar
- **When** hace clic en el botón "Guardar"
- **Then** el campo se resalta con borde rojo y muestra el mensaje "El nombre es requerido" debajo; no se realiza ninguna llamada a la API

---

### TASK-F013 · Implementar edición de producto
Extender `ProductoForm.jsx` para modo edición: recibe el producto como prop, precarga todos los campos y llama a `PUT /api/productos/:id` al guardar. Si el precio de venta ingresado es menor al precio de compra, muestra una advertencia visual antes de permitir guardar.

**Terminada cuando:**
- **Given** que el administrador edita un producto con precio de compra $50
- **When** ingresa precio de venta $30 y hace clic en Guardar
- **Then** aparece el mensaje de advertencia "El precio de venta es menor al costo"; al confirmar, el producto se actualiza y aparece `notifySuccess('Producto actualizado')`

---

## BLOQUE 4 — Módulo Ventas / Carrito (HU-004, HU-005, HU-006)

### TASK-F014 · Implementar pantalla de nueva venta
Crear `src/modules/ventas/VentaNueva.jsx` que combine `ProductoBusqueda.jsx` (arriba) con `VentaCarrito.jsx` (abajo o a la derecha). Al seleccionar un producto desde el buscador, se agrega automáticamente al carrito mediante el store.

**Terminada cuando:**
- **Given** que el cajero está en la pantalla de nueva venta
- **When** escanea o escribe el código de un producto válido y presiona Enter
- **Then** el producto aparece como línea nueva en el carrito con cantidad 1 y su precio; si ya estaba en el carrito, la cantidad incrementa en 1

---

### TASK-F015 · Implementar store del carrito con Zustand
Crear `src/store/carrito.store.js` con: array `items` (cada ítem: `id_producto`, `nombre`, `precio_unitario`, `cantidad`, `subtotal_linea`), acciones `agregarItem`, `cambiarCantidad`, `eliminarItem`, `aplicarDescuento`, `limpiar`, y valores calculados `subtotal`, `total`, `cambio`, `faltante`.

**Terminada cuando:**
- **Given** que el carrito tiene productos con total $150 y `monto_recibido` es $200
- **When** se accede a `carritoStore.cambio`
- **Then** el valor retornado es exactamente `50` sin ningún cálculo adicional en el componente

---

### TASK-F016 · Implementar componente VentaCarrito con edición de cantidades
Crear `src/modules/ventas/VentaCarrito.jsx` que liste los ítems del carrito con columnas: nombre, precio unitario, cantidad (botones + y − editables), subtotal por línea y botón de eliminar (✕). Al pie mostrar: subtotal, descuento aplicado y **total en tipografía grande**. Todos los valores en formato MXN.

**Terminada cuando:**
- **Given** que el carrito tiene 3 líneas de productos
- **When** el cajero hace clic en "+" en la segunda línea
- **Then** la cantidad de esa línea incrementa en 1, su subtotal se recalcula y el total general se actualiza en pantalla de inmediato, sin llamada a la API

---

### TASK-F017 · Implementar panel de cobro con método de pago y cambio en tiempo real
Agregar al pie de `VentaCarrito.jsx` un panel con: selector de método de pago (`efectivo` / `tarjeta` / `mixto`), campo "Monto recibido" visible solo cuando el método es `efectivo`, indicador de cambio (verde) o faltante (rojo) calculado en tiempo real, y botón "Cobrar" que llama a `POST /api/ventas`.

**Terminada cuando:**
- **Given** que el total de la venta es $175 y el método es efectivo
- **When** el cajero ingresa $200 en el campo de monto recibido
- **Then** aparece "Cambio: $25.00" en verde; si ingresa $100, aparece "Faltante: $75.00" en rojo y el botón "Cobrar" queda deshabilitado

---

### TASK-F018 · Implementar aplicación de descuento con autorización
Agregar botón "% Descuento" en el carrito que abra un modal con campo de porcentaje. Descuentos ≤ 20% se aplican directo actualizando el store. Descuentos > 20% muestran un campo adicional "ID del administrador" que se envía como `id_autorizador` en `POST /api/ventas`.

**Terminada cuando:**
- **Given** que el cajero intenta aplicar un descuento del 25%
- **When** hace clic en "Aplicar" sin ingresar el ID del administrador
- **Then** el botón permanece deshabilitado y aparece el texto "Se requiere ID del administrador para descuentos mayores al 20%"

---

### TASK-F019 · Implementar modal de confirmación y descarga de ticket
Tras `POST /api/ventas` exitoso, mostrar un modal con: folio generado, total cobrado, cambio a entregar, botón "Descargar ticket" (abre `GET /api/ventas/:id/ticket` en nueva pestaña) y botón "Nueva venta" que limpia el carrito y cierra el modal.

**Terminada cuando:**
- **Given** que la venta se procesó correctamente
- **When** el modal de confirmación aparece
- **Then** muestra el folio en formato `VTA-YYYYMMDD-NNNN`, el total y el cambio; "Nueva venta" vacía el carrito completamente y el campo de búsqueda queda listo para escanear

---

### TASK-F020 · Implementar historial de ventas con filtros
Crear `src/modules/ventas/VentaHistorial.jsx` que cargue ventas de `GET /api/ventas` y muestre tabla con: folio, fecha/hora, total, método de pago y estado (Badge de color). Filtros: selector de fecha y selector de estado, aplicados con botón "Buscar".

**Terminada cuando:**
- **Given** que el administrador selecciona la fecha de hoy y estado "completada"
- **When** hace clic en "Buscar"
- **Then** la tabla muestra solo las ventas del día con estado completada; ventas de otros días o con otro estado no aparecen

---

### TASK-F021 · Implementar cancelación de venta
En el historial, agregar botón "Cancelar" visible solo para administrador. Al hacer clic abre un modal que solicita el motivo y llama a `POST /api/ventas/:id/cancelar`. Tras cancelar, el Badge de esa fila cambia a "Cancelada" sin recargar la tabla.

**Terminada cuando:**
- **Given** que el administrador hace clic en "Cancelar" en una venta completada
- **When** escribe el motivo y confirma
- **Then** el Badge cambia a "Cancelada" en rojo en esa misma fila y aparece `notifySuccess('Venta cancelada')`; las demás filas no se modifican

---

## BLOQUE 5 — Módulo Inventario (HU-007, HU-008, HU-009)

### TASK-F022 · Implementar panel de inventario con estado de stock
Crear `src/modules/inventario/InventarioPanel.jsx` que cargue datos de `GET /api/inventario` y muestre tabla con: nombre, código de barras, stock actual, stock mínimo y Badge de estado (`normal` → verde, `bajo` → amarillo, `agotado` → rojo). Incluir selector de filtro por estado.

**Terminada cuando:**
- **Given** que el administrador está en el panel de inventario
- **When** selecciona el filtro "Bajo" en el selector de estado
- **Then** la tabla muestra solo los productos con `stock_actual ≤ stock_minimo`, cada uno con Badge amarillo "Bajo"

---

### TASK-F023 · Implementar formulario de entrada de mercancía
Crear `src/modules/inventario/EntradaMercancia.jsx` como modal con campos: producto (buscable por nombre con `GET /api/productos?q=`), cantidad (entero > 0) y observación opcional. Al confirmar llama a `POST /api/inventario/entrada` y actualiza el stock del producto en la tabla sin recargar.

**Terminada cuando:**
- **Given** que el administrador registra 50 unidades de entrada para un producto con stock actual 10
- **When** confirma la operación
- **Then** la columna stock del producto en la tabla cambia a 60, el Badge se actualiza si corresponde, y aparece `notifySuccess('+50 unidades registradas')`

---

### TASK-F024 · Implementar alertas de stock mínimo tras venta
En `src/store/alertas.store.js`, después de cada `POST /api/ventas` exitoso, comparar el stock resultante de cada producto vendido con su `stock_minimo`. Si `stock_actual ≤ stock_minimo`, agregar el producto a las alertas. Mostrar el conteo en un badge rojo en el Navbar.

**Terminada cuando:**
- **Given** que una venta deja un producto con `stock_actual = stock_minimo`
- **When** la venta se confirma exitosamente
- **Then** aparece un badge rojo con el número "1" en el Navbar; al hacer clic muestra el nombre del producto y su stock actual

---

## BLOQUE 6 — Módulo Corte de Caja (HU-010, HU-011)

### TASK-F025 · Implementar apertura de corte de caja
Crear `src/modules/corte-caja/CorteCajaForm.jsx` con botón "Iniciar corte del día" que llame a `POST /api/corte-caja`. Si ya existe corte abierto, el backend devuelve 400 y el componente muestra "Ya hay un corte abierto para hoy" con el botón deshabilitado.

**Terminada cuando:**
- **Given** que no existe ningún corte abierto hoy
- **When** el administrador hace clic en "Iniciar corte del día"
- **Then** el botón cambia a "Corte iniciado" deshabilitado y aparece la hora de apertura del corte; un segundo clic muestra el error del backend sin romper la pantalla

---

### TASK-F026 · Implementar resumen del corte activo con totales por método de pago
En `CorteCajaForm.jsx`, cuando existe un corte abierto mostrar: total de ventas del día, desglose por método de pago (efectivo / tarjeta / mixto), total de devoluciones, número de ventas completadas, campo "Monto contado físico" y campo "Observaciones".

**Terminada cuando:**
- **Given** que existe un corte abierto con 5 ventas: $800 en efectivo y $350 en tarjeta
- **When** el administrador visualiza el resumen
- **Then** se muestran: Efectivo $800.00, Tarjeta $350.00, Total sistema $1,150.00, cada valor formateado en MXN

---

### TASK-F027 · Implementar cierre de corte con diferencia y descarga de PDF
Al hacer clic en "Cerrar corte", llamar a `PUT /api/corte-caja/:id/cerrar` con `monto_contado_fisico` y `observaciones`. La respuesta es un blob PDF: descargarlo con `URL.createObjectURL` usando el nombre `corte-YYYY-MM-DD.pdf`. Mostrar la diferencia antes de confirmar.

**Terminada cuando:**
- **Given** que el total sistema es $1,150 y el administrador ingresa $1,100 como monto contado
- **When** el panel muestra la diferencia antes de confirmar
- **Then** aparece "Diferencia: −$50.00" en rojo; al confirmar el cierre, el PDF se descarga automáticamente y el estado del corte cambia a "Cerrado"

---

### TASK-F028 · Implementar historial de cortes con filtro por rango de fechas
Crear `src/modules/corte-caja/CorteCajaHistorial.jsx` que cargue cortes de `GET /api/corte-caja` con filtros `?desde=` y `?hasta=`. Tabla con: fecha, responsable, total sistema, monto contado, diferencia (roja si negativa, verde si positiva o cero) y estado.

**Terminada cuando:**
- **Given** que el administrador selecciona rango "01/06/2026 – 30/06/2026" y hace clic en Buscar
- **When** llegan los datos de la API
- **Then** la tabla muestra solo los cortes de junio; las diferencias negativas aparecen en rojo y las iguales o positivas en verde

---

## BLOQUE 7 — Manejo de errores y estados de carga

### TASK-F029 · Implementar estados de carga en todos los módulos
En cada módulo que cargue datos de la API, mostrar un spinner o texto "Cargando…" mientras `cargando === true`, y ocultarlo cuando llegan los datos o el error.

**Terminada cuando:**
- **Given** que el backend tarda más de 500 ms en responder
- **When** el usuario navega a cualquier pantalla de listado
- **Then** aparece un indicador de carga visible; cuando llegan los datos, el indicador desaparece y la tabla se muestra

---

### TASK-F030 · Implementar captura de errores de API con toast en todos los módulos
En todos los bloques `try/catch` de llamadas a la API, capturar el error y llamar a `notifyError(err.message)`. El mensaje debe ser el texto exacto que devuelve el backend en `{ success: false, error: "..." }`.

**Terminada cuando:**
- **Given** que el backend devuelve `{ success: false, error: "Stock insuficiente para este producto" }`
- **When** el cajero intenta confirmar la venta
- **Then** aparece un toast rojo con el texto exacto "Stock insuficiente para este producto" y la página no se rompe ni muestra error en consola

---

### TASK-F031 · Implementar pantalla de acceso denegado
Crear `src/pages/SinAcceso.jsx` que muestre "No tienes permisos para esta sección" y un botón "Volver a Ventas". El `ProtectedRoute` debe redirigir a esta pantalla cuando el rol del usuario no está en la lista de roles permitidos de la ruta.

**Terminada cuando:**
- **Given** que un cajero autenticado escribe `/corte-caja` directamente en la barra de URL
- **When** el `ProtectedRoute` evalúa su rol
- **Then** se muestra la pantalla de acceso denegado con el mensaje y el botón; nunca se muestra el contenido del módulo

---

## BLOQUE 8 — Verificación final

### TASK-F032 · Verificar flujo completo de venta de extremo a extremo
Recorrer el flujo completo con el backend corriendo: buscar producto por código → agregar al carrito → cambiar cantidad → cobrar en efectivo → ver modal de confirmación → descargar ticket PDF → iniciar nueva venta.

**Terminada cuando:**
- **Given** que el backend está corriendo con datos reales en Supabase
- **When** se completa el flujo completo sin errores
- **Then** la venta queda registrada en la base de datos, el stock del producto disminuye exactamente en la cantidad vendida y el PDF del ticket se descarga y es legible

---

### TASK-F033 · Verificar redirección automática al expirar la sesión
Confirmar que al expirar el token (o al borrarlo manualmente de `localStorage`), el interceptor de axios redirige a `/login` en la siguiente llamada a la API.

**Terminada cuando:**
- **Given** que el usuario está en la pantalla de ventas con una sesión activa
- **When** se elimina `pos_token` de `localStorage` y se hace cualquier acción que llame a la API
- **Then** el navegador redirige a `/login` automáticamente sin mostrar errores en pantalla

---

### TASK-F034 · Verificar que el layout es operable a 1280×720
Confirmar que todas las pantallas son utilizables en resolución 1280×720 (mínimo de monitor de caja) sin scroll horizontal ni elementos cortados o superpuestos.

**Terminada cuando:**
- **Given** que el navegador está configurado a 1280 px de ancho y 720 px de alto
- **When** el cajero opera la pantalla de nueva venta con el carrito visible
- **Then** el buscador, el carrito y el panel de cobro son visibles y operables sin scroll horizontal

---

## Resumen de tareas por bloque

| Bloque | Tareas | Total |
|---|---|---|
| 1 · Inicialización | TASK-F001 a TASK-F006 | 6 |
| 2 · Layout y navegación | TASK-F007 a TASK-F009 | 3 |
| 3 · Productos | TASK-F010 a TASK-F013 | 4 |
| 4 · Ventas / Carrito | TASK-F014 a TASK-F021 | 8 |
| 5 · Inventario | TASK-F022 a TASK-F024 | 3 |
| 6 · Corte de Caja | TASK-F025 a TASK-F028 | 4 |
| 7 · Errores y carga | TASK-F029 a TASK-F031 | 3 |
| 8 · Verificación final | TASK-F032 a TASK-F034 | 3 |
| **Total** | | **34** |

---

## Trazabilidad HU → TASK

| Historia de Usuario | Tareas que la implementan |
|---|---|
| HU-001 · Registrar producto | TASK-F012 |
| HU-002 · Editar producto | TASK-F013 |
| HU-003 · Buscar producto | TASK-F010, TASK-F011 |
| HU-004 · Registrar venta | TASK-F014, TASK-F015, TASK-F016, TASK-F017, TASK-F019 |
| HU-005 · Aplicar descuento | TASK-F018 |
| HU-006 · Cancelar / devolver | TASK-F021 |
| HU-007 · Consultar inventario | TASK-F022 |
| HU-008 · Entrada de mercancía | TASK-F023 |
| HU-009 · Alerta stock mínimo | TASK-F024 |
| HU-010 · Corte de caja | TASK-F025, TASK-F026, TASK-F027 |
| HU-011 · Historial de cortes | TASK-F028 |
| HU-012 · Control de acceso por roles | TASK-F005, TASK-F007, TASK-F031 |
