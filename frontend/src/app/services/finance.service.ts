import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/finances`;

  getFinancialSummary(): Observable<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.apiUrl}/summary`);
  }
}
