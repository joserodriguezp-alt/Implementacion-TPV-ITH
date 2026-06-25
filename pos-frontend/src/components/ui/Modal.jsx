import { useEffect } from 'react';

export function Modal({ abierto, titulo, onClose, children, ancho = 'max-w-md' }) {
  useEffect(() => {
    if (!abierto) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${ancho} max-h-[90vh] overflow-y-auto border border-gray-100`}>
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {/* Contenido */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
