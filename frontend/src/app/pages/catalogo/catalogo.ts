import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService, Product, ProductInput } from '../../services/product.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  // Core signals for state management
  products = signal<Product[]>([]);
  isLoading = signal(false);
  isEditMode = signal(false);
  selectedProductId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Derived signals to automatically segment products
  cajas = computed(() => this.products().filter(p => p.tipo === 'caja'));
  otros = computed(() => this.products().filter(p => p.tipo === 'otro'));

  // Reactive Form definition
  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    tipo: ['caja' as 'caja' | 'otro', [Validators.required]],
    pieces: ['Tapa, Base, Traba, Centro'], // Pre-loaded default pieces for ammunition boxes
    gcodeUrl: [''],
    stlUrl: ['']
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al cargar el catálogo.');
      }
    });
  }

  // Pre-load default pieces when toggling types
  onTipoChange(): void {
    const tipo = this.productForm.get('tipo')?.value;
    const piecesControl = this.productForm.get('pieces');
    if (tipo === 'caja') {
      piecesControl?.setValue('Tapa, Base, Traba, Centro');
    } else {
      piecesControl?.setValue('');
    }
  }

  editProduct(product: Product): void {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.id);
    this.errorMessage.set(null);

    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      tipo: product.tipo,
      pieces: product.defaultPieces ? product.defaultPieces.join(', ') : '',
      gcodeUrl: product.gcodeUrl || '',
      stlUrl: product.stlUrl || ''
    });
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.errorMessage.set(null);
    this.productForm.reset({
      name: '',
      price: 0,
      tipo: 'caja',
      pieces: 'Tapa, Base, Traba, Centro',
      gcodeUrl: '',
      stlUrl: ''
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, price, tipo, pieces, gcodeUrl, stlUrl } = this.productForm.getRawValue();

    // Parse comma-separated pieces text string into a clean string array
    const defaultPieces = pieces
      ? pieces.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: ProductInput = {
      name,
      price: price || 0,
      tipo,
      defaultPieces,
      gcodeUrl: gcodeUrl || undefined,
      stlUrl: stlUrl || undefined
    };

    if (this.isEditMode() && this.selectedProductId()) {
      this.productService.updateProduct(this.selectedProductId()!, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al actualizar el producto.');
        }
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al agregar el producto al catálogo.');
        }
      });
    }
  }

  deleteProduct(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al eliminar el producto.');
      }
    });
  }
}
