export interface UserCompany {
  uuid: string;
  first_name: string;
  middle_name: string;
  photo_url: string;
  ci: string;
  email: string;
  password: string;
  charge: 'support' | 'seller';
  status: 'active' | 'inactive' | 'baned';
}


export interface UserCompanyForm {
  uuid?: FormControl<string>;
  first_name: FormControl<string>;
  middle_name: FormControl<string>;
  photo_url: FormControl<string>;
  ci: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  charge: FormControl<'support' | 'seller'>;
  status: FormControl<'active' | 'inactive' | 'baned'>;
}
