/**
 * Ciclo de facturación de un plan (suscripción de Pásalo o plan de publicidad).
 * El precio anual no vive en la base de datos: se deriva del precio mensual
 * aplicando un descuento fijo, para que ajustar el porcentaje sea un solo lugar.
 */
export type BillingCycle = 'monthly' | 'annual';

/** Descuento del plan anual: 20% sobre los 12 meses. */
export const ANNUAL_DISCOUNT = 0.20;

export const CYCLE_PERIOD_LABEL: Record<BillingCycle, string> = {
  monthly: 'mes',
  annual: 'año',
};

/** Precio total del año con el descuento aplicado, redondeado al dólar. */
export function annualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
}

/** Cuánto sale "por mes" pagando anual (para el comparativo con el mensual). */
export function annualMonthlyEquivalent(monthlyPrice: number): number {
  return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT) * 100) / 100;
}

/** Lo que se ahorra al año pagando anual en vez de 12 meses sueltos. */
export function annualSavings(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * ANNUAL_DISCOUNT);
}

/** Precio a cobrar según el ciclo elegido (mensual = tal cual, anual = con descuento). */
export function priceForCycle(monthlyPrice: number, cycle: BillingCycle): number {
  return cycle === 'annual' ? annualPrice(monthlyPrice) : monthlyPrice;
}
