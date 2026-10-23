/**
 * @fileoverview Componente de vista principal para el catálogo de inventario de MACROLATAS.
 * Administra la consulta paginada en servidor, búsqueda reactiva con debounce,
 * filtros rápidos por familias de colisión y persistencia de creación y edición de repuestos.
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
import { CATEGORIAS_REPUESTOS } from '@core/constants/categorias.constants';

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

  readonly filtrosRapidos: readonly string[] = [
    'Todas',
    'Farolas',
    'Stops',
    'Bomperes',
    'Capots',
    'Direccionales',
    'Persianas',
  ];

  readonly productos: WritableSignal<Producto[]> = signal<Producto[]>([]);
  readonly totalItems: WritableSignal<number> = signal<number>(0);
  readonly pageSize: WritableSignal<number> = signal<number>(10);
  readonly pageIndex: WritableSignal<number> = signal<number>(0);
  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
  readonly filtroSeleccionado: WritableSignal<string> = signal<string>('Todas');

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

  seleccionarFiltroRapido(filtro: string): void {
    this.filtroSeleccionado.set(filtro);
    this.pageIndex.set(0);

    if (filtro === 'Todas') {
      this.cargarProductos();
    } else {
      this.cargarProductosConFiltro(filtro);
    }
  }

  private cargarProductosConFiltro(familia: string): void {
    const busquedaTexto: string = this.searchControl.value.trim();
    const queryFinal: string = busquedaTexto
      ? `${busquedaTexto} ${familia}`
      : familia;

    this.isLoading.set(true);
    this.productoService
      .getProductosPaginado({
        busqueda: queryFinal,
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
        error: () => this.isLoading.set(false),
      });
  }

  cargarProductos(): void {
    this.isLoading.set(true);

    this.productoService
      .getProductosPaginado({
        busqueda: this.searchControl.value,
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
