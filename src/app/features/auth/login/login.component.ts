/**
 * @fileoverview Componente de inicio de sesión de TiendaRepuestos-UI.
 * Implementa Reactive Forms, Angular Material, Signals para estado local y consumo de AuthService.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Core
import { AuthService } from '../../../core/services/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ROLES } from '../../../core/constants/roles.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  /** Signal para controlar el estado de carga visual en el botón de submit */
  readonly isLoading = signal<boolean>(false);

  /** Signal para conmutar la visibilidad de la contraseña en el input */
  readonly hidePassword = signal<boolean>(true);

  /** Formulario reactivo tipado con validaciones estrictas */
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /**
   * Alterna la visibilidad del campo de texto de la contraseña.
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  /**
   * Procesa el envío del formulario, invoca la API y gestiona el flujo post-login.
   */
  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.notify.showSuccess(`¡Bienvenido, ${response.nombreCompleto}!`);

        // Comprobar si venía redirigido por un Guard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        // Redirección por defecto según el rol asignado
        if (response.rol === ROLES.ADMIN) {
          this.router.navigate(['/inventario']);
        } else {
          this.router.navigate(['/pos']);
        }
      },
      error: () => {
        // Los mensajes de error ya los emite centralizadamente el ErrorInterceptor
        this.isLoading.set(false);
      },
    });
  }

  loginComoVendedor(): void {
    // Si queremos simular login de vendedor
    this.loginForm.patchValue({ email: 'vendedor@macrolatas.com', password: 'Password123*' });
    this.onSubmit();
  }
}
