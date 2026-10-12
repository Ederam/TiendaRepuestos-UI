import { Component, OnInit, inject, signal } from '@angular/core';
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

// Core
import { ProductoService } from '../../../core/services/productos/producto.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Producto, CreateProductoRequest } from '../../../core/models/producto.models';
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
    MatDialogModule
  ],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.scss'
})
export class InventarioListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'categoria',
    'precioVenta',
    'stock',
    'estado',
    'acciones'
  ];

  readonly productos = signal<Producto[]>([]);
  readonly totalItems = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    this.cargarProductos();
    this.setupBuscador();
  }

  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.cargarProductos();
      });
  }

  cargarProductos(): void {
    this.isLoading.set(true);

    this.productoService
      .getProductosPaginado({
        busqueda: this.searchControl.value,
        soloActivos: true,
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (response) => {
          this.productos.set(response.items);
          this.totalItems.set(response.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
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

  /**
   * Abre el diálogo modal para crear un nuevo repuesto.
   */
  abrirModalCrear(): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '640px',
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe((result: CreateProductoRequest | null) => {
      if (result) {
        this.productoService.createProducto(result).subscribe({
          next: (creado) => {
            this.notify.showSuccess(`Repuesto "${creado.nombre}" registrado exitosamente.`);
            this.cargarProductos();
          }
        });
      }
    });
  }

  /**
   * Abre el diálogo modal en modo edición con los datos del repuesto cargados.
   */
  abrirModalEditar(prod: Producto): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '640px',
      data: { producto: prod, modo: 'editar' }
    });

    dialogRef.afterClosed().subscribe((result: CreateProductoRequest | null) => {
      if (result) {
        const cat = CATEGORIAS_REPUESTOS.find((c) => c.id === result.categoriaId);
        Object.assign(prod, {
          ...result,
          codigo: result.codigo.toUpperCase().trim(),
          nombreCategoria: cat?.nombre || prod.nombreCategoria
        });
        this.notify.showSuccess(`Repuesto "${prod.nombre}" actualizado.`);
        this.cargarProductos();
      }
    });
  }
}