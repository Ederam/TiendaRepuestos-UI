/**
 * @fileoverview Modal para registro rápido de clientes desde el Punto de Venta (POS).
 * Permite capturar Cédula/NIT, Nombre, Teléfono, Correo y la bandera de Factura Electrónica.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

import { ClienteService } from '@core/services/clientes/cliente.service';
import { NotificationService } from '@core/services/notification.service';
import { CreateClienteRequest, Cliente } from '@core/models/cliente.models';

/**
 * Datos transferidos desde el POS al abrir el modal de cliente.
 */
export interface ClienteDialogData {
  /** Documento digitado previamente en el buscador de mostrador */
  documentoInicial?: string;
  /** Nombre o razón social digitado previamente en el formulario */
  nombreInicial?: string;
}

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
export class ClienteDialogComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  readonly dialogRef: MatDialogRef<ClienteDialogComponent> = inject(
    MatDialogRef<ClienteDialogComponent>,
  );
  readonly data: ClienteDialogData = inject(MAT_DIALOG_DATA);
  private readonly clienteService: ClienteService = inject(ClienteService);
  private readonly notify: NotificationService = inject(NotificationService);

  /** Formulario reactivo para la captura de datos del cliente */
  readonly form: FormGroup = this.fb.group({
    documento: [
      this.data?.documentoInicial || '',
      [Validators.required, Validators.maxLength(25)],
    ],
    nombre: [
      this.data?.nombreInicial || '',
      [Validators.required, Validators.maxLength(150)],
    ],
    telefono: ['', [Validators.maxLength(25)]],
    correo: ['', [Validators.email]],
    direccion: [''],
    esFacturaElectronica: [true], // Por defecto activado al abrir este modal
  });

  ngOnInit(): void {
    if (this.data?.documentoInicial) {
      this.form.patchValue({ documento: this.data.documentoInicial.trim() });
    }
    if (this.data?.nombreInicial) {
      this.form.patchValue({ nombre: this.data.nombreInicial.trim() });
    }
  }

  /**
   * Guarda el cliente invocando el contrato oficial registrarCliente.
   */
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const request: CreateClienteRequest = {
      documento: val.documento.trim(),
      nombre: val.nombre.trim(),
      telefono: val.telefono?.trim() || undefined,
      correo: val.correo?.trim() || undefined,
      direccion: val.direccion?.trim() || undefined,
      esFacturaElectronica: !!val.esFacturaElectronica,
    };

    this.clienteService.registrarCliente(request).subscribe({
      next: (clienteGuardado: Cliente) => {
        this.notify.showSuccess(
          `Cliente "${clienteGuardado.nombre}" registrado exitosamente.`,
        );
        this.dialogRef.close(clienteGuardado);
      },
      error: () => {
        this.notify.showError(
          'No se pudo registrar el cliente en el servidor.',
        );
      },
    });
  }

  /**
   * Cierra el diálogo sin emitir cambios.
   */
  cancelar(): void {
    this.dialogRef.close(null);
  }
}
