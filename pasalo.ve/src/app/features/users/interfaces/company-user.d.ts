import { FormControl } from '@angular/forms';
import { PlanInterface } from 'src/app/services/http/plan/plan';

export interface CompanyUser {
  uuid: string;
  first_name: string;
  middle_name: string | null;
  email: string;
  photo_url: string | null;
  status: 'active' | 'inactive' | 'baned';
  /** Casos de exito / ventas realizadas del usuario */
  sales_made: number;
  createdAt: string;
  role_id: number;
  role_name: string;
  role_slug: 'admin' | 'support' | 'seller';
}

export interface Role {
  id: number;
  name: string;
  slug: 'admin' | 'support' | 'seller';
  description: string | null;
}

/** Consumo de usuarios contra el limite que da el plan */
export interface PlanUsage {
  used: number;
  limit: number;
  available: number;
}

export interface CompanyUsersResponse {
  users: CompanyUser[];
  plan: PlanInterface;
  usage: PlanUsage;
}

export interface CreateCompanyUserPayload {
  role_id: number | null;
  first_name: string | null;
  middle_name: string | null;
  email: string | null;
  password: string | null;
  password_confirmation: string | null;
}

export interface CreateUserForm {
  role_id: FormControl<number | null>;
  first_name: FormControl<string | null>;
  middle_name: FormControl<string | null>;
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  password_confirmation: FormControl<string | null>;
}
