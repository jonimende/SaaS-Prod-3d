import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Modern state tracking with signals
  isLoginMode = signal(true);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  // Form Group initialization
  authForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode(): void {
    this.isLoginMode.update(mode => !mode);
    this.errorMessage.set(null);
    
    // Toggle validator requirements dynamically based on authentication context
    const nameControl = this.authForm.get('name');
    if (this.isLoginMode()) {
      nameControl?.clearValidators();
    } else {
      nameControl?.setValidators([Validators.required]);
    }
    nameControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.errorMessage.set('Por favor, completa los campos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.authForm.getRawValue();

    if (this.isLoginMode()) {
      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/pedidos']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.error || 'Error de conexión con el servidor.';
          this.errorMessage.set(msg);
        }
      });
    } else {
      this.authService.register({ name, email, password }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/pedidos']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.error || 'Error al registrar el usuario.';
          this.errorMessage.set(msg);
        }
      });
    }
  }
}
