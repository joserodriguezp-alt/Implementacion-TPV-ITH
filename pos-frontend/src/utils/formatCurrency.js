// Formatea un número como moneda MXN → "$1,234.50"
export function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}
