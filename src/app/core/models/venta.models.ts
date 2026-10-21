/**
 * @fileoverview Contratos de datos (DTOs) para transacciones de venta en MACROLATAS.
 * Define la estructura de ítems de detalle, peticiones de cobro y respuestas de facturación.
 */

import { MetodoPagoId } from '../constants/pagos.constants';

/**
 * Representa una línea individual de producto dentro del registro de venta.
 */
export interface DetalleVentaItem {
  /** Identificador único del repuesto vendido */
  productoId: number;
  /** Cantidad de unidades facturadas */
  cantidad: number;
  /** Precio unitario acordado en mostrador */
  precioUnitario: number;
  /** Valor monetario de descuento aplicado (opcional) */
  descuento?: number;
}

/**
 * Petición enviada al backend para registrar y persistir una venta.
 */
export interface CreateVentaRequest {
  /** Documento de identidad o NIT del comprador (opcional para mostrador) */
  clienteDocumento?: string;
  /** Nombre o razón social del comprador */
  clienteNombre?: string;
  /** Método de pago acordado */
  metodoPago: MetodoPagoId;
  /** Colección de repuestos facturados */
  detalles: DetalleVentaItem[];
}

/**
 * Respuesta emitida por el backend tras consolidar la venta.
 */
export interface VentaResponse {
  /** Identificador único autonumérico de la transacción */
  id: number;
  /** Número consecutivo fiscal o de remisión */
  numeroFactura: string;
  /** Fecha y hora ISO de la transacción */
  fecha: string;
  /** Valor total liquidado */
  total: number;
}
