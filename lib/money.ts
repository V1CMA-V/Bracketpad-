// Monedas admitidas para costos de inscripción (ligas y torneos).
export const currencyOptions = ['MXN', 'USD', 'EUR'] as const

export type Currency = (typeof currencyOptions)[number]

export const currencyLabels: Record<string, string> = {
  MXN: 'Peso mexicano (MXN)',
  USD: 'Dólar (USD)',
  EUR: 'Euro (EUR)',
}

/** Formatea un importe con su moneda, p. ej. 250 + "MXN" → "$250.00". */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
