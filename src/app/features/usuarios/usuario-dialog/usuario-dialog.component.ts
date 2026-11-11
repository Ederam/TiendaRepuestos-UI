/**
 * @fileoverview Modal para que el Administrador cree usuarios (Vendedor / Administrador)
 * mediante POST /api/Auth/registro.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '@core/services/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { RegistroUsuarioRequest } from '@core/models/auth.models';

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './usuario-dialog.component.html',
  styleUrl: './usuario-dialog.component.scss',
})
export class UsuarioDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<UsuarioDialogComponent>);

  readonly mostrarPassword = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);

  readonly roles: readonly { valor: 1 | 2; etiqueta: string }[] = [
    { valor: 1, etiqueta: 'Vendedor' },
    { valor: 2, etiqueta: 'Administrador' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: [1 as 1 | 2, [Validators.required]],
  });

  alternarPassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }

  onCrear(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: RegistroUsuarioRequest = {
      nombreCompleto: raw.nombreCompleto.trim(),
      email: raw.email.trim().toLowerCase(),
      password: raw.password,
      rol: raw.rol,
    };

    this.guardando.set(true);
    this.authService.registrarUsuario(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.showSuccess(
          `Usuario "${payload.nombreCompleto}" creado como ${payload.rol === 2 ? 'Administrador' : 'Vendedor'}.`,
        );
        this.dialogRef.close(true);
      },
      error: () => {
        // El interceptor global (RFC 7807) ya notifica el detalle del error
        this.guardando.set(false);
      },
    });
  }
}

