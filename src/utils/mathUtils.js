export function sumAmounts(items, key = 'amount') {
  return items.reduce((acc, item) => acc + (item[key] || 0), 0);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function calculatePercentage(part, total) {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function normalizeSubscriptionAmount(amount, frequency) {
  // frequency: 'diario', 'semanal', 'quincenal', 'mensual', 'anual'
  const map = {
    diario: 30,
    semanal: 4,
    quincenal: 2,
    mensual: 1,
    anual: 1 / 12,
  };
  const factor = map[frequency] || 1;
  return amount * factor;
}
