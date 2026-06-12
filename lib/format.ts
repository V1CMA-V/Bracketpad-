/** Formatea cantidades grandes de forma compacta: 11420 → "11k", 612 → "612". */
export function compact(n: number): string {
  if (n < 1000) return String(n)
  const thousands = n / 1000
  const rounded =
    thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10
  return `${rounded}k`.replace('.', ',')
}
