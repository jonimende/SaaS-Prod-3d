import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Printer {
  id: string;
  userId: string;
  name: string;
  model: string;
  status: 'Libre' | 'Imprimiendo' | 'Mantenimiento';
  maintenanceNotes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrinterInput {
  name: string;
  model: string;
  status: 'Libre' | 'Imprimiendo' | 'Mantenimiento';
  maintenanceNotes: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/printers`;

  getPrinters(): Observable<Printer[]> {
    return this.http.get<Printer[]>(this.apiUrl);
  }

  getPrinterById(id: string): Observable<Printer> {
    return this.http.get<Printer>(`${this.apiUrl}/${id}`);
  }

  createPrinter(printer: PrinterInput): Observable<Printer> {
    return this.http.post<Printer>(this.apiUrl, printer);
  }

  updatePrinter(id: string, printer: PrinterInput): Observable<Printer> {
    return this.http.put<Printer>(`${this.apiUrl}/${id}`, printer);
  }

  deletePrinter(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  updatePrinterStatus(id: string, status: 'Libre' | 'Imprimiendo' | 'Mantenimiento'): Observable<Printer> {
    return this.http.put<Printer>(`${this.apiUrl}/${id}/status`, { status });
  }
}
