import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen.html',
  styleUrl: './resumen.scss',
})
export class Resumen implements OnInit {
  private orderService = inject(OrderService);

  // Core signals for state management
  orders = signal<Order[]>([]);
  isLoading = signal(false);

  // Computed signals for summary statistics
  totalOrders = computed(() => this.orders().length);

  completedOrders = computed(() => {
    return this.orders().filter(order => {
      const prog = this.getOrderProgress(order);
      return prog.done === prog.total && prog.total > 0;
    }).length;
  });

  totalUnits = computed(() => {
    let total = 0;
    for (const order of this.orders()) {
      if (!order.items) continue;
      for (const item of order.items) {
        if (item.pieces && item.pieces.length > 0) {
          total += item.pieces.length;
        } else {
          total += 1;
        }
      }
    }
    return total;
  });

  globalProgress = computed(() => {
    let total = 0;
    let done = 0;
    for (const order of this.orders()) {
      if (!order.items) continue;
      for (const item of order.items) {
        if (item.pieces && item.pieces.length > 0) {
          total += item.pieces.length;
          done += item.pieces.filter(p => p.done).length;
        } else {
          total += 1;
          if (item.done) done += 1;
        }
      }
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load orders for summary:', err);
      }
    });
  }

  // Helper to calculate pieces progression for the progress bar
  getOrderProgress(order: Order): { total: number; done: number; percentage: number } {
    let total = 0;
    let done = 0;

    if (order.items) {
      for (const item of order.items) {
        if (item.pieces && item.pieces.length > 0) {
          total += item.pieces.length;
          done += item.pieces.filter(p => p.done).length;
        } else {
          total += 1;
          if (item.done) {
            done += 1;
          }
        }
      }
    }

    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percentage };
  }
}
