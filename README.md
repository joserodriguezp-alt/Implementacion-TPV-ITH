# 🛒 POS Papelería

Sistema de punto de venta web para gestión de ventas, inventario y cortes de caja. Desarrollado como proyecto integrador para el curso **"De la idea al sistema: Desarrollo de Software Asistido por IA"** — Instituto Tecnológico de Hermosillo (ITH / TecNM).

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Correr en desarrollo](#correr-en-desarrollo)
- [Documentación de la API](#documentación-de-la-api)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Roles y permisos](#roles-y-permisos)
- [Scripts disponibles](#scripts-disponibles)
- [Convenciones del proyecto](#convenciones-del-proyecto)

---

## Descripción

El sistema POS permite a cajeros y administradores operar las funciones comerciales de una papelería desde el navegador:

| Módulo | Funcionalidad |
|---|---|
| **Productos** | Catálogo, búsqueda por código de barras, altas y edición |
| **Ventas** | Carrito, cobro en efectivo/tarjeta/mixto, descuentos, tickets PDF |
| **Inventario** | Niveles de stock, alertas de mínimos, entradas de mercancía |
| **Corte de caja** | Apertura, cierre con conteo físico, reporte PDF, historial |
| **Usuarios** | Roles cajero / administrador, autenticación JWT |

---

## Tecnologías

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Framework HTTP |
| Supabase JS | v2 | Cliente de base de datos |
| PostgreSQL | 14+ | Base de datos (gestionada por Supabase) |
| JSON Web Token | — | Autenticación stateless |
| Zod | — | Validación de schemas en rutas |
| PDFKit | — | Generación de tickets y reportes |
| swagger-ui-express | 5.x | Documentación interactiva de la API |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | Framework de UI |
| Vite | 5 | Bundler y servidor de desarrollo |
| Tailwind CSS | 3 | Estilos utilitarios |
| Zustand | — | Estado global (carrito, sesión, alertas) |
| React Router | v6 | Ruteo del SPA |
| React Hook Form + Zod | — | Formularios con validación |
| Axios | — | Cliente HTTP |
| react-hot-toast | — | Notificaciones |

---

## Requisitos previos

- **Node.js 20 LTS** — [descargar](https://nodejs.org/)
- **npm 9+** (incluido con Node.js)
- **Cuenta de Supabase** con un proyecto creado — [supabase.com](https://supabase.com/)
- **Git**

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/pos-papeleria.git
cd pos-papeleria
```

### 2. Instalar dependencias del backend

```bash
cd pos-backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../pos-frontend
npm install
```

### 4. Crear la base de datos

En el **SQL Editor de Supabase**, ejecuta el script completo:

```
pos-backend/src/docs/schema.sql
```

Esto crea todas las tablas, índices, el usuario administrador por defecto y las categorías iniciales.

> ⚠️ Después de ejecutar el script, cambia la contraseña del administrador desde la pantalla de login.

---

## Variables de entorno

### Backend — `pos-backend/.env`

Crea el archivo copiando el ejemplo:

```bash
cp pos-backend/.env.example pos-backend/.env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service Role Key (con privilegios completos) | `eyJhbGci...` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Mínimo 32 caracteres aleatorios |

```env
# pos-backend/.env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

JWT_SECRET=cambia_esto_por_una_clave_segura_de_al_menos_32_caracteres
```

> **Dónde encontrar las claves de Supabase:**
> Dashboard → Settings → API → `URL` y `service_role` (no uses `anon`).

### Frontend — `pos-frontend/.env`

```bash
cp pos-frontend/.env.example pos-frontend/.env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

```env
# pos-frontend/.env
VITE_API_URL=http://localhost:3000
```

---

## Correr en desarrollo

Abre **dos terminales** — una para cada parte del sistema.

### Terminal 1 — Backend

```bash
cd pos-backend
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

### Terminal 2 — Frontend

```bash
cd pos-frontend
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### Usuario por defecto

| Campo | Valor |
|---|---|
| Email | `admin@papeleria.local` |
| Contraseña | Definida al ejecutar el script SQL |
| Rol | `administrador` |

---

## Documentación de la API

Con el backend corriendo, la documentación Swagger interactiva está disponible en:

```
http://localhost:3000/api/docs
```

**Para autenticarte en la UI:**

1. Ejecuta `POST /api/auth/login` con tus credenciales
2. Copia el valor de `data.token`
3. Haz clic en el botón **Authorize** 🔒
4. Pega el token en el campo `bearerAuth`

El spec en formato JSON está disponible en `http://localhost:3000/api/docs.json`.

---

## Estructura de carpetas

```
pos-papeleria/
│
├── pos-backend/                        # API REST — Node.js / Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js             # Cliente Supabase inicializado
│   │   │   └── env.js                  # Validación de variables de entorno
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js      # Verificación de JWT y rol
│   │   │   ├── error.middleware.js     # Manejador global de errores
│   │   │   └── validate.middleware.js  # Validación de schemas Zod
│   │   │
│   │   ├── modules/                    # Un directorio por módulo de negocio
│   │   │   ├── productos/
│   │   │   │   ├── productos.routes.js
│   │   │   │   └── productos.service.js
│   │   │   ├── ventas/
│   │   │   │   ├── ventas.routes.js
│   │   │   │   └── ventas.service.js
│   │   │   ├── inventario/
│   │   │   │   ├── inventario.routes.js
│   │   │   │   └── inventario.service.js
│   │   │   ├── corte-caja/
│   │   │   │   ├── corte-caja.routes.js
│   │   │   │   └── corte-caja.service.js
│   │   │   └── usuarios/
│   │   │       ├── usuarios.routes.js
│   │   │       └── usuarios.service.js
│   │   │
│   │   ├── docs/
│   │   │   ├── swagger.js              # Integración swagger-ui-express
│   │   │   └── swagger.yaml            # Spec OpenAPI 3.0 completo
│   │   │
│   │   ├── utils/
│   │   │   ├── pdf.generator.js        # Tickets y reportes PDF (PDFKit)
│   │   │   ├── folio.generator.js      # Folios únicos por venta
│   │   │   └── response.helper.js      # Respuestas HTTP estandarizadas
│   │   │
│   │   └── app.js                      # Instancia Express + rutas + Swagger
│   │
│   ├── __tests__/                      # Pruebas Jest (integración)
│   │   ├── ventas.service.test.js
│   │   └── corte-caja.service.test.js
│   │
│   ├── .env                            # Variables locales (no se sube a Git)
│   ├── .env.example                    # Plantilla de variables
│   ├── babel.config.js                 # Transpilación ESM → CJS para Jest
│   ├── jest.config.js                  # Configuración de Jest 29
│   ├── package.json
│   └── server.js                       # Entry point
│
└── pos-frontend/                       # SPA — React 18 / Vite
    ├── src/
    │   ├── api/                        # Clientes Axios por módulo
    │   │   ├── auth.api.js
    │   │   ├── productos.api.js
    │   │   ├── ventas.api.js
    │   │   ├── inventario.api.js
    │   │   └── corte-caja.api.js
    │   │
    │   ├── components/
    │   │   ├── ui/                     # Componentes genéricos reutilizables
    │   │   │   ├── Button.jsx
    │   │   │   ├── Input.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   ├── Badge.jsx
    │   │   │   └── Spinner.jsx
    │   │   └── layout/
    │   │       ├── Sidebar.jsx         # Navegación lateral con roles
    │   │       └── AppLayout.jsx       # Shell principal con header
    │   │
    │   ├── modules/                    # Páginas por módulo de negocio
    │   │   ├── auth/
    │   │   │   └── Login.jsx
    │   │   ├── productos/
    │   │   │   ├── ProductosList.jsx
    │   │   │   ├── ProductoForm.jsx
    │   │   │   └── ProductoBusqueda.jsx
    │   │   ├── ventas/
    │   │   │   ├── VentaNueva.jsx
    │   │   │   ├── VentaCarrito.jsx
    │   │   │   ├── VentaHistorial.jsx
    │   │   │   └── ModalConfirmacion.jsx
    │   │   ├── inventario/
    │   │   │   └── InventarioPanel.jsx
    │   │   └── corte-caja/
    │   │       └── CorteCajaForm.jsx
    │   │
    │   ├── store/                      # Estado global Zustand
    │   │   ├── auth.store.js           # Sesión y token JWT
    │   │   ├── carrito.store.js        # Carrito de venta activo
    │   │   └── alertas.store.js        # Alertas de stock mínimo
    │   │
    │   ├── hooks/
    │   │   └── useAuth.js
    │   │
    │   ├── utils/
    │   │   ├── formatCurrency.js       # Formato $ MXN
    │   │   └── notify.js               # Helpers de react-hot-toast
    │   │
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css                   # Tailwind + tokens de diseño
    │
    ├── .env
    ├── .env.example
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Roles y permisos

| Acción | Cajero | Administrador |
|---|:---:|:---:|
| Iniciar sesión | ✅ | ✅ |
| Registrar venta | ✅ | ✅ |
| Buscar productos | ✅ | ✅ |
| Descargar ticket PDF | ✅ | ✅ |
| Aplicar descuento ≤ 20% | ✅ | ✅ |
| Aplicar descuento > 20% | ❌ | ✅ |
| Crear / editar productos | ❌ | ✅ |
| Registrar entrada de mercancía | ❌ | ✅ |
| Cancelar venta | ❌ | ✅ |
| Abrir / cerrar corte de caja | ❌ | ✅ |
| Ver historial de cortes | ❌ | ✅ |

---

## Scripts disponibles

### Backend

```bash
npm run dev        # Servidor con nodemon (recarga automática)
npm start          # Servidor en producción
npm test           # Pruebas Jest
npm run test:watch # Pruebas en modo observador
npm run test:coverage # Cobertura de pruebas
```

### Frontend

```bash
npm run dev        # Servidor Vite en http://localhost:5173
npm run build      # Build de producción en /dist
npm run preview    # Vista previa del build
```

---

## Convenciones del proyecto

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | camelCase en inglés | `crearVenta()`, `stockActual` |
| Comentarios | Español | `// Verificar stock antes de insertar` |
| Archivos backend | kebab-case | `corte-caja.service.js` |
| Componentes React | PascalCase | `VentaCarrito.jsx` |
| Rutas API | kebab-case en plural | `/api/corte-caja` |
| Tablas DB | snake_case en plural | `detalle_venta`, `movimientos_inventario` |
| PKs | `id_<tabla>` | `id_producto`, `id_venta` |
| Variables de entorno | UPPER_SNAKE_CASE | `JWT_SECRET`, `SUPABASE_URL` |

### Formato de respuesta de la API

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Mensaje descriptivo" }
```

---

> Proyecto desarrollado con asistencia de IA (Claude) como caso de estudio del curso ITH 2026.
