/**
 * @fileoverview Componente de vista principal para el catálogo de inventario de MACROLATAS.
 * Administra la consulta paginada en servidor, búsqueda reactiva con debounce,
 * filtros rápidos por familias de colisión y orquestación de creación/edición de repuestos.
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
  /** Servicio abstracto de productos inyectado */
  private readonly productoService: ProductoService = inject(ProductoService);

  /** Servicio de diálogos de Angular Material */
  private readonly dialog: MatDialog = inject(MatDialog);

  /** Servicio de notificaciones y avisos */
  private readonly notify: NotificationService = inject(NotificationService);

  /** Columnas proyectadas en la grilla principal */
  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'categoria',
    'ubicacion',
    'precioVenta',
    'stock',
    'acciones',
  ];

  /** Lista de filtros rápidos por familia para acceso de un clic */
  readonly filtrosRapidos: readonly string[] = [
    'Todas',
    'Farolas',
    'Stops',
    'Bomperes',
    'Capots',
    'Direccionales',
    'Persianas',
  ];

  /** Colección reactiva de productos visibles en la página actual */
  readonly productos: WritableSignal<Producto[]> = signal<Producto[]>([]);

  /** Conteo global de registros que satisfacen el filtro actual */
  readonly totalItems: WritableSignal<number> = signal<number>(0);

  /** Tamaño de página para paginación de servidor */
  readonly pageSize: WritableSignal<number> = signal<number>(10);

  /** Índice de página actual (base cero) */
  readonly pageIndex: WritableSignal<number> = signal<number>(0);

  /** Indicador reactivo de operación de red en progreso */
  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  /** Filtro de familia rápida actualmente seleccionado */
  readonly filtroSeleccionado: WritableSignal<string> = signal<string>('Todas');

  /** Control reactivo para la entrada del buscador */
  readonly searchControl: FormControl<string> = new FormControl<string>('', {
    nonNullable: true,
  });

  /**
   * Ciclo de vida inicial: suscribe el buscador con debounce y ejecuta la primera carga.
   */
  ngOnInit(): void {
    this.cargarProductos();
    this.setupBuscador();
  }

  /**
   * Configura la escucha del buscador con debounce para evitar saturación de peticiones.
   */
  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.cargarProductos();
      });
  }

  /**
   * Aplica un filtro rápido por familia combinándolo con el texto del buscador.
   * @param filtro Nombre de la familia seleccionada (ej: 'Farolas', 'Stops').
   */
  seleccionarFiltroRapido(filtro: string): void {
    this.filtroSeleccionado.set(filtro);
    this.pageIndex.set(0);

    if (filtro === 'Todas') {
      this.cargarProductos();
    } else {
      this.cargarProductosConFiltro(filtro);
    }
  }

  /**
   * Construye la consulta combinada y dispara la llamada paginada al servidor.
   * @param familia Término de familia a incorporar en la búsqueda.
   */
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

  /**
   * Consulta el catálogo paginado desde el servidor según los parámetros activos.
   */
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

  /**
   * Manejador del evento de paginación de Angular Material.
   * @param event Parámetros de la nueva página seleccionada.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarProductos();
  }

  /**
   * Determina si el repuesto se encuentra en umbral de existencias crítico.
   * @param prod Instancia del producto evaluado.
   * @returns Verdadero si las existencias son inferiores o iguales al mínimo.
   */
  esStockCritico(prod: Producto): boolean {
    return prod.stockActual <= prod.stockMinimo;
  }

  /**
   * Restablece el valor del campo de búsqueda textual.
   */
  limpiarFiltro(): void {
    this.searchControl.setValue('');
  }

  /**
   * Abre el diálogo modal para crear un nuevo repuesto en inventario.
   */
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

  /**
   * Abre el diálogo modal en modo edición con los datos del repuesto cargados.
   * @param prod Instancia del producto a modificar.
   */
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
          const cat = CATEGORIAS_REPUESTOS.find(
            (c) => c.id === result.categoriaId,
          );
          Object.assign(prod, {
            ...result,
            codigo: result.codigo.toUpperCase().trim(),
            nombreCategoria: cat?.nombre || prod.nombreCategoria,
          });
          this.notify.showSuccess(`Repuesto "${prod.nombre}" actualizado.`);
          this.cargarProductos();
        }
      });
  }
}
