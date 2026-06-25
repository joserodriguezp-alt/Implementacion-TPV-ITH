# Manual de Usuario
# Sistema de Punto de Venta — Papelería

**Versión:** 1.0 · Junio 2026
**Dirigido a:** Cajeros y administradores sin conocimientos técnicos

---

## Antes de empezar

Este manual explica cómo realizar las operaciones del día a día en el sistema de punto de venta. No necesitas saber de computadoras más allá de usar un navegador web (como Chrome).

Para usar el sistema solo necesitas:

- Una computadora o tablet con internet
- Tu correo y contraseña que te proporcionó el administrador

---

## Contenido

1. [Cómo entrar al sistema](#1-cómo-entrar-al-sistema)
2. [La pantalla principal](#2-la-pantalla-principal)
3. [Cómo buscar un producto](#3-cómo-buscar-un-producto)
4. [Cómo registrar una venta](#4-cómo-registrar-una-venta)
5. [Cómo aplicar un descuento](#5-cómo-aplicar-un-descuento)
6. [Cómo consultar el corte de caja](#6-cómo-consultar-el-corte-de-caja)
7. [Preguntas frecuentes](#7-preguntas-frecuentes)

---

## 1. Cómo entrar al sistema

1. Abre el navegador (Chrome, Edge o Firefox).
2. Ve a la dirección que te dio el administrador. Se ve así:
   ```
   http://192.168.1.100:3000
   ```
3. Escribe tu **correo electrónico** y tu **contraseña**.
4. Haz clic en **Entrar al sistema**.

> 💡 Si olvidaste tu contraseña, avisa al administrador — él puede restablecerla.

---

## 2. La pantalla principal

Cuando entras, verás una barra de menú en el lado izquierdo con las secciones disponibles según tu rol:

| Sección | Quién la ve |
|---|---|
| **Ventas** | Cajeros y administradores |
| **Productos** | Cajeros y administradores |
| **Inventario** | Solo administradores |
| **Corte de caja** | Solo administradores |

En la parte superior de la pantalla verás la fecha de hoy y tu nombre de usuario. Para **cerrar sesión**, haz clic en el ícono de salida junto a tu nombre en la parte inferior del menú.

---

## 3. Cómo buscar un producto

Puedes buscar productos de dos formas: con el **escáner de código de barras** o escribiendo el **nombre** del producto.

### Opción A — Con escáner de código de barras

1. Haz clic en el campo de búsqueda que dice **"Buscar producto"**.
2. Escanea el código de barras del producto con la pistola lectora.
3. El producto aparece automáticamente en el carrito.

### Opción B — Escribiendo el nombre

1. Haz clic en el campo de búsqueda que dice **"Buscar producto"**.
2. Escribe al menos **3 letras** del nombre del producto (por ejemplo: `cua` para buscar cuadernos).
3. Selecciona el producto de la lista que aparece.
4. El producto se agrega al carrito.

### ¿Qué pasa si el producto no aparece?

- El sistema muestra el mensaje **"Producto no encontrado"**.
- Verifica que escribiste bien el nombre o el código.
- Si el producto existe pero no aparece, avisa al administrador para que lo registre.

### ¿Qué pasa si el producto no tiene existencias?

- El sistema muestra una alerta de **"Sin existencia"**.
- No se puede agregar al carrito hasta que el administrador registre una entrada de mercancía.

---

## 4. Cómo registrar una venta

### Paso 1 — Agregar productos al carrito

1. Busca cada producto (ver sección 3).
2. Cada producto que agregas aparece en el **carrito de venta** del lado derecho de la pantalla.
3. Para cada producto puedes:
   - Aumentar la cantidad con el botón **＋**
   - Disminuir la cantidad con el botón **−**
   - Eliminarlo haciendo clic en **eliminar** (aparece al pasar el cursor sobre el producto)

### Paso 2 — Revisar el total

En la parte inferior del carrito verás:

| Concepto | Descripción |
|---|---|
| **Subtotal** | Suma de todos los productos sin descuento |
| **Descuento** | Monto descontado (si aplica) |
| **Total** | Lo que el cliente debe pagar |

### Paso 3 — Elegir el método de pago

Selecciona uno de los tres botones:

- **Efectivo** — el cliente paga con billetes o monedas
- **Tarjeta** — pago con tarjeta de débito o crédito
- **Mixto** — parte en efectivo y parte en tarjeta

### Paso 4 — Ingresar el monto recibido (solo si es efectivo)

1. Si elegiste **Efectivo**, aparecerá un campo llamado **"Monto recibido"**.
2. Escribe la cantidad que te entregó el cliente (por ejemplo: `200`).
3. El sistema calcula automáticamente el **cambio** a devolver.

> ⚠️ El botón **Cobrar** no se activa hasta que el monto recibido sea igual o mayor al total.

### Paso 5 — Cobrar

1. Haz clic en el botón **Cobrar**.
2. El sistema registra la venta y muestra una pantalla de confirmación con:
   - El **folio** de la venta (ejemplo: `VTA-20260624-0012`)
   - El **total** cobrado
   - El **cambio** a entregar al cliente (si pagó en efectivo)
3. Entrega el cambio al cliente.
4. Para descargar el **ticket en PDF**, busca la venta en el historial y usa el botón de ticket.
5. Haz clic en **Nueva venta** para atender al siguiente cliente.

---

## 5. Cómo aplicar un descuento

Solo puedes aplicar descuentos **antes** de cobrar.

1. Con productos en el carrito, haz clic en el botón **% Desc.** en la parte inferior del carrito.
2. Escribe el porcentaje de descuento (por ejemplo: `10` para 10%).
3. Haz clic en **Aplicar descuento**.
4. El total se actualiza automáticamente.

### Descuentos mayores al 20%

Si el descuento que escribes es mayor al 20%, el sistema te pedirá el **ID del administrador** antes de aplicarlo.

1. Escribe el porcentaje (por ejemplo: `25`).
2. Aparece un campo adicional: **"ID del administrador"**.
3. El administrador debe escribir su número de usuario en ese campo.
4. Haz clic en **Aplicar descuento**.

> 💡 Si no tienes al administrador disponible, reduce el descuento a 20% o menos.

---

## 6. Cómo consultar el corte de caja

> 🔒 Esta sección es **solo para administradores**.

El corte de caja se hace al **inicio y al final del turno** para llevar el control del dinero del día.

### 6.1 Abrir el corte del día

Esto se hace **una sola vez al inicio de cada día**.

1. En el menú izquierdo, haz clic en **Corte de caja**.
2. Haz clic en el botón **Abrir corte**.
3. El sistema registra la hora de apertura y queda listo para el día.

> ⚠️ Solo se puede abrir un corte por día. Si alguien ya lo abrió, verás el corte del día activo.

### 6.2 Cerrar el corte al final del día

1. En el menú izquierdo, haz clic en **Corte de caja**.
2. Haz clic en el corte del día (debe decir **abierto**).
3. Cuenta físicamente el dinero que hay en la caja.
4. Escribe esa cantidad en el campo **"Monto contado físicamente"**.
5. Si quieres, escribe una nota en **"Observaciones"** (por ejemplo: *"Cierre de turno matutino"*).
6. Haz clic en **Cerrar corte**.

El sistema descarga automáticamente un **PDF con el reporte del día** que incluye:

| Dato | Descripción |
|---|---|
| **Total ventas del sistema** | Suma de todas las ventas completadas |
| **Total en efectivo** | Ventas cobradas en efectivo |
| **Total en tarjeta** | Ventas cobradas con tarjeta |
| **Total devoluciones** | Monto de artículos devueltos |
| **Monto contado físico** | Lo que contaste en la caja |
| **Diferencia** | Faltante (−) o sobrante (+) respecto al sistema |

### 6.3 Qué hacer si hay diferencia

- **Diferencia en cero** ✅ — todo cuadra, no hay nada que hacer.
- **Faltante (número negativo)** — el efectivo contado es menor al del sistema. Revisa si falta dar algún cambio o si ocurrió algún error.
- **Sobrante (número positivo)** — el efectivo contado es mayor al del sistema. Puede haber un cobro de más. Revisa las ventas del día.

En cualquier caso, agrega una nota en **Observaciones** explicando lo que pasó antes de cerrar el corte.

### 6.4 Consultar cortes anteriores

1. En el menú izquierdo, haz clic en **Corte de caja**.
2. Verás la lista de todos los cortes con su fecha y estado.
3. Puedes filtrar por fecha usando los campos **Desde** y **Hasta**.
4. Haz clic en cualquier corte para ver el detalle y las ventas del día.

---

## 7. Preguntas frecuentes

**¿Qué hago si me equivoqué en una venta?**
Avisa al administrador. Solo él puede cancelar una venta desde el historial de ventas. El sistema devuelve las existencias al inventario automáticamente.

**¿Puedo agregar el mismo producto dos veces al carrito?**
No es necesario. Usa el botón **＋** en el carrito para aumentar la cantidad del producto ya agregado.

**¿Qué pasa si la pantalla se queda en blanco o el sistema no responde?**
Recarga la página con la tecla **F5**. Si el problema persiste, avisa al administrador.

**¿El sistema guarda mi trabajo si cierro el navegador por error?**
Las ventas que ya se cobraron sí quedan guardadas. El carrito que tenías en proceso se pierde — tendrás que agregar los productos de nuevo.

**¿Puedo usar el sistema desde mi celular?**
Sí, el sistema funciona en el navegador del celular, aunque es más cómodo usarlo en una computadora o tablet.

**¿Cómo sé si un producto tiene poco stock?**
En la sección **Inventario** (solo administradores) los productos aparecen con una etiqueta de color:
- 🟢 **Normal** — stock suficiente
- 🟡 **Bajo** — está por agotarse
- 🔴 **Agotado** — sin existencias

---

*Para soporte técnico, comunícate con el administrador del sistema.*
