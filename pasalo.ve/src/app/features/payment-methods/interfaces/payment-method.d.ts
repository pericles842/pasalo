import { FormControl } from '@angular/forms';
import { PlanInterface } from 'src/app/services/http/plan/plan';

export type PaymentMethodType = 'pagomovil' | 'transferencia' | 'billetera_digital';

export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
  titular: string | null;
  url_img: string | null;
  datos: string;
  createdAt: string;
}

export interface CreatePaymentMethodPayload {
  name: string;
  type: PaymentMethodType;
  titular: string | null;
  datos: Record<string, string>;
}

export interface PaymentMethodsPlanUsage {
  used: number;
  limit: number;
  available: number;
}

export interface PaymentMethodsPlan {
  id: number;
  name: string;
  payment_methods_limit: number;
}

export interface PaymentMethodsListResponse {
  methods: PaymentMethod[];
  plan: PaymentMethodsPlan | null;
  usage: PaymentMethodsPlanUsage;
}

export interface CreatePaymentMethodResponse {
  method: PaymentMethod;
  usage: PaymentMethodsPlanUsage;
}

export interface DeletePaymentMethodResponse {
  message: string;
  usage: PaymentMethodsPlanUsage;
}

/**
 * La API de /company/subscription es compartida con la seccion de usuarios:
 * el "usage" que devuelve es de usuarios, no de metodos de pago, por eso no
 * se usa aqui (se refresca el consumo de metodos de pago aparte).
 */
export interface ChangeCompanyPlanResponse {
  plan: PlanInterface;
  usage: { used: number; limit: number; available: number };
}

export interface PaymentMethodForm {
  name: FormControl<string | null>;
  type: FormControl<PaymentMethodType | null>;
  titular: FormControl<string | null>;
  banco: FormControl<string | null>;
  telefono: FormControl<string | null>;
  numero_cuenta: FormControl<string | null>;
  cedula: FormControl<string | null>;
  correo: FormControl<string | null>;
}
