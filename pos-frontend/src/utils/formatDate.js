// Formatea timestamp ISO a fecha y hora en español
export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatDateOnly(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short' }).format(new Date(iso));
}
