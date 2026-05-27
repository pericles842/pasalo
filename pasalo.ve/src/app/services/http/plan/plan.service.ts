import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlanInterface } from './plan';


@Injectable({
  providedIn: 'root',
})
export class PlanService {


  constructor(private http: HttpClient) { }

  /**
   *Plan interface for caompany
   *
   * @return {*}  {Observable<PlanInterface[]>}
   * @memberof PlanService
   */
  getFullPlan(): Observable<PlanInterface[]> {
    return this.http.get<PlanInterface[]>(`${environment.host}/plans`);
  }
}
