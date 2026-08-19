import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Company } from './interfaces/company';
import { RegisterCompanyPayload, UserCompany } from './interfaces/user';

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
}
