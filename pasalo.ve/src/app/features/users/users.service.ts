import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ChangePlanResponse,
  CompanyUsersResponse,
  CreateCompanyUserPayload,
  Role
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
   * Cambia el plan de la empresa para ampliar el cupo de usuarios
   *
   * @param {number} plan_id
   * @memberof UsersService
   */
  changePlan(plan_id: number): Observable<ChangePlanResponse> {
    return this.http.put<ChangePlanResponse>(`${environment.host}/company/subscription`, { plan_id });
  }

  /**
   * Elimina un usuario interno de la empresa
   *
   * @param {string} uuid
   * @memberof UsersService
   */
  deleteUser(uuid: string): Observable<{ message: string; usage: ChangePlanResponse['usage'] }> {
    return this.http.delete<{ message: string; usage: ChangePlanResponse['usage'] }>(`${environment.host}/company/users/${uuid}`);
  }
}
