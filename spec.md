# Especificación de Requerimientos
# Sistema de Punto de Venta — Papelería

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Estado:** Borrador para revisión  

---

## 1. Descripción General del Sistema

El sistema de Punto de Venta (POS) para papelería es una aplicación de escritorio/web que permite gestionar de forma integral las operaciones comerciales del negocio: registro y control de productos, procesamiento de ventas, administración del inventario y generación de cortes de caja. El sistema está diseñado para ser operado por cajeros y administradores con distintos niveles de acceso.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Cajero** | Realiza ventas, consulta productos, genera tickets |
| **Administrador** | Gestiona productos, inventario, usuarios y reportes |
| **Sistema** | Ejecuta procesos automáticos: alertas de stock, cierres programados |

---

## 3. Módulos del Sistema

1. Gestión de Productos  
2. Gestión de Ventas  
3. Control de Inventario  
4. Corte de Caja  
5. Reportes y Estadísticas  
6. Gestión de Usuarios y Accesos  

---

## 4. Historias de Usuario y Criterios de Aceptación

---

### MÓDULO 1 — GESTIÓN DE PRODUCTOS

---

#### HU-001 · Registrar nuevo producto

**Como** administrador,  
**quiero** registrar nuevos productos en el catálogo,  
**para** que estén disponibles para su venta e inventario.

**Criterios de aceptación:**

**Escenario 1 — Registro exitoso**  
- **Given** que el administrador está en la pantalla de alta de productos  
- **When** ingresa nombre, código de barras, categoría, precio de compra, precio de venta y stock inicial, y confirma el registro  
- **Then** el sistema guarda el producto, muestra un mensaje de confirmación y el producto aparece en el catálogo

**Escenario 2 — Código de barras duplicado**  
- **Given** que el administrador intenta registrar un producto  
- **When** ingresa un código de barras que ya existe en el sistema  
- **Then** el sistema muestra un error indicando que el código ya está registrado y no permite guardar el duplicado

**Escenario 3 — Campos obligatorios vacíos**  
- **Given** que el administrador está en el formulario de registro  
- **When** intenta guardar sin completar uno o más campos obligatorios (nombre, precio de venta, código)  
- **Then** el sistema resalta los campos vacíos y muestra un mensaje de validación sin guardar el registro

---

#### HU-002 · Editar producto existente

**Como** administrador,  
**quiero** editar la información de un producto ya registrado,  
**para** mantener el catálogo actualizado ante cambios de precio o descripción.

**Criterios de aceptación:**

**Escenario 1 — Edición exitosa**  
- **Given** que el administrador busca y selecciona un producto del catálogo  
- **When** modifica uno o más campos y confirma los cambios  
- **Then** el sistema actualiza el registro, registra la fecha y usuario que realizó el cambio, y muestra confirmación

**Escenario 2 — Precio de venta menor al costo**  
- **Given** que el administrador edita el precio de un producto  
- **When** ingresa un precio de venta menor al precio de compra  
- **Then** el sistema muestra una advertencia pero permite guardar el cambio si el administrador confirma explícitamente

---

#### HU-003 · Buscar producto por código o nombre

**Como** cajero,  
**quiero** buscar productos por código de barras o nombre,  
**para** agregarlos rápidamente a una venta.

**Criterios de aceptación:**

**Escenario 1 — Búsqueda por código de barras (escáner)**  
- **Given** que el cajero está en la pantalla de nueva venta  
- **When** escanea o ingresa manualmente un código de barras válido  
- **Then** el sistema agrega automáticamente el producto a la lista de venta con precio y nombre

**Escenario 2 — Búsqueda por nombre parcial**  
- **Given** que el cajero escribe al menos 3 caracteres del nombre de un producto  
- **When** el sistema ejecuta la búsqueda  
- **Then** se muestra una lista de coincidencias con nombre, precio y stock disponible

**Escenario 3 — Producto no encontrado**  
- **Given** que el cajero ingresa un código o nombre que no existe  
- **When** ejecuta la búsqueda  
- **Then** el sistema muestra el mensaje "Producto no encontrado" sin interrumpir la operación de venta

---

### MÓDULO 2 — GESTIÓN DE VENTAS

---

#### HU-004 · Registrar una venta

**Como** cajero,  
**quiero** registrar una venta con uno o más productos,  
**para** cobrar al cliente y actualizar el inventario.

**Criterios de aceptación:**

**Escenario 1 — Venta completada con éxito**  
- **Given** que el cajero ha agregado al menos un producto al carrito de venta  
- **When** selecciona el método de pago (efectivo, tarjeta u otro), ingresa el monto y confirma  
- **Then** el sistema registra la venta, descuenta las cantidades del inventario, genera el folio de venta y muestra el cambio a entregar

**Escenario 2 — Monto de pago insuficiente en efectivo**  
- **Given** que el cajero intenta completar una venta en efectivo  
- **When** el monto ingresado es menor al total de la venta  
- **Then** el sistema muestra el faltante y no permite finalizar la venta hasta completar el monto

**Escenario 3 — Producto con stock en cero**  
- **Given** que el cajero intenta agregar un producto al carrito  
- **When** el stock de ese producto es 0  
- **Then** el sistema muestra una alerta de "Sin existencia" y no agrega el producto al carrito

---

#### HU-005 · Aplicar descuento a una venta

**Como** cajero,  
**quiero** aplicar un descuento porcentual o en monto fijo a una venta,  
**para** respetar promociones o acuerdos con el cliente.

**Criterios de aceptación:**

**Escenario 1 — Descuento porcentual válido**  
- **Given** que el cajero tiene una venta activa  
- **When** ingresa un porcentaje de descuento entre 1% y 100% y lo aplica  
- **Then** el sistema recalcula el total con el descuento y muestra el monto descontado de forma visible

**Escenario 2 — Descuento requiere autorización**  
- **Given** que el cajero intenta aplicar un descuento mayor al 20%  
- **When** confirma el descuento  
- **Then** el sistema solicita la contraseña o PIN del administrador antes de aplicarlo

---

#### HU-006 · Cancelar o devolver una venta

**Como** administrador,  
**quiero** cancelar una venta registrada o procesar una devolución,  
**para** corregir errores o atender devoluciones de clientes.

**Criterios de aceptación:**

**Escenario 1 — Cancelación el mismo día**  
- **Given** que el administrador localiza una venta del día en curso  
- **When** selecciona la opción de cancelar e ingresa el motivo  
- **Then** el sistema anula la venta, devuelve las cantidades al inventario y registra el evento con usuario, hora y motivo

**Escenario 2 — Devolución parcial**  
- **Given** que un cliente regresa un artículo de una venta anterior  
- **When** el administrador selecciona los artículos a devolver de la venta original  
- **Then** el sistema reintegra solo esos artículos al inventario, genera una nota de crédito y actualiza el reporte de caja

---

### MÓDULO 3 — CONTROL DE INVENTARIO

---

#### HU-007 · Consultar niveles de inventario

**Como** administrador,  
**quiero** consultar el stock actual de todos los productos,  
**para** conocer el estado del inventario en tiempo real.

**Criterios de aceptación:**

**Escenario 1 — Vista general del inventario**  
- **Given** que el administrador accede al módulo de inventario  
- **When** abre la pantalla principal  
- **Then** el sistema muestra una tabla con todos los productos, su stock actual, stock mínimo y estado (normal / bajo / agotado)

**Escenario 2 — Filtro por estado**  
- **Given** que el administrador está en la pantalla de inventario  
- **When** filtra por "stock bajo"  
- **Then** el sistema muestra únicamente los productos cuyo stock actual está por debajo del stock mínimo configurado

---

#### HU-008 · Registrar entrada de mercancía

**Como** administrador,  
**quiero** registrar entradas de producto al inventario,  
**para** reflejar las compras realizadas al proveedor.

**Criterios de aceptación:**

**Escenario 1 — Entrada registrada correctamente**  
- **Given** que el administrador selecciona un producto y registra una entrada  
- **When** ingresa la cantidad recibida y confirma  
- **Then** el sistema suma la cantidad al stock existente, registra la fecha, usuario y cantidad de la entrada

**Escenario 2 — Cantidad de entrada inválida**  
- **Given** que el administrador intenta registrar una entrada  
- **When** ingresa una cantidad igual a 0 o negativa  
- **Then** el sistema muestra un error de validación y no registra el movimiento

---

#### HU-009 · Alerta de stock mínimo

**Como** administrador,  
**quiero** recibir alertas cuando el stock de un producto alcance el mínimo configurado,  
**para** realizar el reabastecimiento a tiempo.

**Criterios de aceptación:**

**Escenario 1 — Alerta al completar una venta**  
- **Given** que una venta descuenta unidades de un producto  
- **When** el stock resultante es igual o menor al stock mínimo del producto  
- **Then** el sistema muestra una notificación de alerta al cajero y registra el evento para el administrador

**Escenario 2 — Panel de alertas activas**  
- **Given** que el administrador ingresa al sistema  
- **When** abre el panel de notificaciones  
- **Then** el sistema muestra la lista de productos con stock bajo o agotado ordenados por urgencia

---

### MÓDULO 4 — CORTE DE CAJA

---

#### HU-010 · Realizar corte de caja

**Como** administrador,  
**quiero** realizar el corte de caja al cierre del día,  
**para** verificar que los ingresos registrados coincidan con el efectivo físico en caja.

**Criterios de aceptación:**

**Escenario 1 — Corte exitoso sin diferencias**  
- **Given** que el administrador inicia el proceso de corte de caja  
- **When** ingresa el monto físico contado en caja y confirma  
- **Then** el sistema calcula la diferencia entre el monto esperado y el contado, muestra el resumen del día (ventas totales, efectivo, tarjeta, devoluciones) y genera el reporte de corte en PDF

**Escenario 2 — Diferencia de caja detectada**  
- **Given** que el administrador ingresa el monto contado  
- **When** existe una diferencia entre el monto del sistema y el físico  
- **Then** el sistema muestra la diferencia (faltante o sobrante) y permite al administrador agregar una observación antes de cerrar el corte

**Escenario 3 — Corte ya realizado**  
- **Given** que ya se realizó el corte del día  
- **When** otro usuario intenta iniciar un segundo corte del mismo período  
- **Then** el sistema muestra que el corte ya fue cerrado y solo permite visualizarlo en modo lectura

---

#### HU-011 · Consultar historial de cortes

**Como** administrador,  
**quiero** consultar los cortes de caja anteriores,  
**para** auditar el comportamiento de ventas e ingresos por período.

**Criterios de aceptación:**

**Escenario 1 — Consulta por rango de fechas**  
- **Given** que el administrador accede al historial de cortes  
- **When** selecciona un rango de fechas  
- **Then** el sistema muestra todos los cortes del período con totales, diferencias y usuario responsable

---

### MÓDULO 5 — GESTIÓN DE USUARIOS

---

#### HU-012 · Control de acceso por roles

**Como** administrador,  
**quiero** que cada usuario solo acceda a las funciones de su rol,  
**para** garantizar la seguridad y trazabilidad de las operaciones.

**Criterios de aceptación:**

**Escenario 1 — Cajero intenta acceder a función restringida**  
- **Given** que un cajero ha iniciado sesión en el sistema  
- **When** intenta acceder al módulo de administración de productos o corte de caja  
- **Then** el sistema deniega el acceso y muestra el mensaje "No tiene permisos para esta acción"

**Escenario 2 — Sesión inactiva**  
- **Given** que un usuario inició sesión y no ha realizado ninguna acción  
- **When** transcurren 15 minutos de inactividad  
- **Then** el sistema cierra la sesión automáticamente y solicita autenticación nuevamente

---

## 5. Restricciones Técnicas

### 5.1 Plataforma y Arquitectura

| Restricción | Detalle |
|---|---|
| **Plataforma objetivo** | Aplicación web con soporte para uso local (sin internet requerido en operación) |
| **Frontend** | React.js |
| **Backend** | Node.js con Express |
| **Base de datos** | SQLite (uso local) o PostgreSQL (si se requiere multiusuario en red) |
| **Generación de reportes** | PDF generado del lado del servidor (librería: pdfkit o similar) |

### 5.2 Seguridad

- Las contraseñas deben almacenarse con hash (bcrypt, mínimo costo 10).
- Las sesiones deben manejarse con tokens JWT con expiración máxima de 8 horas.
- Toda operación crítica (cancelaciones, descuentos altos, cortes) debe registrar usuario, timestamp y motivo.

### 5.3 Rendimiento

- La búsqueda de productos debe responder en menos de 500 ms con un catálogo de hasta 10,000 productos.
- El proceso de cierre de venta no debe tomar más de 2 segundos desde la confirmación hasta el ticket generado.

### 5.4 Disponibilidad e Integridad de Datos

- El sistema debe funcionar offline en la red local sin depender de servicios externos.
- Toda transacción de venta o movimiento de inventario debe ser atómica: si falla algún paso, se revierte completamente.
- Se debe implementar respaldo automático de la base de datos diariamente.

### 5.5 Usabilidad

- La interfaz del módulo de ventas debe ser operable exclusivamente con teclado y escáner (sin uso de ratón obligatorio).
- El sistema debe soportar impresión de tickets en impresoras térmicas de 58 mm y 80 mm.
- El tiempo de entrenamiento de un cajero nuevo no debe superar 2 horas.

### 5.6 Compatibilidad

- Compatible con Windows 10/11 y navegadores modernos (Chrome, Edge, Firefox).
- La impresión de tickets debe funcionar con controladores genéricos ESC/POS.

---

## 6. Resumen de Historias de Usuario

| ID | Historia | Actor | Módulo | Prioridad |
|---|---|---|---|---|
| HU-001 | Registrar nuevo producto | Administrador | Productos | Alta |
| HU-002 | Editar producto existente | Administrador | Productos | Alta |
| HU-003 | Buscar producto por código o nombre | Cajero | Productos | Alta |
| HU-004 | Registrar una venta | Cajero | Ventas | Alta |
| HU-005 | Aplicar descuento a una venta | Cajero | Ventas | Media |
| HU-006 | Cancelar o devolver una venta | Administrador | Ventas | Media |
| HU-007 | Consultar niveles de inventario | Administrador | Inventario | Alta |
| HU-008 | Registrar entrada de mercancía | Administrador | Inventario | Alta |
| HU-009 | Alerta de stock mínimo | Sistema | Inventario | Media |
| HU-010 | Realizar corte de caja | Administrador | Caja | Alta |
| HU-011 | Consultar historial de cortes | Administrador | Caja | Media |
| HU-012 | Control de acceso por roles | Sistema | Usuarios | Alta |

---

*Fin del documento de especificación — v1.0*
