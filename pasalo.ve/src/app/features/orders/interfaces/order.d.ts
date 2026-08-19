import { FormControl, FormGroup } from '@angular/forms';

export interface OrderStatus {
  id: number;
  name: string;
  slug: 'pendiente' | 'pagado' | 'atrasado';
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
  first_name_client: string;
  last_name_client: string;
  email_client: string;
  ci_client: string;
  phone_client: string;
  address_client: string;
  notes: string | null;
  amount: number;
  status_id: number;
  reference: string | null;
  pay_url_token: string;
  items_count: number;
  createdAt: string;
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
    address: string;
  };
  items: OrderItem[];
  notes: string | null;
}

export interface CreateOrderResponse {
  order: { id: string; amount: number; status_id: number; pay_url_token: string };
  items: OrderItem[];
  pay_url: string;
}
