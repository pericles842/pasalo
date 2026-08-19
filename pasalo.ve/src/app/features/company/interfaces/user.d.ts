import { Company } from './company';
import { FormControl } from '@angular/forms';

export interface UserCompany {
  uuid?: string | null;
  first_name: string | null;
  middle_name: string | null;
  photo_url: string | null;
  ci: string | null;
  email: string | null;
  password: string | null;
  password_confirmation: string | null;
}

export interface UserCompanyForm {
  uuid?: FormControl<string | null>;
  first_name: FormControl<string | null>;
  middle_name: FormControl<string | null>;
  photo_url: FormControl<string | null>;
  ci: FormControl<string | null>;
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  password_confirmation: FormControl<string | null>;
}

/** Cuerpo que espera el endpoint POST /company */
export interface RegisterCompanyPayload {
  company: Company;
  user: UserCompany;
  plan_id: number;
}
