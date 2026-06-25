import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';
import { useAlertasStore } from '../../store/alertas.store.js';
import { useAuth } from '../../hooks/useAuth.js';

const NAV = [
  { to: '/ventas',     label: 'Ventas',         roles: ['cajero','administrador'], icono: IcoVentas     },
  { to: '/productos',  label: 'Productos',       roles: ['cajero','administrador'], icono: IcoProductos  },
  { to: '/inventario', label: 'Inventario',      roles: ['administrador'],          icono: IcoInventario },
  { to: '/corte-caja', label: 'Corte de caja',   roles: ['administrador'],          icono: IcoCaja       },
];

/* Íconos SVG inline — sin dependencia externa */
function IcoVentas()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 5M7 13l-1.4 5m0 0h10m-10 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm11 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/></svg>; }
function IcoProductos()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function IcoInventario() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function IcoCaja()       { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>; }

export function Sidebar() {
  const usuario        = useAuthStore((s) => s.usuario);
  const alertas        = useAlertasStore((s) => s.alertas);
  const { cerrarSesion } = useAuth();
  const visibles       = NAV.filter((n) => n.roles.includes(usuario?.rol));
  const iniciales      = usuario?.nombre?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ?? '??';

  return (
    <aside className="w-60 bg-sidebar flex flex-col h-screen sticky top-0 shrink-0 shadow-sidebar">
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {/* Ícono de marca */}
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 5m11.4 0H7"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-text leading-none mb-0.5">Sistema POS</p>
            <p className="text-sidebar-text-active font-bold text-sm leading-none">Papelería</p>
          </div>
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {/* Sección label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text px-3 mb-2 mt-1">Menú</p>

        {visibles.map((n) => {
          const Icono = n.icono;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
                 ${isActive
                   ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                   : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'}`
              }
            >
              {/* Barra activa izquierda */}
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-full" />}
                  <Icono />
                  <span>{n.label}</span>
                  {n.to === '/inventario' && alertas.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {alertas.length}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Panel de sesión ── */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-hover transition-colors">
          {/* Avatar con iniciales */}
          <div className="w-8 h-8 rounded-full bg-brand-600/80 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{iniciales}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-text-active truncate leading-tight">{usuario?.nombre}</p>
            <p className="text-[10px] text-sidebar-text capitalize leading-tight mt-0.5">{usuario?.rol}</p>
          </div>
          {/* Botón cerrar sesión */}
          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="text-sidebar-text hover:text-red-400 transition-colors shrink-0 p-1 rounded"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
