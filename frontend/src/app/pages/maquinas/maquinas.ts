import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrinterService, Printer, PrinterInput } from '../../services/printer.service';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './maquinas.html',
  styleUrl: './maquinas.scss'
})
export class MaquinasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private printerService = inject(PrinterService);

  // Core state signals
  printers = signal<Printer[]>([]);
  isLoading = signal(false);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedPrinterId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Spool CRUD Form
  printerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    model: ['', [Validators.required]],
    status: ['Libre' as 'Libre' | 'Imprimiendo' | 'Mantenimiento', [Validators.required]],
    maintenanceNotes: ['']
  });

  ngOnInit(): void {
    this.loadPrinters();
  }

  loadPrinters(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.printerService.getPrinters().subscribe({
      next: (data) => {
        this.printers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al cargar las impresoras.');
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedPrinterId.set(null);
    this.errorMessage.set(null);
    this.printerForm.reset({
      name: '',
      model: '',
      status: 'Libre',
      maintenanceNotes: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(printer: Printer): void {
    this.isEditMode.set(true);
    this.selectedPrinterId.set(printer.id);
    this.errorMessage.set(null);
    this.printerForm.patchValue({
      name: printer.name,
      model: printer.model,
      status: printer.status,
      maintenanceNotes: printer.maintenanceNotes || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.printerForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.printerForm.getRawValue();
    const payload: PrinterInput = {
      name: formValues.name,
      model: formValues.model,
      status: formValues.status,
      maintenanceNotes: formValues.maintenanceNotes || null
    };

    if (this.isEditMode() && this.selectedPrinterId()) {
      this.printerService.updatePrinter(this.selectedPrinterId()!, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadPrinters();
          this.successMessage.set('Impresora actualizada correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al actualizar la impresora.');
        }
      });
    } else {
      this.printerService.createPrinter(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadPrinters();
          this.successMessage.set('Impresora registrada correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al registrar la impresora.');
        }
      });
    }
  }

  deletePrinter(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta impresora de la granja?')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.printerService.deletePrinter(id).subscribe({
      next: () => {
        this.loadPrinters();
        this.successMessage.set('Impresora eliminada correctamente.');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al eliminar la impresora.');
      }
    });
  }

  onStatusChange(id: string, event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const newStatus = selectEl.value as 'Libre' | 'Imprimiendo' | 'Mantenimiento';

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.printerService.updatePrinterStatus(id, newStatus).subscribe({
      next: (updatedPrinter) => {
        // Update local signal state instantly to avoid complete reload
        this.printers.update(list => list.map(p => p.id === id ? updatedPrinter : p));
        this.isLoading.set(false);
        this.successMessage.set(`Estado de "${updatedPrinter.name}" cambiado a ${newStatus}.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Reset dropdown value in template back to current state
        const currentPrinter = this.printers().find(p => p.id === id);
        if (currentPrinter) {
          selectEl.value = currentPrinter.status;
        }
        this.errorMessage.set(err.error?.error || 'Error al actualizar el estado de la impresora.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
