export interface SubscriptionPlanSummary {
  id: number;
  name: string;
  price: number;
}

export interface SubscriptionStatus {
  plan: SubscriptionPlanSummary;
  /** Plan pedido pero todavía no verificado, si hay uno en curso */
  pending_plan: SubscriptionPlanSummary | null;
  status_id: number;
  status_name: string;
  /** null = no vence (plan gratuito) */
  expires_at: string | null;
  /** null si no hay fecha de vencimiento */
  days_remaining: number | null;
}

export interface ChangePlanActiveResponse {
  status: 'active';
  plan: SubscriptionPlanSummary;
  usage: { used: number; limit: number; available: number };
}

export interface ChangePlanPendingResponse {
  status: 'pending_verification';
  plan: SubscriptionPlanSummary;
  amount_usd: number;
  /** null si no se pudo leer la tasa de cambio en ese momento */
  amount_bs: number | null;
}

export type ChangePlanResult = ChangePlanActiveResponse | ChangePlanPendingResponse;
