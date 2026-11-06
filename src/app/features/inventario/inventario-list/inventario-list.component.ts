/**
 * @fileoverview Componente de vista principal para el catálogo de inventario de MACROLATAS.
 * Administra la consulta paginada en servidor, búsqueda reactiva con debounce,
 * filtros rápidos combinables por Tipo de Repuesto y Marca de Vehículo (ergonomía de mostrador),
 * y persistencia de creación y edición de repuestos.
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

// Core
import { ProductoService } from '../../../core/services/productos/producto.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Producto,
  CreateProductoRequest,
} from '../../../core/models/producto.models';
import { ProductoDialogComponent } from '../producto-dialog/producto-dialog.component';
import {
  FILTROS_TIPO_REPUESTO,
  FILTROS_MARCA_VEHICULO,
  FiltroRapidoOpcion,
} from '@core/constants/categorias.constants';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    RouterLink,
  ],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.scss',
})
export class InventarioListComponent implements OnInit {
  private readonly productoService: ProductoService = inject(ProductoService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly notify: NotificationService = inject(NotificationService);

  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'categoria',
    'ubicacion',
    'precioVenta',
    'stock',
    'acciones',
  ];

  /** Colección inmutable de píldoras por Tipo de Repuesto */
  readonly filtrosTipo: readonly FiltroRapidoOpcion[] = FILTROS_TIPO_REPUESTO;

  /** Colección inmutable de píldoras por Marca de Vehículo */
  readonly filtrosMarca: readonly FiltroRapidoOpcion[] = FILTROS_MARCA_VEHICULO;

  readonly productos: WritableSignal<Producto[]> = signal<Producto[]>([]);
  readonly totalItems: WritableSignal<number> = signal<number>(0);
  readonly pageSize: WritableSignal<number> = signal<number>(10);
  readonly pageIndex: WritableSignal<number> = signal<number>(0);
  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  /** Filtros seleccionados actualmente */
  readonly filtroTipoSeleccionado: WritableSignal<string> = signal<string>('');
  readonly filtroMarcaSeleccionada: WritableSignal<string> = signal<string>('');

  readonly searchControl: FormControl<string> = new FormControl<string>('', {
    nonNullable: true,
  });

  ngOnInit(): void {
    this.cargarProductos();
    this.setupBuscador();
  }

  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.cargarProductos();
      });
  }

  /**
   * Cambia o activa el filtro de Tipo de Repuesto (Farola, Stop, Bomper, etc.)
   */
  seleccionarFiltroTipo(valor: string): void {
    this.filtroTipoSeleccionado.set(valor);
    this.pageIndex.set(0);
    this.cargarProductos();
  }

  /**
   * Cambia o activa el filtro de Marca de Vehículo (Chevrolet, Renault, etc.)
   */
  seleccionarFiltroMarca(valor: string): void {
    this.filtroMarcaSeleccionada.set(valor);
    this.pageIndex.set(0);
    this.cargarProductos();
  }

  /**
   * Construye el término de búsqueda combinando el texto escrito, tipo y marca.
   */
  private construirCriterioBusqueda(): string {
    const terminos: string[] = [];

    const textoLibre: string = this.searchControl.value.trim();
    if (textoLibre) {
      terminos.push(textoLibre);
    }

    const tipo: string = this.filtroTipoSeleccionado();
    if (tipo) {
      terminos.push(tipo);
    }

    const marca: string = this.filtroMarcaSeleccionada();
    if (marca) {
      terminos.push(marca);
    }

    return terminos.join(' ');
  }

  cargarProductos(): void {
    this.isLoading.set(true);

    const criterioFinal: string = this.construirCriterioBusqueda();

    this.productoService
      .getProductosPaginado({
        busqueda: criterioFinal,
        soloActivos: true,
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.productos.set(response.items);
          this.totalItems.set(response.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarProductos();
  }

  esStockCritico(prod: Producto): boolean {
    return prod.stockActual <= prod.stockMinimo;
  }

  limpiarFiltro(): void {
    this.searchControl.setValue('');
    this.filtroTipoSeleccionado.set('');
    this.filtroMarcaSeleccionada.set('');
    this.pageIndex.set(0);
    this.cargarProductos();
  }

  abrirModalCrear(): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'modal-sin-scroll',
      data: { modo: 'crear' },
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: CreateProductoRequest | null) => {
        if (result) {
          this.productoService.createProducto(result).subscribe({
            next: (creado: Producto) => {
              this.notify.showSuccess(
                `Repuesto "${creado.nombre}" (${creado.codigo}) registrado exitosamente.`,
              );
              this.cargarProductos();
            },
          });
        }
      });
  }

  abrirModalEditar(prod: Producto): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'modal-sin-scroll',
      data: { producto: prod, modo: 'editar' },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: CreateProductoRequest | null) => {
        if (result) {
          this.productoService.updateProducto(prod.id, result).subscribe({
            next: (actualizado: Producto) => {
              this.notify.showSuccess(
                `Repuesto "${actualizado.nombre}" actualizado en base de datos.`,
              );
              this.cargarProductos();
            },
            error: () => {
              this.notify.showError(
                'No se pudo actualizar el repuesto en el servidor.',
              );
            },
          });
        }
      });
  }
}
