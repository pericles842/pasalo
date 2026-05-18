import { FormControl } from '@angular/forms';

export interface Company {
  uuid: string;
  name: string;
  logo: string;
  rif: string;
  email: string;
  domain: string;
  user_limits: number;
}

export interface CompanyControls {
  uuid: FormControl<string | null>;
  name: FormControl<string | null>;
  logo: FormControl<string | null>;
  rif: FormControl<string | null>;
  email: FormControl<string | null>;
  domain: FormControl<string | null>;
  user_limits: FormControl<number>;
}
