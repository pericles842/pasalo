import { FormControl, FormGroup } from '@angular/forms';

export interface OrderStatus {
  id: number;
  name: string;
  slug: 'pendiente' | 'pagado' | 'atrasado' | 'rechazado' | 'verificado';
  description: string | null;
}

export interface OrderItem {
  name: string;
  reference: string | null;
  price: number;
}

export interface Order {
  id: string;
  company_id: string;
  user_id: string;
  seller_name?: string | null;
  /** Nulos hasta que el cliente llena el paso 1 del link publico de pago */
  first_name_client: string | null;
  last_name_client: string | null;
  email_client: string | null;
  ci_client: string | null;
  phone_client: string | null;
  address_client: string | null;
  /** Punto exacto marcado en el mapa (precisa o a mano), ademas de address_client */
  lat: number | null;
  lng: number | null;
  notes: string | null;
  amount: number;
  /** Bs fijado por el vendedor al crear la orden (editable), lo ve el comprador */
  bs_amount: number | null;
  status_id: number;
  payment_method_id: number | null;
  payment_method_name?: string | null;
  payment_method_type?: string | null;
  receipt_url: string | null;
  extracted_reference: string | null;
  extracted_amount: number | null;
  extracted_raw_text?: string | null;
  /** El monto extraído del comprobante no coincidía con lo esperado: revisar a mano */
  is_suspicious: boolean;
  /** La imagen subida no tenía pinta de comprobante (muy pocos dígitos reconocidos): se rechazó sola */
  is_invalid_receipt: boolean;
  paid_at: string | null;
  reference: string | null;
  pay_url_token: string;
  /** Null = orden vieja, creada antes de esta funcionalidad: el link no vence */
  expires_at: string | null;
  items_count: number;
  createdAt: string;
}

export interface OrderDetail {
  order: Order;
  items: (OrderItem & { id: string })[];
}

/** Lo que ve el comprador en su link de pago */
export interface PublicOrderSummary {
  order: {
    id: string;
    amount: number;
    /** Bs a pagar: el que el vendedor fijo al crear la orden, o el calculado con la tasa si es una orden vieja */
    bs_amount: number | null;
    status_id: number;
    /** Nulos hasta que el cliente completa el paso 1 (sus datos) */
    first_name_client: string | null;
    last_name_client: string | null;
    /** El backend ya descuenta si esta pagada: pagada nunca cuenta como vencida */
    is_expired: boolean;
    items_count: number;
    seller_name: string | null;
    seller_photo_url: string | null;
    company_name: string | null;
    logo_url: string | null;
    /** Tasa que la empresa eligio para convertir montos a bolivares */
    rate_type: 'bcv' | 'eur' | 'promedio';
    rate_value: number | null;
    /** Que campos del comprador son obligatorios en el paso 1 */
    required_fields: ('first_name' | 'last_name' | 'email' | 'ci' | 'phone' | 'address')[];
  };
  payment_methods: {
    id: number;
    name: string;
    type: string;
    titular: string | null;
    datos: Record<string, string> | string;
  }[];
}

export interface SubmitPaymentResponse {
  message: string;
  extracted_reference: string | null;
}

/** Payload del paso 1 del link publico: el cliente llena sus propios datos. Cuales son obligatorios lo define la empresa */
export interface PublicBuyerPayload {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  ci: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

/** Renglon de producto dentro del formulario de creacion */
export interface OrderItemForm {
  name: FormControl<string | null>;
  reference: FormControl<string | null>;
  price: FormControl<number | null>;
}

export interface BuyerForm {
  first_name: FormControl<string | null>;
  last_name: FormControl<string | null>;
  email: FormControl<string | null>;
  ci: FormControl<string | null>;
  phone: FormControl<string | null>;
  address: FormControl<string | null>;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  notes: string | null;
  /** Bs elegido por el vendedor (editable), opcional */
  bs_amount: number | null;
}

export interface CreateOrderResponse {
  order: { id: string; amount: number; bs_amount: number | null; status_id: number; pay_url_token: string };
  items: OrderItem[];
  pay_url: string;
}
