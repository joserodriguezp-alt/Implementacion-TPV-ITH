import { montarSwagger } from './docs/swagger.js';
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { usuariosRouter } from './modules/usuarios/usuarios.routes.js';
import { productosRouter } from './modules/productos/productos.routes.js';
import { ventasRouter } from './modules/ventas/ventas.routes.js';
import { inventarioRouter } from './modules/inventario/inventario.routes.js';
import { corteCajaRouter } from './modules/corte-caja/corte-caja.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Rutas de autenticación (login vive dentro del router de usuarios)
app.use('/api', usuariosRouter);           // POST /api/auth/login
app.use('/api/usuarios', usuariosRouter);  // GET  /api/usuarios

// Módulos principales
app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/corte-caja', corteCajaRouter);

montarSwagger(app) 

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Manejador global de errores (debe ir al final)
app.use(errorMiddleware);

export default app;
