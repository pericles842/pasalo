export interface SessionUser {
  uuid: string;
  first_name: string;
  middle_name: string | null;
  photo_url: string | null;
  ci: string;
  email: string;
  role_id: number;
  status: 'active' | 'inactive' | 'baned';
  /** false en cuentas creadas solo por Google: todavia no tienen contraseña propia */
  has_password: boolean;
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
  domain: string | null;
  logo_url: string | null;
  user_limit: number;
  /** Cuanto dura el link publico de pago antes de expirar (minutos, tope 120) */
  link_expiration_minutes: number;
  /** Con que tasa se convierten los montos a bolivares (comprobantes y link de pago) */
  default_rate_type: 'bcv' | 'eur' | 'promedio';
  /** Que campos del comprador son obligatorios en el paso 1 del link publico de pago */
  required_buyer_fields: string[];
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

/** Datos que Google ya verifico de un correo que todavia no tiene cuenta en Pásalo */
export interface GoogleIdentity {
  email: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

/** Respuesta de POST /auth/google: login normal si ya existe cuenta, o el perfil de Google si hay que registrarse */
export type GoogleAuthResponse =
  | (LoginResponse & { is_new: false })
  | { is_new: true; google: GoogleIdentity };
