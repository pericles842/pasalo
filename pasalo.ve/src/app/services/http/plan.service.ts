import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlanService {

  constructor(private http: HttpClient) { }

  getFullPlan() {
    return this.http.get(`${environment.host}/plans`);
  }
}
