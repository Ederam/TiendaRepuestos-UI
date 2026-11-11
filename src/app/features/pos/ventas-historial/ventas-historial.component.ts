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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

// Core Services & Models
import { VentaService } from '../../../core/services/ventas/venta.service';
import { AuthService } from '../../../core/services/auth/auth.service';
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
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './ventas-historial.component.html',
  styleUrl: './ventas-historial.component.scss',
})
export class VentasHistorialComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  /** Indica si el usuario autenticado tiene rol Administrador para auditar por vendedor */
  readonly isAdmin = this.authService.isAdmin;

  /** Listado bruto de comprobantes registrados */
  private readonly _ventas = signal<VentaResponse[]>([]);

  /** Estado de carga asíncrona */
  readonly isLoading = signal<boolean>(false);

  /** Filtro de búsqueda en tiempo real */
  readonly filtroControl = new FormControl<string>('', { nonNullable: true });
  readonly filtroTexto = signal<string>('');

  /** Filtro reactivo por vendedor seleccionado (solo Administrador) */
  readonly vendedorSeleccionado = signal<string>('');
  readonly vendedoresDisponibles = signal<{ key: string; nombre: string }[]>(
    [],
  );
  private vendedoresDirectorio: { key: string; nombre: string }[] = [];

  /** Columnas proyectadas en la grilla */
  readonly displayedColumns: string[] = [
    'numeroComprobante',
    'fechaVenta',
    'cliente',
    'vendedor',
    'metodoPago',
    'total',
    'acciones',
  ];

  /** Ventas filtradas de forma reactiva mediante Signals */
  readonly ventasFiltradas = computed(() => {
    const termino = this.filtroTexto().toLowerCase().trim();
    const vendedorFiltro = this.isAdmin()
      ? this.vendedorSeleccionado().trim()
      : '';
    let lista = this._ventas();

    if (vendedorFiltro) {
      lista = lista.filter(
        (v) =>
          v.usuarioId === vendedorFiltro || v.nombreVendedor === vendedorFiltro,
      );
    }

    if (!termino) {
      return lista;
    }

    return lista.filter(
      (v) =>
        (v.numeroComprobante &&
          v.numeroComprobante.toLowerCase().includes(termino)) ||
        (v.clienteNombre && v.clienteNombre.toLowerCase().includes(termino)) ||
        (v.clienteDocumento &&
          v.clienteDocumento.toLowerCase().includes(termino)) ||
        (v.nombreVendedor && v.nombreVendedor.toLowerCase().includes(termino)),
    );
  });

  /** Monto total acumulado de las ventas filtradas */
  readonly totalRecaudado = computed(() =>
    this.ventasFiltradas().reduce((acum, v) => acum + v.total, 0),
  );

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.cargarDirectorioVendedores();
    }
    this.cargarHistorial();
    this.filtroControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((valor) => this.filtroTexto.set(valor));
  }

  /**
   * Consulta directamente GET /api/Usuarios/vendedores para poblar el selector con todos los usuarios registrados.
   */
  private cargarDirectorioVendedores(): void {
    this.authService.obtenerVendedores().subscribe({
      next: (usuarios) => {
        this.vendedoresDirectorio = (usuarios || []).map((u) => ({
          key: u.id,
          nombre: u.nombreCompleto,
        }));
        this.actualizarCatalogoVendedores(this._ventas());
      },
      error: () => {
        this.actualizarCatalogoVendedores(this._ventas());
      },
    });
  }

  /**
   * Actualiza el filtro de vendedor (solo Administrador) y recarga reactivamente la lista.
   */
  onVendedorChange(valor: string): void {
    this.vendedorSeleccionado.set(valor || '');
    this.cargarHistorial();
  }

  /**
   * Obtiene la relación histórica de ventas desde el servicio (HTTP o Mock).
   */
  cargarHistorial(): void {
    this.isLoading.set(true);
    const filtroVendedor = this.isAdmin()
      ? this.vendedorSeleccionado() || undefined
      : undefined;

    this.ventaService.obtenerVentas(filtroVendedor).subscribe({
      next: (data) => {
        // Orden descendente por fecha para ver las más recientes primero
        const ordenadas = [...data].sort(
          (a, b) =>
            new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime(),
        );
        this._ventas.set(ordenadas);
        this.actualizarCatalogoVendedores(ordenadas);
        this.isLoading.set(false);
      },
      error: () => {
        this.notify.showError('No fue posible cargar el historial de ventas.');
        this.isLoading.set(false);
      },
    });
  }

  private actualizarCatalogoVendedores(ventas: VentaResponse[]): void {
    if (!this.isAdmin()) return;

    const mapa = new Map<string, string>();
    for (const dir of this.vendedoresDirectorio) {
      if (dir.key && dir.nombre) {
        mapa.set(dir.key, dir.nombre);
      }
    }

    if (this.vendedorSeleccionado()) {
      for (const item of this.vendedoresDisponibles()) {
        mapa.set(item.key, item.nombre);
      }
    }

    for (const venta of ventas) {
      const nombre = venta.nombreVendedor?.trim();
      const key = (venta.usuarioId || nombre || '').trim();
      if (key && nombre) {
        mapa.set(key, nombre);
      }
    }

    this.vendedoresDisponibles.set(
      Array.from(mapa.entries())
        .map(([key, nombre]) => ({ key, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    );
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
        vendedorNombre: venta.nombreVendedor || undefined,
        metodoPago: venta.metodoPago,
      },
    });
  }
}
