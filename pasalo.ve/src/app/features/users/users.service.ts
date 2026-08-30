import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CompanyUser,
  CompanyUsersResponse,
  CreateCompanyUserPayload,
  PlanUsage,
  Role,
  UpdateCompanyUserPayload,
} from './interfaces/company-user';

@Injectable({ providedIn: 'root' })
export class UsersService {

  private http = inject(HttpClient);

  /**
   * Usuarios de la empresa junto con el plan y su consumo
   *
   * @memberof UsersService
   */
  getCompanyUsers(): Observable<CompanyUsersResponse> {
    return this.http.get<CompanyUsersResponse>(`${environment.host}/company/users`);
  }

  /**
   * Cargos disponibles para asignar
   *
   * @memberof UsersService
   */
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.host}/roles`);
  }

  /**
   * Crea un usuario interno. La API valida el limite del plan.
   *
   * @param {CreateCompanyUserPayload} user
   * @memberof UsersService
   */
  createUser(user: CreateCompanyUserPayload): Observable<any> {
    return this.http.post(`${environment.host}/company/users`, user);
  }

  /**
   * Elimina un usuario interno de la empresa
   *
   * @param {string} uuid
   * @memberof UsersService
   */
  deleteUser(uuid: string): Observable<{ message: string; usage: PlanUsage }> {
    return this.http.delete<{ message: string; usage: PlanUsage }>(`${environment.host}/company/users/${uuid}`);
  }

  /**
   * Edita nombre y cargo de un usuario interno. El correo no se puede cambiar aqui.
   *
   * @memberof UsersService
   */
  updateUser(uuid: string, payload: UpdateCompanyUserPayload): Observable<{ user: CompanyUser; role: Role }> {
    return this.http.put<{ user: CompanyUser; role: Role }>(`${environment.host}/company/users/${uuid}`, payload);
  }
}
