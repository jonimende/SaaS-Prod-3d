import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order, OrderItem, Piece } from '../../services/order.service';

interface GroupedItem {
  id: string;
  orderId: string;
  clientName: string;
  orderNumber: string | null;
  productName: string;
  done: boolean;
  color: string | null;
  letras: string | null;
  nombre: string | null;
  logo: string | null;
  type: 'pieza' | 'item';
  nota?: string | null;
  gcodeUrl?: string | null;
  stlUrl?: string | null;
}

interface PieceGroup {
  name: string;
  items: GroupedItem[];
}

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lotes.html',
  styleUrl: './lotes.scss',
})
export class Lotes implements OnInit {
  private orderService = inject(OrderService);

  // Core signals for state management
  orders = signal<Order[]>([]);
  activeFilter = signal<string>('todas');
  isLoading = signal(false);

  // Computed signal to group items/pieces from raw orders
  groupedPieces = computed<PieceGroup[]>(() => {
    const map: { [key: string]: GroupedItem[] } = {};

    for (const order of this.orders()) {
      if (!order.items) continue;
      
      for (const item of order.items) {
        if (item.pieces && item.pieces.length > 0) {
          // Box products (grouped by each piece name: Tapa, Base, etc.)
          for (const piece of item.pieces) {
            const name = piece.name;
            if (!map[name]) map[name] = [];
            map[name].push({
              id: piece.id,
              orderId: order.id,
              clientName: order.clientName,
              orderNumber: order.number,
              productName: item.product?.name || 'Caja',
              done: piece.done,
              color: piece.color,
              letras: piece.letras,
              nombre: piece.nombre,
              logo: piece.logo,
              type: 'pieza',
              gcodeUrl: item.product?.gcodeUrl,
              stlUrl: item.product?.stlUrl
            });
          }
        } else {
          // Simple products without pieces (grouped under 'Otros items')
          const name = 'Otros items';
          if (!map[name]) map[name] = [];
          map[name].push({
            id: item.id,
            orderId: order.id,
            clientName: order.clientName,
            orderNumber: order.number,
            productName: item.product?.name || 'Otro',
            done: item.done,
            color: item.colorCaja,
            letras: item.colorLetras,
            nombre: item.nombreGrabado,
            logo: item.logo,
            type: 'item',
            nota: item.nota,
            gcodeUrl: item.product?.gcodeUrl,
            stlUrl: item.product?.stlUrl
          });
        }
      }
    }

    // Convert map to array of groups and sort alphabetically
    const keys = Object.keys(map).sort();
    
    // UI Polish: Place 'Otros items' group at the end
    const otherIndex = keys.indexOf('Otros items');
    if (otherIndex > -1) {
      keys.splice(otherIndex, 1);
      keys.push('Otros items');
    }

    return keys.map(name => ({
      name,
      items: map[name]
    }));
  });

  // Computed list of available filters
  filters = computed<string[]>(() => {
    return ['todas', ...this.groupedPieces().map(g => g.name)];
  });

  // Computed signal to filter the active lot view
  filteredGroups = computed<PieceGroup[]>(() => {
    const filter = this.activeFilter();
    const groups = this.groupedPieces();
    if (filter === 'todas') {
      return groups;
    }
    return groups.filter(g => g.name === filter);
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
        console.error('Failed to load orders for lot grouping:', err);
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  togglePieceStatus(pieceId: string, currentDone: boolean): void {
    this.orderService.updatePieceStatus(pieceId, !currentDone).subscribe({
      next: () => {
        this.loadOrdersOnly();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al actualizar el estado de la pieza.');
      }
    });
  }

  toggleOrderItemStatus(itemId: string, currentDone: boolean): void {
    this.orderService.updateOrderItemStatus(itemId, !currentDone).subscribe({
      next: () => {
        this.loadOrdersOnly();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al actualizar el estado del producto.');
      }
    });
  }

  private loadOrdersOnly(): void {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
      },
      error: (err) => {
        console.error('Failed to reload orders for lot grouping:', err);
      }
    });
  }

  // Helper to retrieve tag strings for details rendering
  getPieceTags(item: GroupedItem): string[] {
    const tags: string[] = [];
    if (item.color) tags.push(item.color);
    if (item.letras) tags.push(`Letras: ${item.letras}`);
    if (item.nombre) tags.push(item.nombre);
    if (item.logo) tags.push(item.logo);
    return tags;
  }

  getCompletedCount(items: GroupedItem[]): number {
    return items.filter(i => i.done).length;
  }
}
