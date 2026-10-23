/**
 * @fileoverview Componente de Punto de Venta (POS) para MACROLATAS.
 * Orquesta la interfaz de usuario, buscador reactivo de repuestos, selección de cliente
 * y confirmación de venta delegando la lógica del carrito a PosCartService (SRP).
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Core Services & Models
import { ProductoService } from '../../core/services/productos/producto.service';
import { VentaService } from '../../core/services/ventas/venta.service';
import { NotificationService } from '../../core/services/notification.service';
import { ClienteService } from '@core/services/clientes/cliente.service';
import { Producto } from '../../core/models/producto.models';
import {
  CreateVentaRequest,
  DetalleVentaItem,
  VentaResponse,
} from '../../core/models/venta.models';
import { LISTA_METODOS_PAGO } from '../../core/constants/pagos.constants';
import { Cliente } from '@core/models/cliente.models';
import { PosCartService, CarritoItem } from './services/pos-cart.service';
import { TicketDialogComponent } from './ticket-dialog/ticket-dialog.component';
import { ClienteDialogComponent } from './cliente-dialog/cliente-dialog.component';

// Reexportación tipada compatible con isolatedModules
export type { CarritoItem };

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatAutocompleteModule,
    MatSlideToggleModule,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  // Inyección de servicios
  private readonly productoService = inject(ProductoService);
  private readonly ventaService = inject(VentaService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly clienteService = inject(ClienteService);
  readonly cartService = inject(PosCartService);

  readonly metodosPago = LISTA_METODOS_PAGO;

  // Señales de estado UI
  private readonly _productosBase = signal<Producto[]>([]);
  readonly isBuscando = signal<boolean>(false);
  readonly isProcesandoVenta = signal<boolean>(false);
  readonly clientesSugeridos = signal<Cliente[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly requiereFacturaElectronica = signal<boolean>(false);
  readonly clienteNoEncontrado = signal<boolean>(false);

  // Formulario reactivo
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly ventaForm: FormGroup = new FormGroup({
    clienteDocumento: new FormControl<string>('222222222222', {
      nonNullable: true,
    }),
    clienteNombre: new FormControl<string>('Consumidor Final / Mostrador', {
      nonNullable: true,
    }),
    metodoPago: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Puentes a Signals del servicio (mantienen compatibilidad estricta con pos.component.html)
  readonly carrito = this.cartService.items;
  readonly subtotalVenta = this.cartService.subtotal;
  readonly cantidadItems = this.cartService.cantidadItems;
  readonly tienePreciosInvalidos = this.cartService.tienePreciosInvalidos;

  /**
   * Cálculo visual reactivo de existencias restando lo apartado en el carrito activo.
   */
  readonly productosDisponibles = computed(() => {
    const base: Producto[] = this._productosBase();
    const itemsCarrito: CarritoItem[] = this.carrito();

    const proyectados = base.map((prod: Producto) => {
      const enCarrito = itemsCarrito.find(
        (c) => c.producto.codigo === prod.codigo,
      );
      const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
      const stockDisponible = Math.max(0, prod.stockActual - cantidadEnCarrito);

      return {
        ...prod,
        stockDisponibleVisual: stockDisponible,
      };
    });

    return proyectados.sort((a, b) => {
      if (a.stockDisponibleVisual > 0 && b.stockDisponibleVisual === 0)
        return -1;
      if (a.stockDisponibleVisual === 0 && b.stockDisponibleVisual > 0)
        return 1;
      return 0;
    });
  });

  /**
   * Validador reactivo para habilitar la confirmación del pago.
   */
  readonly puedeCobrar = computed(() => {
    const hayItems = this.carrito().length > 0;
    const metodoValido = this.ventaForm.get('metodoPago')?.value;
    const procesando = this.isProcesandoVenta();
    const preciosValidos = !this.tienePreciosInvalidos();

    if (!hayItems || !metodoValido || procesando || !preciosValidos) {
      return false;
    }

    if (this.requiereFacturaElectronica()) {
      const doc = this.ventaForm.get('clienteDocumento')?.value?.trim();
      const nom = this.ventaForm.get('clienteNombre')?.value?.trim();
      const esMostrador =
        doc === '222222222222' || nom === 'Consumidor Final / Mostrador';
      return !!doc && !!nom && !esMostrador;
    }

    return true;
  });

  ngOnInit(): void {
    this.buscarProductos('');
    this.setupBuscador();
  }

  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((termino) => this.buscarProductos(termino));
  }

  buscarProductos(termino: string): void {
    this.isBuscando.set(true);
    this.productoService
      .getProductosPaginado({
        busqueda: termino,
        soloActivos: true,
        pageNumber: 1,
        pageSize: 20,
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
    const res = this.cartService.agregarProducto(producto);
    if (!res.exito && res.mensaje) {
      this.notify.showWarning(res.mensaje);
    }
  }

  actualizarPrecioUnitario(codigo: string, nuevoPrecio: number): void {
    const val = this.cartService.actualizarPrecioUnitario(codigo, nuevoPrecio);
    if (val.esInvalido) {
      this.notify.showError('El precio de venta debe ser mayor a cero.');
    } else if (val.esBajoCosto) {
      this.notify.showError(
        `No se permite vender por debajo del costo ($${val.costo.toLocaleString('es-CO')}).`,
      );
    }
  }

  actualizarCantidad(codigo: string, cambio: number): void {
    const res = this.cartService.actualizarCantidad(codigo, cambio);
    if (!res.exito && res.mensaje) {
      this.notify.showWarning(res.mensaje);
    }
  }

  eliminarDelCarrito(codigo: string): void {
    this.cartService.eliminarItem(codigo);
  }

  limpiarCarrito(): void {
    this.cartService.limpiar();
  }

  onToggleFacturaElectronica(requiere: boolean): void {
    this.requiereFacturaElectronica.set(requiere);
    this.clienteNoEncontrado.set(false);

    if (!requiere) {
      this.clienteSeleccionado.set(null);
      this.ventaForm.patchValue({
        clienteDocumento: '222222222222',
        clienteNombre: 'Consumidor Final / Mostrador',
      });
    } else {
      this.clienteSeleccionado.set(null);
      this.ventaForm.patchValue({
        clienteDocumento: '',
        clienteNombre: '',
      });
    }
  }

  onBuscarCliente(valor: string): void {
    if (!valor || valor.trim().length < 2) {
      this.clientesSugeridos.set([]);
      this.clienteNoEncontrado.set(false);
      return;
    }

    this.clienteService.buscarPorTermino(valor.trim()).subscribe({
      next: (res: Cliente[]) => {
        this.clientesSugeridos.set(res);
        this.clienteNoEncontrado.set(res.length === 0);
      },
      error: () => {
        this.clientesSugeridos.set([]);
        this.clienteNoEncontrado.set(true);
      },
    });
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.clienteNoEncontrado.set(false);

    this.ventaForm.patchValue({
      clienteDocumento: cliente.documento,
      clienteNombre: cliente.nombre,
    });

    this.ventaForm.get('clienteDocumento')?.markAsDirty();
    this.ventaForm.get('clienteDocumento')?.updateValueAndValidity();
    this.ventaForm.get('clienteNombre')?.markAsDirty();
    this.ventaForm.get('clienteNombre')?.updateValueAndValidity();
    this.clientesSugeridos.set([]);
  }

  abrirModalNuevoCliente(): void {
    const docActual = this.ventaForm.get('clienteDocumento')?.value || '';
    const nomActual = this.ventaForm.get('clienteNombre')?.value || '';

    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        documentoInicial: docActual === '222222222222' ? '' : docActual,
        nombreInicial:
          nomActual === 'Consumidor Final / Mostrador' ? '' : nomActual,
      },
    });

    dialogRef.afterClosed().subscribe((clienteCreado: Cliente | null) => {
      if (clienteCreado) {
        this.seleccionarCliente(clienteCreado);
        this.notify.showSuccess(
          `Cliente "${clienteCreado.nombre}" vinculado a la venta.`,
        );
      }
    });
  }

  procesarVenta(): void {
    if (!this.puedeCobrar()) {
      if (this.tienePreciosInvalidos()) {
        this.notify.showError(
          'Hay repuestos con precio inválido o menor al costo. Corríjalos para cobrar.',
        );
      }
      return;
    }

    const formVal = this.ventaForm.getRawValue();
    this.isProcesandoVenta.set(true);

    const detalles: DetalleVentaItem[] = this.carrito().map(
      (item: CarritoItem) => ({
        productoId: item.producto.id.toString(),
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: 0,
      }),
    );

    const clienteActual = this.clienteSeleccionado();

    const request: CreateVentaRequest = {
      clienteId: clienteActual ? String(clienteActual.id) : null,
      clienteDocumento: formVal.clienteDocumento?.trim() || '222222222222',
      clienteNombre:
        formVal.clienteNombre?.trim() || 'Consumidor Final / Mostrador',
      metodoPago: Number(formVal.metodoPago) || 1,
      detalles,
    };

    this.ventaService.registrarVenta(request).subscribe({
      next: (res: VentaResponse) => {
        this.isProcesandoVenta.set(false);
        this.notify.showSuccess(
          `¡Venta registrada exitosamente! Comprobante #${res.numeroComprobante || res.id}`,
        );

        this.dialog.open(TicketDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            venta: res,
            items: [...this.carrito()],
            clienteNombre: formVal.clienteNombre?.trim() || 'Consumidor Final',
            clienteDocumento:
              formVal.clienteDocumento?.trim() || '222222222222',
            metodoPago: formVal.metodoPago,
          },
        });

        this.limpiarCarrito();
        this.onToggleFacturaElectronica(false);
        this.buscarProductos(this.searchControl.value);
      },
      error: () => {
        this.isProcesandoVenta.set(false);
      },
    });
  }
}
