import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionCompany, SessionRole, SessionUser } from '../auth/interfaces/auth';

export interface UpdateProfilePayload {
  first_name: string;
  middle_name: string | null;
  current_password?: string | null;
  new_password?: string | null;
  new_password_confirmation?: string | null;
  photo?: File | null;
}

export interface UpdateProfileResponse {
  user: SessionUser;
  role: SessionRole;
  company: SessionCompany;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private http = inject(HttpClient);

  /**
   * Edita nombre, foto y (opcionalmente) contraseña del usuario que hace la peticion.
   *
   * @memberof ProfileService
   */
  updateProfile(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    const form = new FormData();

    form.append('first_name', payload.first_name);
    if (payload.middle_name) form.append('middle_name', payload.middle_name);

    // current_password solo aplica si ya tenia contraseña (ver has_password en
    // ProfilePage): una cuenta creada por Google la agrega por primera vez sin eso.
    if (payload.new_password && payload.new_password_confirmation) {
      form.append('new_password', payload.new_password);
      form.append('new_password_confirmation', payload.new_password_confirmation);
      if (payload.current_password) form.append('current_password', payload.current_password);
    }

    if (payload.photo) form.append('photo', payload.photo);

    return this.http.put<UpdateProfileResponse>(`${environment.host}/auth/me`, form);
  }
}
