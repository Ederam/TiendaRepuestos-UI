/**
 * @fileoverview Diálogo modal para creación y edición de repuestos en MACROLATAS.
 * Utiliza Reactive Forms tipados, autocompletado asistido de SKU y soporte multiorigen.
 */

import { Component, OnInit, inject } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

// Core
import {
  Producto,
  CreateProductoRequest,
  CondicionRepuesto,
  OrigenInventario,
} from '../../../core/models/producto.models';
import {
  CATEGORIAS_REPUESTOS,
  CategoriaOption,
} from '../../../core/constants/categorias.constants';
import { generarCodigoSugerido } from '../../../core/utils/sku-generator.util';

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
    MatIconModule,
  ],
  templateUrl: './producto-dialog.component.html',
  styleUrl: './producto-dialog.component.scss',
})
export class ProductoDialogComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  readonly dialogRef: MatDialogRef<ProductoDialogComponent> = inject(
    MatDialogRef<ProductoDialogComponent>,
  );
  readonly data: ProductoDialogData = inject(MAT_DIALOG_DATA);

  readonly categorias: readonly CategoriaOption[] = CATEGORIAS_REPUESTOS;

  readonly marcasRepuesto: readonly string[] = [
    'TYC',
    'DEPO',
    'CHINA',
    'ORIGINAL',
    'GENÉRICO',
    'FITAM',
    'VICC',
  ];

  readonly condiciones: readonly CondicionRepuesto[] = ['Nuevo', 'Segunda'];

  readonly origenes: readonly OrigenInventario[] = [
    'PROPIO_MACROLATAS',
    'ALIADO_EUROCAR',
    'ALIADO_LATAS',
  ];

  readonly form: FormGroup = this.fb.group({
    codigo: [
      this.data.producto?.codigo || '',
      [Validators.required, Validators.maxLength(50)],
    ],
    nombre: [
      this.data.producto?.nombre || '',
      [Validators.required, Validators.maxLength(150)],
    ],
    descripcion: [this.data.producto?.descripcion || ''],
    categoriaId: [this.data.producto?.categoriaId || 1, [Validators.required]],
    marcaRepuesto: [this.data.producto?.marcaRepuesto || 'GENÉRICO'],
    marcaVehiculo: [this.data.producto?.marcaVehiculo || 'MULTIMARCA'],
    condicion: [
      this.data.producto?.condicion || ('Nuevo' as CondicionRepuesto),
      [Validators.required],
    ],
    origen: [
      this.data.producto?.origen || ('PROPIO_MACROLATAS' as OrigenInventario),
      [Validators.required],
    ],
    ubicacion: [
      this.data.producto?.ubicacion || 'BODEGA PRINCIPAL',
      [Validators.maxLength(100)],
    ],
    costo: [
      this.data.producto?.costo || 0,
      [Validators.required, Validators.min(0)],
    ],
    precioVenta: [
      this.data.producto?.precioVenta || 0,
      [Validators.required, Validators.min(0)],
    ],
    stockActual: [
      this.data.producto?.stockActual || 1,
      [Validators.required, Validators.min(0)],
    ],
    stockMinimo: [
      this.data.producto?.stockMinimo || 2,
      [Validators.required, Validators.min(0)],
    ],
  });

  ngOnInit(): void {
    if (this.data.producto?.codigo) {
      this.form
        .get('codigo')
        ?.setValue(this.data.producto.codigo.toUpperCase(), {
          emitEvent: false,
        });
    }
  }

  /**
   * Sugiere el código al perder el foco del campo nombre si el código aún está vacío.
   */
  onNombreBlur(): void {
    if (this.data.modo === 'editar') return;

    const codigoActual: string = this.form.get('codigo')?.value;
    const nombreActual: string = this.form.get('nombre')?.value;

    if (!codigoActual || codigoActual.trim() === '') {
      const sugerido: string = generarCodigoSugerido(nombreActual);
      if (sugerido) {
        this.form.patchValue({ codigo: sugerido });
      }
    }
  }

  /**
   * Permite regenerar la sugerencia manual con el botón de varita mágica.
   */
  sugerirCodigoManual(): void {
    const nombreActual: string = this.form.get('nombre')?.value;
    const sugerido: string = generarCodigoSugerido(nombreActual);
    if (sugerido) {
      this.form.patchValue({ codigo: sugerido });
    }
  }

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

    const val = this.form.getRawValue();

    const payload: CreateProductoRequest = {
      codigo: val.codigo.toString().toUpperCase().trim(),
      nombre: val.nombre.toString().trim(),
      descripcion: val.descripcion?.trim() || '',
      categoriaId: Number(val.categoriaId),
      marcaRepuesto: val.marcaRepuesto,
      marcaVehiculo: val.marcaVehiculo,
      condicion: val.condicion,
      origen: val.origen,
      ubicacion: val.ubicacion?.trim().toUpperCase() || 'BODEGA PRINCIPAL',
      costo: Number(val.costo),
      precioVenta: Number(val.precioVenta),
      stockActual: Number(val.stockActual),
      stockMinimo: Number(val.stockMinimo),
    };

    this.dialogRef.close(payload);
  }

  /**
   * Asigna una plantilla de texto de ejemplo al campo nombre y genera su respectivo SKU.
   * @param ejemplo Texto sugerido para la pieza.
   */
  usarPlantillaEjemplo(ejemplo: string): void {
    this.form.patchValue({ nombre: ejemplo });
    const sugerido = generarCodigoSugerido(ejemplo);
    if (sugerido) {
      this.form.patchValue({ codigo: sugerido });
    }
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
