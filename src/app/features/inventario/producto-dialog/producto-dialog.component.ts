/**
 * @fileoverview Diálogo modal para creación y edición de repuestos en MACROLATAS.
 * Utiliza Reactive Forms tipados, sanitización de mayúsculas y categorías parametrizadas.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

// Core
import { Producto, CreateProductoRequest } from '../../../core/models/producto.models';
import { CATEGORIAS_REPUESTOS, CategoriaOption } from '../../../core/constants/categorias.constants';

export interface ProductoDialogData {
  producto?: Producto;
  modo: 'crear' | 'editar';
}

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './producto-dialog.component.html',
  styleUrl: './producto-dialog.component.scss'
})
export class ProductoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<ProductoDialogComponent>);
  readonly data: ProductoDialogData = inject(MAT_DIALOG_DATA);

  /** Categorías parametrizadas sin valores quemados en componente */
  readonly categorias: readonly CategoriaOption[] = CATEGORIAS_REPUESTOS;

  readonly form: FormGroup = this.fb.group({
    codigo: [
      this.data.producto?.codigo || '',
      [Validators.required, Validators.maxLength(30)]
    ],
    nombre: [
      this.data.producto?.nombre || '',
      [Validators.required, Validators.maxLength(150)]
    ],
    descripcion: [this.data.producto?.descripcion || ''],
    categoriaId: [
      this.data.producto?.categoriaId || 1,
      [Validators.required]
    ],
    costo: [
      this.data.producto?.costo || 0,
      [Validators.required, Validators.min(0)]
    ],
    precioVenta: [
      this.data.producto?.precioVenta || 0,
      [Validators.required, Validators.min(0)]
    ],
    stockActual: [
      this.data.producto?.stockActual || 0,
      [Validators.required, Validators.min(0)]
    ],
    stockMinimo: [
      this.data.producto?.stockMinimo || 2,
      [Validators.required, Validators.min(0)]
    ]
  });

  ngOnInit(): void {
    // Normalizar a mayúsculas en el formulario si es edición
    if (this.data.producto?.codigo) {
      this.form.get('codigo')?.setValue(this.data.producto.codigo.toUpperCase(), { emitEvent: false });
    }
  }

  /**
   * Asegura la conversión a mayúsculas del código en tiempo de ejecución.
   */
  onCodigoBlur(): void {
    const control = this.form.get('codigo');
    if (control?.value) {
      control.setValue(control.value.toString().toUpperCase().trim());
    }
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.getRawValue();

    // Sanitización garantizada: código siempre en mayúsculas sin espacios residuales
    const payload: CreateProductoRequest = {
      ...formValues,
      codigo: formValues.codigo.toString().toUpperCase().trim(),
      nombre: formValues.nombre.toString().trim()
    };

    this.dialogRef.close(payload);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}