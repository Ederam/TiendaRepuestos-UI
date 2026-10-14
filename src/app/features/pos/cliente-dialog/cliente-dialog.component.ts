/**
 * @fileoverview Modal ágil para creación de clientes en el mostrador.
 * Diseñado con formulario simple de alta velocidad para no detener la venta.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Angular Material
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Core
import { ClienteService } from '../../../core/services/clientes/cliente.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateClienteRequest } from '../../../core/models/cliente.models';

@Component({
  selector: 'app-cliente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './cliente-dialog.component.html',
  styleUrl: './cliente-dialog.component.scss',
})
export class ClienteDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly notify = inject(NotificationService);
  readonly dialogRef = inject(MatDialogRef<ClienteDialogComponent>);
  readonly data = inject<{ documentoInicial?: string }>(MAT_DIALOG_DATA);

  readonly form: FormGroup = this.fb.group({
    documento: [
      this.data?.documentoInicial || '',
      [Validators.required, Validators.maxLength(20)],
    ],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(20)]],
    correo: ['', [Validators.email]],
    direccion: [''],
    esFacturaElectronica: [false],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateClienteRequest = this.form.getRawValue();

    this.clienteService.registrarCliente(payload).subscribe({
      next: (creado) => {
        this.notify.showSuccess(`Cliente "${creado.nombre}" registrado.`);
        this.dialogRef.close(creado);
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
