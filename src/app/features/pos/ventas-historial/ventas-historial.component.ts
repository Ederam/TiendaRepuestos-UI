/**
 * @fileoverview Componente de consulta y reimpresión de comprobantes de ventas para MACROLATAS.
 * Permite buscar por consecutivo oficial (VTA-XXXXX), cliente o documento,
 * además de invocar el diálogo de impresión térmica para cualquier comprobante histórico.
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

// Core Services & Models
import { VentaService } from '../../../core/services/ventas/venta.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VentaResponse } from '../../../core/models/venta.models';
import { TicketDialogComponent } from '../ticket-dialog/ticket-dialog.component';
import { CarritoItem } from '../services/pos-cart.service';

@Component({
  selector: 'app-ventas-historial',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './ventas-historial.component.html',
  styleUrl: './ventas-historial.component.scss',
})
export class VentasHistorialComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  /** Listado bruto de comprobantes registrados */
  private readonly _ventas = signal<VentaResponse[]>([]);

  /** Estado de carga asíncrona */
  readonly isLoading = signal<boolean>(false);

  /** Filtro de búsqueda en tiempo real */
  readonly filtroControl = new FormControl<string>('', { nonNullable: true });
  readonly filtroTexto = signal<string>('');

  /** Columnas proyectadas en la grilla */
  readonly displayedColumns: string[] = [
    'numeroComprobante',
    'fechaVenta',
    'cliente',
    'metodoPago',
    'total',
    'acciones',
  ];

  /** Ventas filtradas de forma reactiva mediante Signals */
  readonly ventasFiltradas = computed(() => {
    const termino = this.filtroTexto().toLowerCase().trim();
    const lista = this._ventas();

    if (!termino) {
      return lista;
    }

    return lista.filter(
      (v) =>
        (v.numeroComprobante &&
          v.numeroComprobante.toLowerCase().includes(termino)) ||
        (v.clienteNombre && v.clienteNombre.toLowerCase().includes(termino)) ||
        (v.clienteDocumento &&
          v.clienteDocumento.toLowerCase().includes(termino)),
    );
  });

  /** Monto total acumulado de las ventas filtradas */
  readonly totalRecaudado = computed(() =>
    this.ventasFiltradas().reduce((acum, v) => acum + v.total, 0),
  );

  ngOnInit(): void {
    this.cargarHistorial();
    this.filtroControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((valor) => this.filtroTexto.set(valor));
  }

  /**
   * Obtiene la relación histórica completa de ventas desde el servicio (HTTP o Mock).
   */
  cargarHistorial(): void {
    this.isLoading.set(true);
    this.ventaService.obtenerVentas().subscribe({
      next: (data) => {
        // Orden descendente por fecha para ver las más recientes primero
        const ordenadas = [...data].sort(
          (a, b) =>
            new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime(),
        );
        this._ventas.set(ordenadas);
        this.isLoading.set(false);
      },
      error: () => {
        this.notify.showError('No fue posible cargar el historial de ventas.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Abre el modal térmico para reimprimir el comprobante seleccionado.
   * Sincroniza la estructura completa del Producto con categoriaId numérico.
   * @param venta Datos del comprobante a reimprimir.
   */
  reimprimir(venta: VentaResponse): void {
    const itemsAdaptados: CarritoItem[] = (venta.detalles || []).map((d) => ({
      producto: {
        id: d.productoId,
        codigo: 'REF',
        nombre: d.nombreProducto,
        precioVenta: d.precioUnitario,
        costo: 0,
        stockActual: 0,
        stockMinimo: 0,
        categoriaId: 0,
        origen: 'PROPIO_MACROLATAS',
        condicion: 'Nuevo',
        activo: true,
      },
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      costoUnitario: 0,
      subtotal: d.subtotal,
      esBajoCosto: false,
      esPrecioInvalido: false,
    }));

    this.dialog.open(TicketDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        venta,
        items: itemsAdaptados,
        clienteNombre: venta.clienteNombre,
        clienteDocumento: venta.clienteDocumento,
        metodoPago: venta.metodoPago,
      },
    });
  }
}
