import { FormControl } from '@angular/forms';

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
