/**
 * @fileoverview Adaptador en memoria (Mock) de VentaService para simular facturación.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { VentaService } from './venta.service';
import { CreateVentaRequest, VentaResponse } from '../../models/venta.models';
import { MOCK_PRODUCTOS } from '../../mocks/repuestos.mock';

@Injectable()
export class VentaMockService extends VentaService {
    override registrarVenta(request: CreateVentaRequest): Observable<VentaResponse> {
        // Descontar inventario en el mock para verificar reactividad de stock
        request.detalles.forEach((d) => {
            const prod = MOCK_PRODUCTOS.find((p) => p.id === d.productoId);
            if (prod) {
                prod.stockActual = Math.max(0, prod.stockActual - d.cantidad);
            }
        });

        const total = request.detalles.reduce((acc, d) => acc + d.cantidad * d.precioUnitario, 0);

        const response: VentaResponse = {
            id: Math.floor(Math.random() * 9000) + 1000,
            numeroFactura: `FAC-${Math.floor(Math.random() * 90000) + 10000}`,
            fecha: new Date().toISOString(),
            total
        };

        return of(response).pipe(delay(300));
    }
}