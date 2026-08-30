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
  domain: string | null;
  logo?: File | null;
  /** Duracion del link publico de pago, en minutos (1-120) */
  link_expiration_minutes: number;
  /** Con que tasa se convierten los montos a bolivares (comprobantes y link de pago) */
  default_rate_type: 'bcv' | 'eur' | 'promedio';
  /** Que campos del comprador son obligatorios en el paso 1 del link publico de pago */
  required_buyer_fields: string[];
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
    if (payload.domain) form.append('domain', payload.domain);
    if (payload.logo) form.append('logo', payload.logo);
    form.append('link_expiration_minutes', String(payload.link_expiration_minutes));
    form.append('default_rate_type', payload.default_rate_type);
    form.append('required_buyer_fields', JSON.stringify(payload.required_buyer_fields));

    return this.http.put<UpdateCompanyResponse>(`${environment.host}/company`, form);
  }
}
