# plan.md — Sistema POS Papelería

## Stack Tecnológico

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4.x
- **Base de datos:** Supabase (PostgreSQL gestionado)
- **ORM / Query builder:** Supabase JS Client v2
- **Autenticación:** Supabase Auth + JWT
- **Generación de PDF:** pdfkit
- **Validación:** zod
- **Variables de entorno:** dotenv

### Frontend
- **Framework:** React 18
- **Bundler:** Vite 5
- **Estilos:** Tailwind CSS
- **Cliente HTTP:** axios
- **Estado global:** Zustand
- **Ruteo:** React Router v6
- **Formularios:** React Hook Form + zod
- **Notificaciones:** react-hot-toast

### Herramientas de desarrollo
- **Gestor de paquetes:** npm
- **Linter:** ESLint
- **Formatter:** Prettier
- **Control de versiones:** Git

---

## Estructura de Carpetas

### Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js          # Cliente Supabase inicializado
│   │   └── env.js               # Validación de variables de entorno
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Verificación de JWT y rol
│   │   ├── error.middleware.js  # Manejador global de errores
│   │   └── validate.middleware.js # Validación de schemas zod
│   ├── modules/
│   │   ├── productos/
│   │   │   ├── productos.routes.js
│   │   │   ├── productos.controller.js
│   │   │   └── productos.service.js
│   │   ├── ventas/
│   │   │   ├── ventas.routes.js
│   │   │   ├── ventas.controller.js
│   │   │   └── ventas.service.js
│   │   ├── inventario/
│   │   │   ├── inventario.routes.js
│   │   │   ├── inventario.controller.js
│   │   │   └── inventario.service.js
│   │   ├── corte-caja/
│   │   │   ├── corte-caja.routes.js
│   │   │   ├── corte-caja.controller.js
│   │   │   └── corte-caja.service.js
│   │   └── usuarios/
│   │       ├── usuarios.routes.js
│   │       ├── usuarios.controller.js
│   │       └── usuarios.service.js
│   ├── utils/
│   │   ├── pdf.generator.js     # Generación de tickets y reportes
│   │   ├── folio.generator.js   # Generación de folios únicos
│   │   └── response.helper.js   # Respuestas HTTP estandarizadas
│   └── app.js                   # Instancia Express y registro de rutas
├── .env
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
└── server.js                    # Entry point — inicia el servidor
```

### Frontend

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── productos.api.js     # Llamadas axios a /api/productos
│   │   ├── ventas.api.js
│   │   ├── inventario.api.js
│   │   ├── corte-caja.api.js
│   │   └── usuarios.api.js
│   ├── components/
│   │   ├── ui/                  # Componentes reutilizables genéricos
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Badge.jsx
│   │   └── layout/
│   │       ├── Sidebar.jsx
│   │       ├── Navbar.jsx
│   │       └── ProtectedRoute.jsx
│   ├── modules/
│   │   ├── productos/
│   │   │   ├── ProductosList.jsx
│   │   │   ├── ProductoForm.jsx
│   │   │   └── ProductoBusqueda.jsx
│   │   ├── ventas/
│   │   │   ├── VentaNueva.jsx
│   │   │   ├── VentaCarrito.jsx
│   │   │   └── VentaHistorial.jsx
│   │   ├── inventario/
│   │   │   ├── InventarioPanel.jsx
│   │   │   ├── EntradaMercancia.jsx
│   │   │   └── AlertasStock.jsx
│   │   ├── corte-caja/
│   │   │   ├── CorteCajaForm.jsx
│   │   │   └── CorteCajaHistorial.jsx
│   │   └── usuarios/
│   │       ├── Login.jsx
│   │       └── UsuariosList.jsx
│   ├── store/
│   │   ├── auth.store.js        # Estado de sesión y rol
│   │   ├── carrito.store.js     # Estado del carrito de venta activo
│   │   └── alertas.store.js     # Alertas de stock
│   ├── hooks/
│   │   ├── useProductos.js
│   │   ├── useVentas.js
│   │   └── useAuth.js
│   ├── utils/
│   │   ├── formatCurrency.js    # Formato $ MXN
│   │   ├── formatDate.js
│   │   └── roles.js             # Constantes de roles y permisos
│   ├── router/
│   │   └── AppRouter.jsx        # Definición de rutas con React Router
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── vite.config.js
└── package.json
```

---

## Convenciones de Nombres

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Carpetas de módulo | kebab-case | `corte-caja/`, `gestion-ventas/` |
| Archivos backend | kebab-case + sufijo de capa | `productos.service.js` |
| Componentes React | PascalCase | `VentaCarrito.jsx` |
| Hooks | camelCase con prefijo `use` | `useProductos.js` |
| Stores Zustand | camelCase con sufijo `.store` | `auth.store.js` |
| Utilidades | camelCase | `formatCurrency.js` |

### Código JavaScript / JSX

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | camelCase | `precioVenta`, `calcularCambio()` |
| Constantes globales | UPPER_SNAKE_CASE | `ROL_CAJERO`, `STOCK_MINIMO_DEFAULT` |
| Componentes React | PascalCase | `ProductoForm` |
| Clases | PascalCase | `FolioGenerator` |
| Rutas API | kebab-case en plural | `/api/productos`, `/api/corte-caja` |

### Base de datos (Supabase / PostgreSQL)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | snake_case en plural | `productos`, `detalle_venta` |
| Columnas | snake_case | `precio_venta`, `stock_actual` |
| Llaves primarias | `id_<tabla>` | `id_producto`, `id_venta` |
| Llaves foráneas | `id_<tabla_referenciada>` | `id_usuario`, `id_corte` |
| Índices | `idx_<tabla>_<columna>` | `idx_productos_nombre` |

### API REST

| Operación | Método | Ruta |
|---|---|---|
| Listar | GET | `/api/productos` |
| Obtener uno | GET | `/api/productos/:id` |
| Crear | POST | `/api/productos` |
| Actualizar | PUT | `/api/productos/:id` |
| Eliminar | DELETE | `/api/productos/:id` |

### Variables de entorno

Todas en UPPER_SNAKE_CASE con prefijo por contexto:

```
# Backend (.env)
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=xxxx
JWT_SECRET=xxxx

# Frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

---

## Notas de Implementación

- El frontend se comunica con el backend vía API REST; no accede directamente a Supabase, excepto para autenticación.
- El backend usa `supabase-js` con la **service key** para operaciones con privilegios elevados (bypass de RLS cuando se requiera).
- Las rutas protegidas verifican el JWT en el middleware `auth.middleware.js` antes de llegar al controlador.
- Los cortes de caja y tickets se generan como PDF en el backend y se sirven como descarga al frontend.
