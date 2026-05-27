import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Company } from './interfaces/company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  constructor(
    private http: HttpClient
  ) { }


  createCompany(data: Company, plan_id: number) {
    const COMPANY = { ...data, plan_id };
    return this.http.post(`${environment.host}/company`, COMPANY);
  }
}
