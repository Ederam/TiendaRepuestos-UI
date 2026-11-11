/**
 * @fileoverview Componente del Ticket de Venta y Cobro para el Punto de Venta (POS).
 * Responsable exclusivo de la gestión de ítems en ticket, control de precios acordados,
 * selección asistida de cliente (Mostrador vs DIAN) y ejecución del cobro (SRP).
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Servicios y Modelos
import { VentaService } from '@core/services/ventas/venta.service';
import { ClienteService } from '@core/services/clientes/cliente.service';
import { AuthService } from '@core/services/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { PosCartService, CarritoItem } from '../../services/pos-cart.service';
import { Cliente } from '@core/models/cliente.models';
import {
  CreateVentaRequest,
  DetalleVentaItem,
  VentaResponse,
} from '@core/models/venta.models';
import { LISTA_METODOS_PAGO } from '@core/constants/pagos.constants';
import { TicketDialogComponent } from '../../ticket-dialog/ticket-dialog.component';
import { ClienteDialogComponent } from '../../cliente-dialog/cliente-dialog.component';
import { obtenerPosicionLado } from '@core/utils/sku-generator.util';

/**
 * Constantes institucionales para la venta de mostrador
 */
export const CONSUMIDOR_FINAL_DOC = '111111111111';
export const CONSUMIDOR_FINAL_NOM = 'CLIENTE MOSTRADOR';

@Component({
  selector: 'app-pos-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
  ],
  templateUrl: './pos-ticket.component.html',
  styleUrl: './pos-ticket.component.scss',
})
export class PosTicketComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly cartService = inject(PosCartService);

  @Output() ventaExitosa = new EventEmitter<VentaResponse>();

  readonly metodosPago = LISTA_METODOS_PAGO;
  readonly obtenerPosicionLado = obtenerPosicionLado;

  // Estado del proceso de venta
  readonly isProcesandoVenta = signal<boolean>(false);
  readonly requiereFacturaElectronica = signal<boolean>(false);
  readonly clientesSugeridos = signal<Cliente[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly clienteNoEncontrado = signal<boolean>(false);

  // Señales sincronizadas del cliente y pago
  readonly clienteDocSignal = signal<string>(CONSUMIDOR_FINAL_DOC);
  readonly clienteNomSignal = signal<string>(CONSUMIDOR_FINAL_NOM);
  readonly metodoPagoSignal = signal<number>(1);

  // Formulario reactivo
  readonly ventaForm = new FormGroup({
    clienteDocumento: new FormControl<string>(CONSUMIDOR_FINAL_DOC, {
      nonNullable: true,
    }),
    clienteNombre: new FormControl<string>(CONSUMIDOR_FINAL_NOM, {
      nonNullable: true,
    }),
    metodoPago: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Puentes a Signals del carrito
  readonly carrito = this.cartService.items;
  readonly subtotalVenta = this.cartService.subtotal;
  readonly cantidadItems = this.cartService.cantidadItems;
  readonly tienePreciosInvalidos = this.cartService.tienePreciosInvalidos;

  /**
   * Validador reactivo puro que habilita o deshabilita la orden de cobro.
   */
  readonly puedeCobrar = computed(() => {
    const hayItems = this.carrito().length > 0;
    const metodoValido = this.metodoPagoSignal() > 0;
    const procesando = this.isProcesandoVenta();
    const preciosValidos = !this.tienePreciosInvalidos();

    if (!hayItems || !metodoValido || procesando || !preciosValidos) {
      return false;
    }

    if (this.requiereFacturaElectronica()) {
      const doc = this.clienteDocSignal().trim();
      const nom = this.clienteNomSignal().trim();
      const esMostrador =
        doc === CONSUMIDOR_FINAL_DOC || nom === CONSUMIDOR_FINAL_NOM;
      return doc.length >= 3 && nom.length >= 3 && !esMostrador;
    }

    return true;
  });

  ngOnInit(): void {
    // Sincronización reactiva bidireccional y limpieza inmediata de nombre
    this.ventaForm.get('clienteDocumento')?.valueChanges.subscribe((v) => {
      const doc = (v || '').trim();
      this.clienteDocSignal.set(doc);

      // Si el operador cambia o borra el documento y no coincide con el cliente actual,
      // desvincularlo y limpiar inmediatamente el campo clienteNombre
      const actual = this.clienteSeleccionado();
      if (actual && actual.documento !== doc) {
        this.clienteSeleccionado.set(null);
        this.clienteNomSignal.set('');
        this.ventaForm.patchValue({ clienteNombre: '' }, { emitEvent: false });
      } else if (!actual && doc !== CONSUMIDOR_FINAL_DOC) {
        // En modo DIAN sin cliente confirmado, si cambia el doc se limpia el nombre anterior
        this.clienteNomSignal.set('');
        this.ventaForm.patchValue({ clienteNombre: '' }, { emitEvent: false });
      }
    });

    this.ventaForm.get('clienteNombre')?.valueChanges.subscribe((v) => {
      this.clienteNomSignal.set(v || '');
    });

    this.ventaForm.get('metodoPago')?.valueChanges.subscribe((v) => {
      this.metodoPagoSignal.set(Number(v) || 1);
    });
  }

  onPrecioInput(event: Event, codigo: string): void {
    const input = event.target as HTMLInputElement;
    // Sanitizar entrada numérica eliminando cualquier cero residual a la izquierda
    const soloDigitos = input.value.replace(/[^\d]/g, '');
    const rawLimpio = soloDigitos.replace(/^0+(?=\d)/, '');

    if (input.value !== rawLimpio) {
      input.value = rawLimpio;
    }

    const precioNumerico = Number(rawLimpio) || 0;
    this.actualizarPrecioUnitario(codigo, precioNumerico);
  }

  actualizarPrecioUnitario(codigo: string, valorInput: any): void {
    // Sanitizar a valor numérico puro eliminando ceros a la izquierda
    let precioLimpio = 0;
    if (typeof valorInput === 'string') {
      const sanitized = valorInput.replace(/^0+(?=\d)/, '');
      precioLimpio = Number(sanitized) || 0;
    } else if (typeof valorInput === 'number') {
      precioLimpio = isNaN(valorInput) ? 0 : valorInput;
    }

    const val = this.cartService.actualizarPrecioUnitario(codigo, precioLimpio);
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

  irAlHistorial(): void {
    this.router.navigate(['/pos/historial']);
  }

  onToggleFacturaElectronica(requiere: boolean): void {
    this.requiereFacturaElectronica.set(requiere);
    this.clienteNoEncontrado.set(false);

    if (!requiere) {
      this.clienteSeleccionado.set(null);
      this.clienteDocSignal.set(CONSUMIDOR_FINAL_DOC);
      this.clienteNomSignal.set(CONSUMIDOR_FINAL_NOM);
      this.ventaForm.patchValue({
        clienteDocumento: CONSUMIDOR_FINAL_DOC,
        clienteNombre: CONSUMIDOR_FINAL_NOM,
      });
    } else {
      this.clienteSeleccionado.set(null);
      this.clienteDocSignal.set('');
      this.clienteNomSignal.set('');
      this.ventaForm.patchValue({
        clienteDocumento: '',
        clienteNombre: '',
      });
    }
  }

  /**
   * Búsqueda reactiva de clientes con limpieza inmediata en caso de no coincidencia.
   */
  onBuscarCliente(valor: string): void {
    if (!valor || valor.trim().length < 2) {
      this.clientesSugeridos.set([]);
      this.clienteNoEncontrado.set(false);
      if (!this.clienteSeleccionado()) {
        this.clienteNomSignal.set('');
        this.ventaForm.patchValue({ clienteNombre: '' }, { emitEvent: false });
      }
      return;
    }

    this.clienteService.buscarPorTermino(valor.trim()).subscribe({
      next: (res: Cliente[]) => {
        this.clientesSugeridos.set(res);
        const noEncontrado = res.length === 0;
        this.clienteNoEncontrado.set(noEncontrado);

        // Si no se encuentra ningún cliente en el directorio, limpiar inmediatamente el campo clienteNombre
        if (noEncontrado) {
          this.clienteSeleccionado.set(null);
          this.clienteNomSignal.set('');
          this.ventaForm.patchValue(
            { clienteNombre: '' },
            { emitEvent: false },
          );
        }
      },
      error: () => {
        this.clientesSugeridos.set([]);
        this.clienteNoEncontrado.set(true);
        this.clienteSeleccionado.set(null);
        this.clienteNomSignal.set('');
        this.ventaForm.patchValue({ clienteNombre: '' }, { emitEvent: false });
      },
    });
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.clienteNoEncontrado.set(false);

    this.clienteDocSignal.set(cliente.documento);
    this.clienteNomSignal.set(cliente.nombre);

    this.ventaForm.patchValue({
      clienteDocumento: cliente.documento,
      clienteNombre: cliente.nombre,
    });

    this.clientesSugeridos.set([]);
  }

  abrirModalNuevoCliente(): void {
    const docActual = this.clienteDocSignal();
    const nomActual = this.clienteNomSignal();

    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        documentoInicial: docActual === CONSUMIDOR_FINAL_DOC ? '' : docActual,
        nombreInicial: nomActual === CONSUMIDOR_FINAL_NOM ? '' : nomActual,
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
    const documentoFinal =
      this.clienteDocSignal().trim() || CONSUMIDOR_FINAL_DOC;
    const nombreFinal = this.clienteNomSignal().trim() || CONSUMIDOR_FINAL_NOM;
    const metodoPagoFinal = this.metodoPagoSignal();
    const nombreVendedor =
      this.authService.currentUser()?.nombreCompleto || 'Atención Mostrador';

    const request: CreateVentaRequest = {
      clienteId: clienteActual ? String(clienteActual.id) : null,
      clienteDocumento: documentoFinal,
      clienteNombre: nombreFinal,
      metodoPago: metodoPagoFinal,
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
            clienteNombre: nombreFinal,
            clienteDocumento: documentoFinal,
            vendedorNombre: nombreVendedor,
            metodoPago:
              metodoPagoFinal === 1
                ? 'Efectivo'
                : metodoPagoFinal === 2
                  ? 'Transferencia'
                  : 'Tarjeta',
          },
        });

        // Limpiar canasta y reestablecer mostrador
        this.cartService.limpiar();
        this.onToggleFacturaElectronica(false);

        // Notificar al orquestador POS
        this.ventaExitosa.emit(res);
      },
      error: () => {
        this.isProcesandoVenta.set(false);
      },
    });
  }
}
