import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout }      from '../components/layout/AppLayout.jsx';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { Login }          from '../modules/auth/Login.jsx';
import { VentaNueva }     from '../modules/ventas/VentaNueva.jsx';
import { VentaHistorial } from '../modules/ventas/VentaHistorial.jsx';
import { ProductosList }  from '../modules/productos/ProductosList.jsx';
import { InventarioPanel }from '../modules/inventario/InventarioPanel.jsx';
import { CorteCajaForm }  from '../modules/corte-caja/CorteCajaForm.jsx';
import { SinAcceso }      from '../pages/SinAcceso.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas dentro del layout con Sidebar */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/ventas" replace />} />

          {/* Cajero y administrador */}
          <Route path="ventas"           element={<VentaNueva />} />
          <Route path="ventas/historial" element={<VentaHistorial />} />
          <Route path="productos"        element={<ProductosList />} />

          {/* Solo administrador */}
          <Route path="inventario" element={
            <ProtectedRoute roles={['administrador']}><InventarioPanel /></ProtectedRoute>
          } />
          <Route path="corte-caja" element={
            <ProtectedRoute roles={['administrador']}><CorteCajaForm /></ProtectedRoute>
          } />

          <Route path="sin-acceso" element={<SinAcceso />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
