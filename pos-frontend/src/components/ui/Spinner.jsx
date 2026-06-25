export function Spinner({ texto = 'Cargando…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <div className="w-9 h-9 border-[3px] border-blue-100 border-t-brand-600 rounded-full animate-spin" />
      <span className="text-sm font-medium">{texto}</span>
    </div>
  );
}
