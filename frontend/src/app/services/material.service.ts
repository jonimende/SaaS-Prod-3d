import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Material {
  id: string;
  userId: string;
  name: string;
  type: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina' | 'Otro';
  totalWeight: number; // in grams
  currentWeight: number; // in grams
  colorHex: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialInput {
  name: string;
  type: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina' | 'Otro';
  totalWeight: number;
  currentWeight: number;
  colorHex: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/materials`;

  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(this.apiUrl);
  }

  getMaterialById(id: string): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`);
  }

  createMaterial(material: MaterialInput): Observable<Material> {
    return this.http.post<Material>(this.apiUrl, material);
  }

  updateMaterial(id: string, material: MaterialInput): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/${id}`, material);
  }

  deleteMaterial(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  consumeMaterial(id: string, amount: number): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/${id}/consume`, { amount });
  }
}
