/**
 * @fileoverview Contrato base (Clase Abstracta / Puerto) para el registro de ventas.
 * No declara dependencias de infraestructura para permitir múltiples adaptadores (HTTP o Mock).
 */

import { Observable } from 'rxjs';
import { CreateVentaRequest, VentaResponse } from '../../models/venta.models';

export abstract class VentaService {
    /**
     * Registra una venta en el sistema y retorna el resumen de la factura generada.
     * @param request Datos de la transacción, cliente, método de pago y detalle de repuestos.
     */
    abstract registrarVenta(request: CreateVentaRequest): Observable<VentaResponse>;
}