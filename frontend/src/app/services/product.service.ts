import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  cost: number;
  tipo: 'caja' | 'otro';
  defaultPieces: string[];
  gcodeUrl?: string;
  stlUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  name: string;
  price: number;
  cost?: number;
  tipo: 'caja' | 'otro';
  defaultPieces: string[];
  gcodeUrl?: string;
  stlUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  createProduct(product: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
