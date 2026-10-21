/**
 * @fileoverview Componente de Punto de Venta (POS) para MACROLATAS.
 * Gestiona el carrito mediante Signals, venta por mostrador predeterminada,
 * switch para Facturación Electrónica DIAN y edición flexible de precios en mostrador.
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  WritableSignal,
} from '@angular/core';
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

// Core
import { ProductoService } from '../../core/services/productos/producto.service';
import { VentaService } from '../../core/services/ventas/venta.service';
import { NotificationService } from '../../core/services/notification.service';
import { ClienteService } from '@core/services/clientes/cliente.service';
import { Producto } from '../../core/models/producto.models';
import {
  CreateVentaRequest,
  DetalleVentaItem,
} from '../../core/models/venta.models';
import {
  LISTA_METODOS_PAGO,
  MetodoPagoId,
} from '../../core/constants/pagos.constants';
import { Cliente } from '@core/models/cliente.models';
import { TicketDialogComponent } from './ticket-dialog/ticket-dialog.component';
import { ClienteDialogComponent } from './cliente-dialog/cliente-dialog.component';

/**
 * Representa un artículo en la cesta de compra con soporte para negociación de precio y margen.
 */
export interface CarritoItem {
  /** Instancia del repuesto seleccionado */
  producto: Producto;
  /** Cantidad de piezas a comprar */
  cantidad: number;
  /** Precio unitario final de venta (editable para mostrador) */
  precioUnitario: number;
  /** Costo de adquisición unitario */
  costoUnitario: number;
  /** Subtotal calculado: cantidad * precioUnitario */
  subtotal: number;
  /** Bandera reactiva que alerta si el precio negociado es inferior al costo */
  esBajoCosto: boolean;
}

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
  /** Servicio para operaciones de catálogo e inventario */
  private readonly productoService: ProductoService = inject(ProductoService);

  /** Servicio para registro y liquidación de ventas */
  private readonly ventaService: VentaService = inject(VentaService);

  /** Servicio de notificaciones y avisos */
  private readonly notify: NotificationService = inject(NotificationService);

  /** Servicio de diálogos modales de Angular Material */
  private readonly dialog: MatDialog = inject(MatDialog);

  /** Servicio para consulta y registro de clientes */
  private readonly clienteService: ClienteService = inject(ClienteService);

  /** Opciones de métodos de pago oficiales desde la constante central */
  readonly metodosPago = LISTA_METODOS_PAGO;

  /** Catálogo base recuperado desde el servidor */
  private readonly _productosBase: WritableSignal<Producto[]> = signal<
    Producto[]
  >([]);

  /** Ítems agregados actualmente al ticket de venta */
  readonly carrito: WritableSignal<CarritoItem[]> = signal<CarritoItem[]>([]);

  /** Indicador de consulta de catálogo en curso */
  readonly isBuscando: WritableSignal<boolean> = signal<boolean>(false);

  /** Indicador de procesamiento de cobro en curso */
  readonly isProcesandoVenta: WritableSignal<boolean> = signal<boolean>(false);

  /** Clientes coincidentes para el autocompletado */
  readonly clientesSugeridos: WritableSignal<Cliente[]> = signal<Cliente[]>([]);

  /** Cliente seleccionado formalmente */
  readonly clienteSeleccionado: WritableSignal<Cliente | null> =
    signal<Cliente | null>(null);

  /** Control reactivo para alternar entre venta simple de mostrador y factura electrónica */
  readonly requiereFacturaElectronica: WritableSignal<boolean> =
    signal<boolean>(false);

  /** Indicador para mostrar banner de cliente no registrado */
  readonly clienteNoEncontrado: WritableSignal<boolean> =
    signal<boolean>(false);

  /** Control reactivo del buscador de productos */
  readonly searchControl: FormControl<string> = new FormControl<string>('', {
    nonNullable: true,
  });

  /** Formulario reactivo de encabezado de venta */
  readonly ventaForm: FormGroup = new FormGroup({
    clienteDocumento: new FormControl<string>('222222222222'),
    clienteNombre: new FormControl<string>('Consumidor Final / Mostrador'),
    metodoPago: new FormControl<MetodoPagoId>('Efectivo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /**
   * Catálogo proyectado en tiempo real:
   * Descuenta visualmente las existencias en carrito por código y prioriza repuestos disponibles.
   */
  readonly productosDisponibles = computed(() => {
    const base: Producto[] = this._productosBase();
    const itemsCarrito: CarritoItem[] = this.carrito();

    const proyectados = base.map((prod: Producto) => {
      const enCarrito: CarritoItem | undefined = itemsCarrito.find(
        (c) => c.producto.codigo === prod.codigo,
      );
      const cantidadEnCarrito: number = enCarrito ? enCarrito.cantidad : 0;
      const stockDisponible: number = Math.max(
        0,
        prod.stockActual - cantidadEnCarrito,
      );

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

  /** Valor total acumulado a cobrar en el ticket */
  readonly subtotalVenta = computed(() =>
    this.carrito().reduce(
      (acc: number, item: CarritoItem) => acc + item.subtotal,
      0,
    ),
  );

  /** Sumatoria total de unidades físicas en el ticket */
  readonly cantidadItems = computed(() =>
    this.carrito().reduce(
      (acc: number, item: CarritoItem) => acc + item.cantidad,
      0,
    ),
  );

  /** Determina si el botón de cobrar debe estar habilitado */
  readonly puedeCobrar = computed(() => {
    const hayItems: boolean = this.carrito().length > 0;
    const metodoValido: boolean = !!this.ventaForm.get('metodoPago')?.value;
    const procesando: boolean = this.isProcesandoVenta();

    if (!hayItems || !metodoValido || procesando) return false;

    if (this.requiereFacturaElectronica()) {
      const doc = this.ventaForm.get('clienteDocumento')?.value?.trim();
      const nom = this.ventaForm.get('clienteNombre')?.value?.trim();
      return (
        !!doc &&
        doc !== '222222222222' &&
        !!nom &&
        nom !== 'Consumidor Final / Mostrador'
      );
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
      .subscribe((termino: string) => {
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

  /**
   * Agrega un repuesto al carrito identificándolo de forma inequívoca por su código único.
   */
  agregarAlCarrito(producto: Producto): void {
    const items: CarritoItem[] = [...this.carrito()];
    const index: number = items.findIndex(
      (i) => i.producto.codigo === producto.codigo,
    );
    const cantidadActualEnCarrito: number =
      index > -1 ? items[index].cantidad : 0;

    if (cantidadActualEnCarrito + 1 > producto.stockActual) {
      this.notify.showWarning(
        `Existencias agotadas para "${producto.nombre}".`,
      );
      return;
    }

    if (index > -1) {
      const cantActualizada: number = items[index].cantidad + 1;
      items[index] = {
        ...items[index],
        cantidad: cantActualizada,
        subtotal: cantActualizada * items[index].precioUnitario,
      };
    } else {
      const costo: number = producto.costo || 0;
      items.push({
        producto,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        costoUnitario: costo,
        subtotal: producto.precioVenta,
        esBajoCosto: producto.precioVenta > 0 && producto.precioVenta < costo,
      });
    }

    this.carrito.set(items);
  }

  /**
   * Actualiza el precio negociado en mostrador para un repuesto específico.
   * @param codigo Código único del repuesto.
   * @param nuevoPrecio Valor monetario asignado.
   */
  actualizarPrecioUnitario(codigo: string, nuevoPrecio: number): void {
    const precioNumerico: number = Number(nuevoPrecio) || 0;

    const items: CarritoItem[] = this.carrito().map((item: CarritoItem) => {
      if (item.producto.codigo === codigo) {
        const bajoCosto: boolean =
          precioNumerico > 0 && precioNumerico < item.costoUnitario;
        if (bajoCosto) {
          this.notify.showWarning(
            `Atención: El precio asignado ($${precioNumerico.toLocaleString('es-CO')}) es menor al costo de compra ($${item.costoUnitario.toLocaleString('es-CO')}).`,
          );
        }
        return {
          ...item,
          precioUnitario: precioNumerico,
          subtotal: item.cantidad * precioNumerico,
          esBajoCosto: bajoCosto,
        };
      }
      return item;
    });

    this.carrito.set(items);
  }

  /**
   * Modifica las existencias a facturar en una línea del ticket.
   */
  actualizarCantidad(codigo: string, cambio: number): void {
    const items: CarritoItem[] = this.carrito()
      .map((item: CarritoItem) => {
        if (item.producto.codigo === codigo) {
          const nuevaCantidad: number = item.cantidad + cambio;
          if (nuevaCantidad > item.producto.stockActual) {
            this.notify.showWarning(
              `Stock máximo alcanzado: ${item.producto.stockActual} unidades disponibles.`,
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
      .filter((item: CarritoItem) => item.cantidad > 0);

    this.carrito.set(items);
  }

  /**
   * Elimina un producto del ticket por su código.
   */
  eliminarDelCarrito(codigo: string): void {
    this.carrito.set(
      this.carrito().filter((i: CarritoItem) => i.producto.codigo !== codigo),
    );
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
  }

  /**
   * Alterna entre venta simple de mostrador y factura electrónica formal.
   */
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

  /**
   * Busca clientes en el servidor mientras se escribe en el input.
   */
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

  /**
   * Vincula un cliente seleccionado al formulario de venta.
   */
  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.clienteNoEncontrado.set(false);
    this.ventaForm.patchValue({
      clienteDocumento: cliente.documento,
      clienteNombre: cliente.nombre,
    });
    this.clientesSugeridos.set([]);
  }

  /**
   * Abre el modal para registrar un nuevo cliente pasando el documento y nombre digitados.
   */
  abrirModalNuevoCliente(): void {
    const docActual: string =
      this.ventaForm.get('clienteDocumento')?.value || '';
    const nombreActual: string =
      this.ventaForm.get('clienteNombre')?.value || '';

    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        documentoInicial: docActual === '222222222222' ? '' : docActual,
        nombreInicial:
          nombreActual === 'Consumidor Final / Mostrador' ? '' : nombreActual,
      },
    });

    dialogRef.afterClosed().subscribe((clienteCreado: Cliente | null) => {
      if (clienteCreado) {
        this.seleccionarCliente(clienteCreado);
        this.notify.showSuccess(`Cliente "${clienteCreado.nombre}" vinculado.`);
      }
    });
  }

  /**
   * Liquida la transacción en el backend y abre el ticket térmico de impresión.
   */
  procesarVenta(): void {
    if (!this.puedeCobrar()) {
      return;
    }

    const formVal = this.ventaForm.getRawValue();
    this.isProcesandoVenta.set(true);

    const detalles: DetalleVentaItem[] = this.carrito().map(
      (item: CarritoItem) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: 0,
      }),
    );

    const request: CreateVentaRequest = {
      clienteDocumento: formVal.clienteDocumento?.trim() || '222222222222',
      clienteNombre:
        formVal.clienteNombre?.trim() || 'Consumidor Final / Mostrador',
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
            clienteNombre: formVal.clienteNombre?.trim() || 'Consumidor Final',
            clienteDocumento:
              formVal.clienteDocumento?.trim() || '222222222222',
            metodoPago: formVal.metodoPago,
          },
        });

        // Limpieza y restauración a mostrador
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
