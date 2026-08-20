export interface AppNotification {
  id: string;
  company_id: string;
  order_id: string;
  seller_id: string;
  seller_name?: string | null;
  buyer_name: string;
  amount: number;
  reference: string | null;
  pay_url_token: string;
  createdAt: string;
}
