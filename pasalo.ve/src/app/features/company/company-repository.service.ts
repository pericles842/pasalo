import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionCompany, SessionRole, SessionUser } from '../auth/interfaces/auth';
import { Company } from './interfaces/company';
import { RegisterCompanyPayload, UserCompany } from './interfaces/user';

export interface UpdateCompanyPayload {
  name: string;
  rif: string | null;
  domain: string;
  logo?: File | null;
}

export interface UpdateCompanyResponse {
  user: SessionUser;
  role: SessionRole;
  company: SessionCompany;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Registra la empresa junto con su usuario master y la suscripción al plan.
   * El límite de usuarios internos lo define el plan, no el formulario.
   *
   * @param {Company} company
   * @param {UserCompany} user
   * @param {number} plan_id
   * @memberof CompanyService
   */
  createCompany(company: Company, user: UserCompany, plan_id: number): Observable<any> {
    const PAYLOAD: RegisterCompanyPayload = { company, user, plan_id };
    return this.http.post(`${environment.host}/company`, PAYLOAD);
  }

  /**
   * Edita nombre, RIF, dominio y logo de la empresa. Solo el administrador.
   *
   * @param {UpdateCompanyPayload} payload
   * @memberof CompanyService
   */
  updateCompany(payload: UpdateCompanyPayload): Observable<UpdateCompanyResponse> {
    const form = new FormData();

    form.append('name', payload.name);
    if (payload.rif) form.append('rif', payload.rif);
    form.append('domain', payload.domain);
    if (payload.logo) form.append('logo', payload.logo);

    return this.http.put<UpdateCompanyResponse>(`${environment.host}/company`, form);
  }
}
