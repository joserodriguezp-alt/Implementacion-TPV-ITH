# POS Papelería — Backend

API REST para sistema de punto de venta, construida con Node.js, Express y Supabase.

## Requisitos

- Node.js 20 LTS o superior
- Cuenta en [Supabase](https://supabase.com) con proyecto creado
- Base de datos inicializada con `schema.sql`

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase y JWT_SECRET

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Iniciar en producción
npm start
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `SUPABASE_URL` | URL de tu proyecto en Supabase |
| `SUPABASE_SERVICE_KEY` | Service key (Settings > API en Supabase) |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 16 caracteres) |
| `JWT_EXPIRES_IN` | Duración del token (default: 8h) |

## Endpoints disponibles

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/api/auth/login` | Autenticación | Público |
| GET | `/api/usuarios` | Listar usuarios | Admin |
| GET | `/api/productos` | Listar productos | Autenticado |
| GET | `/api/inventario` | Ver inventario | Admin |
| POST | `/api/ventas` | Registrar venta | Cajero/Admin |
| POST | `/api/corte-caja` | Abrir corte | Admin |
| GET | `/health` | Estado del servidor | Público |

## Estructura del proyecto

```
src/
├── config/          # Supabase y validación de entorno
├── middlewares/     # Auth, validación y errores
├── modules/         # Rutas por módulo de negocio
└── utils/           # Helpers: respuestas, PDF, folios
```

## Convenciones (skill-ith-backend)

- Variables y funciones en inglés (camelCase)
- Comentarios en español
- Archivos en inglés, minúsculas, con guión
- Respuestas: `{ success: true, data }` o `{ success: false, error }`
- Siempre try/catch — nunca exponer errores internos
