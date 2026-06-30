import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService, Order, OrderItem, Piece, CreateOrderPayload } from '../../services/order.service';
import { ProductService, Product } from '../../services/product.service';
import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss',
})
export class Pedidos implements OnInit {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private clientService = inject(ClientService);

  // Core signals for state management
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  errorMessage = signal<string | null>(null);

  // Binding variable for product selector in modal
  selectedProductId = '';

  // Order creation FormGroup (guaranteeing non-nullable value strings)
  orderForm = this.fb.nonNullable.group({
    clientName: ['', [Validators.required]],
    number: [''],
    products: this.fb.array([], [Validators.required])
  });

  ngOnInit(): void {
    this.loadData();
  }

  // Load both orders, clients, and catalog products
  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    // Fetch products first for the selector
    this.productService.getProducts().subscribe({
      next: (prods) => {
        this.products.set(prods);
        
        // Fetch clients
        this.clientService.getClients().subscribe({
          next: (cls) => {
            this.clients.set(cls);
            
            // Fetch orders
            this.orderService.getOrders().subscribe({
              next: (ords) => {
                this.orders.set(ords);
                this.isLoading.set(false);
              },
              error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.error || 'Error al cargar los pedidos.');
              }
            });
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(err.error?.error || 'Error al cargar los clientes.');
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al cargar el catálogo de productos.');
      }
    });
  }

  // Getters for the FormArray
  get itemsFormArray(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  // Add selected product to the FormArray
  addProductToOrder(): void {
    if (!this.selectedProductId) return;
    
    const product = this.products().find(p => p.id === this.selectedProductId);
    if (!product) return;

    const group = this.fb.group({
      pid: [product.id, [Validators.required]],
      name: [product.name],
      tipo: [product.tipo],
      color: [''],
      letras: [''],
      nombre: [''],
      logo: [''],
      enTapa: [true],
      enBase: [false],
      nota: ['']
    });

    this.itemsFormArray.push(group);
    this.selectedProductId = ''; // Reset selector
  }

  // Remove a product from the FormArray
  removeOrderItem(index: number): void {
    this.itemsFormArray.removeAt(index);
  }

  openModal(): void {
    this.errorMessage.set(null);
    this.orderForm.reset({
      clientName: '',
      number: '',
      products: []
    });
    this.itemsFormArray.clear();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  // Toggle completion of a specific piece in a boxed item
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

  // Toggle completion of a simple item without pieces
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

  deleteOrder(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;

    this.orderService.deleteOrder(id).subscribe({
      next: () => {
        this.loadOrdersOnly();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al eliminar el pedido.');
      }
    });
  }

  // Fast reload for orders list updates
  private loadOrdersOnly(): void {
    this.orderService.getOrders().subscribe({
      next: (ords) => {
        this.orders.set(ords);
      },
      error: (err) => {
        console.error('Failed to reload orders list:', err);
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

  // Build tags helper for piece details rendering
  getPieceTags(piece: Piece): string[] {
    const tags: string[] = [];
    if (piece.color) tags.push(piece.color);
    if (piece.letras) tags.push(`Letras: ${piece.letras}`);
    if (piece.nombre) tags.push(piece.nombre);
    if (piece.logo) tags.push(piece.logo);
    return tags;
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos obligatorios del pedido.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { clientName, number, products } = this.orderForm.getRawValue();

    // Map form controls to backend payload structure
    const mappedProducts = (products || []).map((p: any) => {
      if (p.tipo === 'caja') {
        return {
          pid: p.pid,
          color: p.color || undefined,
          letras: p.letras || undefined,
          nombre: p.nombre || undefined,
          logo: p.logo || undefined,
          enTapa: p.enTapa,
          enBase: p.enBase
        };
      } else {
        return {
          pid: p.pid,
          nota: p.nota || undefined
        };
      }
    });

    const payload: CreateOrderPayload = {
      clientName,
      number: number || undefined,
      products: mappedProducts
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al guardar el pedido.');
      }
    });
  }
}
