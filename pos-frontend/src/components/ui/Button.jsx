// Botón reutilizable — lógica idéntica, estilos mejorados
const V = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm focus-visible:ring-brand-500',
  danger:  'bg-red-600  hover:bg-red-700  text-white shadow-sm focus-visible:ring-red-500',
  ghost:   'bg-transparent hover:bg-gray-100 text-gray-600 focus-visible:ring-gray-400',
  outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500',
  warning: 'bg-amber-500  hover:bg-amber-600  text-white shadow-sm focus-visible:ring-amber-400',
};
const S = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2   text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export function Button({
  children, variante = 'primary', size = 'md',
  cargando = false, disabled = false,
  type = 'button', className = '', onClick, ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || cargando}
      className={[
        'inline-flex items-center justify-center rounded-lg font-semibold',
        'transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        V[variante] ?? V.primary,
        S[size]     ?? S.md,
        className,
      ].join(' ')}
      {...props}
    >
      {cargando && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
