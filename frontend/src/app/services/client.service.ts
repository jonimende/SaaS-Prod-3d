import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientInput {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clients`;

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(client: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  updateClient(id: string, client: ClientInput): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
