/**
 * @fileoverview Diálogo modal para la creación y edición de repuestos en MACROLATAS.
 * Proporciona validación reactiva de formularios, sugerencia asistida de códigos SKU
 * sincronizada en tiempo real con la descripción comercial y soporte para catálogos multiorigen.
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
import { MatTooltipModule } from '@angular/material/tooltip';

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

/**
 * Contrato de datos inyectados al abrir el diálogo modal.
 */
export interface ProductoDialogData {
  /** Instancia del producto en caso de operación de edición */
  producto?: Producto;
  /** Modo operativo del diálogo modal */
  modo: 'crear' | 'editar';
}

/**
 * Estructura para opciones de procedencia de inventario con descripciones amigables.
 */
export interface OrigenOpcion {
  valor: OrigenInventario;
  etiqueta: string;
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
    MatTooltipModule,
  ],
  templateUrl: './producto-dialog.component.html',
  styleUrl: './producto-dialog.component.scss',
})
export class ProductoDialogComponent implements OnInit {
  /** Constructor de formularios reactivos inyectado */
  private readonly fb: FormBuilder = inject(FormBuilder);

  /** Referencia de control del diálogo modal */
  readonly dialogRef: MatDialogRef<ProductoDialogComponent> = inject(
    MatDialogRef<ProductoDialogComponent>,
  );

  /** Datos contextuales transferidos al abrir el modal */
  readonly data: ProductoDialogData = inject(MAT_DIALOG_DATA);

  /** Colección inmutable de categorías disponibles en el sistema */
  readonly categorias: readonly CategoriaOption[] = CATEGORIAS_REPUESTOS;

  /** Marcas de fabricantes aftermarket disponibles para selección */
  readonly marcasRepuesto: readonly string[] = [
    'TYC',
    'DEPO',
    'CHINA',
    'ORIGINAL',
    'GENÉRICO',
    'FITAM',
    'VICC',
  ];

  /** Opciones de condición física del repuesto */
  readonly condiciones: readonly CondicionRepuesto[] = ['Nuevo', 'Segunda'];

  /** Procedencias de inventario admitidas con etiquetas amigables para el operador */
  readonly origenesOpciones: readonly OrigenOpcion[] = [
    {
      valor: 'PROPIO_MACROLATAS',
      etiqueta: '🏢 Propio de Almacén (MACROLATAS)',
    },
    {
      valor: 'ALIADO_EUROCAR',
      etiqueta: '🤝 Aliado Eurocar',
    },
    {
      valor: 'ALIADO_LATAS',
      etiqueta: '🤝 Aliado Latas y Bomperes',
    },
  ];

  /**
   * Bandera que determina si el usuario ha escrito manualmente un código SKU.
   * Si es false, el código se actualiza automáticamente al cambiar el nombre del repuesto.
   */
  codigoEditadoManualmente: boolean = false;

  /** Formulario reactivo tipado para la captura del repuesto */
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

  /**
   * Ciclo de inicialización: asigna el código en mayúsculas en modo edición.
   */
  ngOnInit(): void {
    if (this.data.modo === 'editar' && this.data.producto?.codigo) {
      this.codigoEditadoManualmente = true;
      this.form
        .get('codigo')
        ?.setValue(this.data.producto.codigo.toUpperCase(), {
          emitEvent: false,
        });
    }
  }

  /**
   * Se ejecuta cuando el usuario escribe manualmente en el campo código.
   * Marca que el código fue personalizado para no sobreescribirlo automáticamente.
   */
  onCodigoManualInput(): void {
    this.codigoEditadoManualmente = true;
  }

  /**
   * Sincroniza o sugiere el código SKU a partir del nombre comercial.
   * Si no ha sido editado manualmente por el operador, se actualiza automáticamente.
   */
  sincronizarCodigoConNombre(): void {
    if (this.data.modo === 'editar' || this.codigoEditadoManualmente) {
      return;
    }

    const nombreActual: string = this.form.get('nombre')?.value;
    if (nombreActual && nombreActual.trim().length >= 3) {
      const sugerido: string = generarCodigoSugerido(nombreActual);
      if (sugerido) {
        this.form.patchValue({ codigo: sugerido }, { emitEvent: false });
      }
    }
  }

  /**
   * Genera o regenera un código sugerido bajo demanda del operador mediante el botón de asistencia.
   * Restablece la bandera de edición manual.
   */
  sugerirCodigoManual(): void {
    const nombreActual: string = this.form.get('nombre')?.value;
    const sugerido: string = generarCodigoSugerido(nombreActual);
    if (sugerido) {
      this.form.patchValue({ codigo: sugerido });
      this.codigoEditadoManualmente = false;
    }
  }

  /**
   * Asegura la conversión a mayúsculas y recorte de espacios del código al salir del campo.
   */
  onCodigoBlur(): void {
    const control = this.form.get('codigo');
    if (control?.value) {
      control.setValue(control.value.toString().toUpperCase().trim());
    }
  }

  /**
   * Asigna una plantilla de texto al campo nombre y genera automáticamente su código SKU representativo.
   * @param textoEjemplo Descripción sugerida para el repuesto.
   */
  copiarPlantilla(textoEjemplo: string): void {
    this.form.patchValue({ nombre: textoEjemplo });
    this.codigoEditadoManualmente = false;
    const codigoSugerido: string = generarCodigoSugerido(textoEjemplo);
    if (codigoSugerido) {
      this.form.patchValue({ codigo: codigoSugerido });
    }
  }

  /**
   * Valida el formulario y emite la entidad estructurada cerrando el diálogo modal.
   */
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
   * Cierra el diálogo modal sin emitir cambios.
   */
  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
