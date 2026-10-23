/**
 * @fileoverview Adaptador en memoria (Mock) de VentaService para pruebas unitarias y desarrollo offline.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { VentaService } from './venta.service';
import {
  CreateVentaRequest,
  VentaResponse,
  DetalleVentaResponse,
} from '../../models/venta.models';
import { MOCK_PRODUCTOS } from '../../mocks/repuestos.mock';

/**
 * Simula el comportamiento del backend persistiendo en memoria local durante la sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class VentaMockService extends VentaService {
  private mockVentas: VentaResponse[] = [];
  private contadorConsecutivo = 1;

  override registrarVenta(
    request: CreateVentaRequest,
  ): Observable<VentaResponse> {
    const detallesProcesados: DetalleVentaResponse[] = [];
    let subtotalCalculado = 0;

    request.detalles.forEach((d) => {
      const prod = MOCK_PRODUCTOS.find((p) => p.id === d.productoId);
      if (prod) {
        prod.stockActual = Math.max(0, prod.stockActual - d.cantidad);
      }

      const precioUnitario = d.precioUnitario ?? prod?.precioVenta ?? 0;
      const subtotalItem = d.cantidad * precioUnitario;
      subtotalCalculado += subtotalItem;

      detallesProcesados.push({
        id: crypto.randomUUID(),
        productoId: d.productoId,
        nombreProducto: prod ? prod.nombre : 'Repuesto Automotriz',
        cantidad: d.cantidad,
        precioUnitario,
        subtotal: subtotalItem,
      });
    });

    const metodoTexto =
      request.metodoPago === 1
        ? 'Efectivo'
        : request.metodoPago === 2
          ? 'Transferencia'
          : 'Tarjeta';

    const response: VentaResponse = {
      id: crypto.randomUUID(),
      numeroComprobante: `VTA-${this.contadorConsecutivo.toString().padStart(5, '0')}`,
      fechaVenta: new Date().toISOString(),
      metodoPago: metodoTexto,
      estado: 'Completada',
      clienteId: request.clienteId ?? null,
      clienteDocumento: request.clienteDocumento || '222222222222',
      clienteNombre: request.clienteNombre || 'Consumidor Final',
      subtotal: subtotalCalculado,
      impuesto: 0,
      total: subtotalCalculado,
      detalles: detallesProcesados,
    };

    this.contadorConsecutivo++;
    this.mockVentas.unshift(response);

    return of(response).pipe(delay(300));
  }

  override obtenerVentas(): Observable<VentaResponse[]> {
    return of(this.mockVentas).pipe(delay(200));
  }

  override obtenerVentaPorId(id: string): Observable<VentaResponse> {
    const venta = this.mockVentas.find((v) => v.id === id);
    if (!venta) {
      throw new Error(`Comprobante no localizado con id: ${id}`);
    }
    return of(venta).pipe(delay(200));
  }
}
