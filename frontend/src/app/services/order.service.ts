import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Piece {
  id: string;
  orderItemId: string;
  name: string;
  done: boolean;
  color: string | null;
  letras: string | null;
  nombre: string | null;
  logo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  colorCaja: string | null;
  colorLetras: string | null;
  nombreGrabado: string | null;
  logo: string | null;
  enTapa: boolean;
  enBase: boolean;
  nota: string | null;
  done: boolean;
  pieces: Piece[];
  product?: {
    id: string;
    name: string;
    price: number;
    tipo: 'caja' | 'otro';
    gcodeUrl?: string | null;
    stlUrl?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  number: string | null;
  clientName: string;
  completed: boolean;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderItemPayload {
  pid: string;
  color?: string;
  letras?: string;
  nombre?: string;
  logo?: string;
  enTapa?: boolean;
  enBase?: boolean;
  nota?: string;
}

export interface CreateOrderPayload {
  number?: string;
  clientName: string;
  products: CreateOrderItemPayload[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, payload);
  }

  deleteOrder(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  updatePieceStatus(pieceId: string, done: boolean): Observable<{ message: string; done: boolean }> {
    return this.http.put<{ message: string; done: boolean }>(`${this.apiUrl}/pieces/${pieceId}`, { done });
  }

  updateOrderItemStatus(itemId: string, done: boolean): Observable<{ message: string; done: boolean }> {
    return this.http.put<{ message: string; done: boolean }>(`${this.apiUrl}/items/${itemId}`, { done });
  }
}
