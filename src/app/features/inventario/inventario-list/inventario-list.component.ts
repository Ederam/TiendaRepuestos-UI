/**
 * @fileoverview Componente de catálogo y consulta de inventario para TiendaRepuestos-UI.
 * Despliega tabla reactiva con paginación server-side, búsqueda filtrada y alertas de stock crítico.
 */

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

// Core
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.models';

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
    MatTooltipModule
  ],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.scss'
})
export class InventarioListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  /** Columnas desplegadas en la tabla de Angular Material */
  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'categoria',
    'precioVenta',
    'stock',
    'estado',
    'acciones'
  ];

  /** Signals reactivos de estado de la vista */
  readonly productos = signal<Producto[]>([]);
  readonly totalItems = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  /** Control reactivo para la barra de búsqueda rápida */
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    this.cargarProductos();
    this.setupBuscador();
  }

  /**
   * Escucha cambios en el campo de texto con debounce para evitar múltiples llamadas HTTP.
   */
  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex.set(0); // Reiniciar a la primera página ante nueva búsqueda
        this.cargarProductos();
      });
  }

  /**
   * Consulta el backend con la configuración actual de paginación y búsqueda.
   */
  cargarProductos(): void {
    this.isLoading.set(true);

    this.productoService
      .getProductosPaginado({
        busqueda: this.searchControl.value,
        soloActivos: true,
        pageNumber: this.pageIndex() + 1, // MatPaginator es 0-based, el backend .NET es 1-based
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

  /**
   * Manejador de eventos al cambiar de página o tamaño en MatPaginator.
   * @param event Información de la página seleccionada.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarProductos();
  }

  /**
   * Determina si el producto se encuentra en umbral crítico de existencias.
   * @param prod Producto a evaluar.
   */
  esStockCritico(prod: Producto): boolean {
    return prod.stockActual <= prod.stockMinimo;
  }

  /**
   * Limpia el cuadro de búsqueda y recarga el catálogo completo.
   */
  limpiarFiltro(): void {
    this.searchControl.setValue('');
  }
}