export interface SessionUser {
  uuid: string;
  first_name: string;
  middle_name: string | null;
  photo_url: string | null;
  ci: string;
  email: string;
  role_id: number;
  status: 'active' | 'inactive' | 'baned';
}

export interface SessionRole {
  id: number;
  name: string;
  slug: 'admin' | 'support' | 'seller';
  description: string | null;
}

export interface SessionCompany {
  uuid: string;
  name: string;
  rif: string;
  email: string;
  tenant_id: string;
  domain: string;
  logo_url: string | null;
  user_limit: number;
}

export interface LoginResponse {
  token: string;
  expires_in: string;
  user: SessionUser;
  role: SessionRole;
  company: SessionCompany;
}

export interface Session {
  user: SessionUser;
  role: SessionRole;
  company: SessionCompany;
}
