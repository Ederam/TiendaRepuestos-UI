/**
 * @fileoverview Contratos de datos (DTOs) para transacciones de venta en MACROLATAS.
 */

import { MetodoPagoId } from '../constants/pagos.constants';

export interface DetalleVentaItem {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface CreateVentaRequest {
  clienteDocumento?: string;
  clienteNombre?: string;
  metodoPago: MetodoPagoId;
  detalles: DetalleVentaItem[];
}

export interface VentaResponse {
  id: number;
  numeroFactura: string;
  fecha: string;
  total: number;
}