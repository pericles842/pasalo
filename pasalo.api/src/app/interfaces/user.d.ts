/** Usuario tal como viaja al frontend y dentro del JWT (sin contraseña) */
export interface userResponse {
  uuid: string;
  first_name: string;
  middle_name: string | null;
  photo_url: string | null;
  ci: string;
  email: string;
  role_id: number;
  status: 'active' | 'inactive' | 'baned';
}

/** Payload del usuario master que se registra junto con la empresa */
export interface masterUserPayload {
  first_name: string;
  middle_name: string | null;
  photo_url?: string | null;
  ci: string;
  email: string;
  password: string;
  password_confirmation: string;
}
