import { FormControl } from '@angular/forms';
import { OrderStatus } from './status-order';

export interface Order {
  id: string;
  company_id: string;
  user_id: string;
  name_product: string;
  amount: number;
  price: number;
  name_client: string;
  ci_client: number;
  email_client: string;
  reference: string;
  pay_url_token: string;
  status: OrderStatus;
}

export interface OrderFormGroup {
  name_product: FormControl<string>;
  amount: FormControl<number>;
  price: FormControl<number>;
  name_client: FormControl<string>;
  ci_client: FormControl<number>;
  email_client: FormControl<string>;
  pay_url_token: FormControl<string>;
}
