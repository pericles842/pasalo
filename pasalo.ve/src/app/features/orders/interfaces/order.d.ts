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
  first_name_client: string;
  last_name_client: string;
  email_client: string;
  ci_client: string;
  phone_client: string;
  address_client: string | null;
  notes: string | null;
  amount: number;
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
  paid_at: string | null;
  reference: string | null;
  pay_url_token: string;
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
    status_id: number;
    first_name_client: string;
    last_name_client: string;
    items_count: number;
    seller_name: string | null;
    seller_photo_url: string | null;
    company_name: string | null;
    logo_url: string | null;
  };
  payment_methods: {
    id: number;
    name: string;
    type: string;
    titular: string | null;
    datos: string;
  }[];
}

export interface SubmitPaymentResponse {
  message: string;
  extracted_reference: string | null;
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
  buyer: {
    first_name: string;
    last_name: string;
    email: string;
    ci: string;
    phone: string;
    address: string | null;
  };
  items: OrderItem[];
  notes: string | null;
}

export interface CreateOrderResponse {
  order: { id: string; amount: number; status_id: number; pay_url_token: string };
  items: OrderItem[];
  pay_url: string;
}
