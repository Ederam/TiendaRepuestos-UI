/**
 * @fileoverview Componente de Punto de Venta (POS) para MACROLATAS.
 * Gestiona el carrito mediante Signals, descuento reactivo en tiempo real
 * y reordenamiento automático de repuestos con existencias disponibles.
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

// Core
import { ProductoService } from '../../core/services/productos/producto.service';
import { VentaService } from '../../core/services/ventas/venta.service';
import { NotificationService } from '../../core/services/notification.service';
import { Producto } from '../../core/models/producto.models';
import {
  CreateVentaRequest,
  DetalleVentaItem,
} from '../../core/models/venta.models';
import {
  LISTA_METODOS_PAGO,
  MetodoPagoId,
} from '../../core/constants/pagos.constants';
import { TicketDialogComponent } from './ticket-dialog/ticket-dialog.component';

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly ventaService = inject(VentaService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly metodosPago = LISTA_METODOS_PAGO;

  /** Signals de catálogo y carrito */
  private readonly _productosBase = signal<Producto[]>([]);
  readonly carrito = signal<CarritoItem[]>([]);
  readonly isBuscando = signal<boolean>(false);
  readonly isProcesandoVenta = signal<boolean>(false);

  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly ventaForm = new FormGroup({
    clienteDocumento: new FormControl<string>(''),
    clienteNombre: new FormControl<string>(''),
    metodoPago: new FormControl<MetodoPagoId>('Efectivo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /**
   * Computed: Catálogo proyectado en tiempo real.
   * 1. Descuenta las existencias agregadas al carrito.
   * 2. Reordena: productos con stock disponible van primero; agotados van al final.
   */
  readonly productosDisponibles = computed(() => {
    const base = this._productosBase();
    const itemsCarrito = this.carrito();

    const proyectados = base.map((prod) => {
      const enCarrito = itemsCarrito.find((c) => c.producto.id === prod.id);
      const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
      const stockDisponible = Math.max(0, prod.stockActual - cantidadEnCarrito);

      return {
        ...prod,
        stockDisponibleVisual: stockDisponible,
      };
    });

    // Ordenar: primero los que tienen stock > 0, luego los que están en 0
    return proyectados.sort((a, b) => {
      if (a.stockDisponibleVisual > 0 && b.stockDisponibleVisual === 0)
        return -1;
      if (a.stockDisponibleVisual === 0 && b.stockDisponibleVisual > 0)
        return 1;
      return 0;
    });
  });

  readonly subtotalVenta = computed(() =>
    this.carrito().reduce((acc, item) => acc + item.subtotal, 0),
  );

  readonly cantidadItems = computed(() =>
    this.carrito().reduce((acc, item) => acc + item.cantidad, 0),
  );

  ngOnInit(): void {
    this.buscarProductos('');
    this.setupBuscador();
  }

  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((termino) => {
        this.buscarProductos(termino);
      });
  }

  buscarProductos(termino: string): void {
    this.isBuscando.set(true);
    this.productoService
      .getProductosPaginado({
        busqueda: termino,
        soloActivos: true,
        pageNumber: 1,
        pageSize: 16,
      })
      .subscribe({
        next: (res) => {
          this._productosBase.set(res.items);
          this.isBuscando.set(false);
        },
        error: () => this.isBuscando.set(false),
      });
  }

  agregarAlCarrito(producto: Producto): void {
    const items = [...this.carrito()];
    const index = items.findIndex((i) => i.producto.id === producto.id);
    const cantidadActualEnCarrito = index > -1 ? items[index].cantidad : 0;

    if (cantidadActualEnCarrito + 1 > producto.stockActual) {
      this.notify.showWarning(
        `Existencias agotadas para "${producto.nombre}".`,
      );
      return;
    }

    if (index > -1) {
      items[index] = {
        ...items[index],
        cantidad: items[index].cantidad + 1,
        subtotal: (items[index].cantidad + 1) * items[index].precioUnitario,
      };
    } else {
      items.push({
        producto,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        subtotal: producto.precioVenta,
      });
    }

    this.carrito.set(items);
  }

  actualizarCantidad(productoId: number, cambio: number): void {
    const items = this.carrito()
      .map((item) => {
        if (item.producto.id === productoId) {
          const nuevaCantidad = item.cantidad + cambio;
          if (nuevaCantidad > item.producto.stockActual) {
            this.notify.showWarning(
              `Stock máximo alcanzado: ${item.producto.stockActual} unidades.`,
            );
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        }
        return item;
      })
      .filter((item) => item.cantidad > 0);

    this.carrito.set(items);
  }

  eliminarDelCarrito(productoId: number): void {
    this.carrito.set(
      this.carrito().filter((i) => i.producto.id !== productoId),
    );
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
  }

  procesarVenta(): void {
    if (this.carrito().length === 0) {
      this.notify.showWarning('El ticket de venta está vacío.');
      return;
    }

    if (this.ventaForm.invalid || this.isProcesandoVenta()) {
      return;
    }

    this.isProcesandoVenta.set(true);
    const formVal = this.ventaForm.getRawValue();

    const detalles: DetalleVentaItem[] = this.carrito().map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      descuento: 0,
    }));

    const request: CreateVentaRequest = {
      clienteDocumento: formVal.clienteDocumento?.trim() || undefined,
      clienteNombre: formVal.clienteNombre?.trim() || 'Cliente Mostrador',
      metodoPago: formVal.metodoPago,
      detalles,
    };

    this.ventaService.registrarVenta(request).subscribe({
      next: (res) => {
        this.isProcesandoVenta.set(false);
        this.notify.showSuccess(
          `¡Venta registrada exitosamente! Factura #${res.numeroFactura || res.id}`,
        );

        this.dialog.open(TicketDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            venta: res,
            items: [...this.carrito()],
            clienteNombre: formVal.clienteNombre?.trim(),
            clienteDocumento: formVal.clienteDocumento?.trim(),
            metodoPago: formVal.metodoPago,
          },
        });

        this.limpiarCarrito();
        this.ventaForm.patchValue({
          clienteDocumento: '',
          clienteNombre: '',
          metodoPago: 'Efectivo',
        });
        this.buscarProductos(this.searchControl.value);
      },
      error: () => {
        this.isProcesandoVenta.set(false);
      },
    });
  }
}
