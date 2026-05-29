import { FormControl } from '@angular/forms';

export interface Company {
  uuid?: string | null;
  name: string | null;
  logo: string | null;
  rif: string | null;
  domain: string | null;
  user_limits: number;
}

export interface CompanyControls {
  uuid?: FormControl<string | null>;
  name: FormControl<string | null>;
  logo: FormControl<string | null>;
  rif: FormControl<string | null>;
  domain: FormControl<string | null>;
  user_limits: FormControl<number>;
}
