import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialService, Material, MaterialInput } from '../../services/material.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './stock.html',
  styleUrl: './stock.scss'
})
export class Stock implements OnInit {
  private fb = inject(FormBuilder);
  private materialService = inject(MaterialService);

  // Core state tracking using Signals
  materials = signal<Material[]>([]);
  isLoading = signal(false);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedMaterialId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Spool CRUD Reactive Form
  materialForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: ['PLA' as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina' | 'Otro', [Validators.required]],
    totalWeight: [1000, [Validators.required, Validators.min(1)]],
    currentWeight: [1000, [Validators.required, Validators.min(0)]],
    colorHex: ['#2ECC71', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]]
  });

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.materialService.getMaterials().subscribe({
      next: (data) => {
        this.materials.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al cargar el inventario.');
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedMaterialId.set(null);
    this.errorMessage.set(null);
    this.materialForm.reset({
      name: '',
      type: 'PLA',
      totalWeight: 1000,
      currentWeight: 1000,
      colorHex: '#2ECC71'
    });
    this.isModalOpen.set(true);
  }

  openEditModal(material: Material): void {
    this.isEditMode.set(true);
    this.selectedMaterialId.set(material.id);
    this.errorMessage.set(null);
    this.materialForm.patchValue({
      name: material.name,
      type: material.type,
      totalWeight: material.totalWeight,
      currentWeight: material.currentWeight,
      colorHex: material.colorHex
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.materialForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = this.materialForm.getRawValue() as MaterialInput;

    // Validate that currentWeight doesn't exceed totalWeight
    if (payload.currentWeight > payload.totalWeight) {
      this.isLoading.set(false);
      this.errorMessage.set('El peso actual no puede superar el peso total de la bobina.');
      return;
    }

    if (this.isEditMode() && this.selectedMaterialId()) {
      this.materialService.updateMaterial(this.selectedMaterialId()!, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadMaterials();
          this.successMessage.set('Material actualizado correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al actualizar el material.');
        }
      });
    } else {
      this.materialService.createMaterial(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadMaterials();
          this.successMessage.set('Material registrado correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al registrar el material.');
        }
      });
    }
  }

  deleteMaterial(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este material del inventario?')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.materialService.deleteMaterial(id).subscribe({
      next: () => {
        this.loadMaterials();
        this.successMessage.set('Material eliminado correctamente.');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al eliminar el material.');
      }
    });
  }

  onConsume(id: string, inputEl: HTMLInputElement): void {
    const amount = parseFloat(inputEl.value);
    if (isNaN(amount) || amount <= 0) {
      this.errorMessage.set('Por favor, ingresa una cantidad de gramos válida (mayor a 0).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.materialService.consumeMaterial(id, amount).subscribe({
      next: (updatedMaterial) => {
        // Update spool state in local signals instantly without full HTTP reload
        this.materials.update(list => list.map(m => m.id === id ? updatedMaterial : m));
        inputEl.value = ''; // reset consumption input
        this.isLoading.set(false);
        this.successMessage.set(`Se restaron ${amount}g del material "${updatedMaterial.name}".`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al restar gramos del material.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
