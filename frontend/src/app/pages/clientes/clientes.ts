import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientService, Client, ClientInput } from '../../services/client.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  // Core state signals
  clients = signal<Client[]>([]);
  isLoading = signal(false);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedClientId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Client CRUD Form
  clientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: [''],
    email: ['', [Validators.email]],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al cargar los clientes.');
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedClientId.set(null);
    this.errorMessage.set(null);
    this.clientForm.reset({
      name: '',
      phone: '',
      email: '',
      notes: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(client: Client): void {
    this.isEditMode.set(true);
    this.selectedClientId.set(client.id);
    this.errorMessage.set(null);
    this.clientForm.patchValue({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.clientForm.getRawValue();
    const payload: ClientInput = {
      name: formValues.name,
      phone: formValues.phone || null,
      email: formValues.email || null,
      notes: formValues.notes || null
    };

    if (this.isEditMode() && this.selectedClientId()) {
      this.clientService.updateClient(this.selectedClientId()!, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadClients();
          this.successMessage.set('Cliente actualizado correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al actualizar el cliente.');
        }
      });
    } else {
      this.clientService.createClient(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadClients();
          this.successMessage.set('Cliente registrado correctamente.');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al registrar al cliente.');
        }
      });
    }
  }

  deleteClient(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Se perderá de tu historial del CRM.')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.clientService.deleteClient(id).subscribe({
      next: () => {
        this.loadClients();
        this.successMessage.set('Cliente eliminado correctamente.');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al eliminar el cliente.');
      }
    });
  }
}
