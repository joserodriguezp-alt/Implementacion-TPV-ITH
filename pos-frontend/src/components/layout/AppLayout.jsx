import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';

// Mapa de rutas a títulos para el header superior
const TITULOS = {
  '/ventas':     'Nueva venta',
  '/productos':  'Catálogo de productos',
  '/inventario': 'Inventario',
  '/corte-caja': 'Corte de caja',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const titulo = TITULOS[pathname] ?? 'POS Papelería';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F4F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-7 shrink-0 shadow-sm">
          <h1 className="text-sm font-semibold text-gray-700">{titulo}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
