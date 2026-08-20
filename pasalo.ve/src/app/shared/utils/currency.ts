/**
 * Convierte un monto en dólares a bolívares con una tasa dada.
 * Centralizado aca para que el cálculo sea siempre el mismo en toda la app.
 */
export function toBs(amountUsd: number | null | undefined, rate: number | null | undefined): number | null {
  if (!amountUsd || !rate) return null;
  return Math.round(amountUsd * rate * 100) / 100;
}
