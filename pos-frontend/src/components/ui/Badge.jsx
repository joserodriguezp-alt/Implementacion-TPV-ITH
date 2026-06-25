const E = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50   text-amber-700   border-amber-200',
  danger:  'bg-red-50     text-red-700     border-red-200',
  info:    'bg-blue-50    text-blue-700    border-blue-200',
  default: 'bg-gray-100   text-gray-600    border-gray-200',
};

export function Badge({ children, variante = 'default', className = '' }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full',
      'text-[11px] font-semibold uppercase tracking-wide border',
      E[variante] ?? E.default,
      className,
    ].join(' ')}>
      {children}
    </span>
  );
}
