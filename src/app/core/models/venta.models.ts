/**
 * @fileoverview Contratos de datos tipados (DTOs) para transacciones de venta y facturación en MACROLATAS.
 * Sincronizado estrictamente con los contratos REST de ASP.NET Core 8 Web API.
 */

/**
 * Representa un renglón individual dentro de la solicitud de venta.
 */
export interface DetalleVentaItem {
  /** Identificador único global (UUID/GUID) del repuesto a descargar de inventario */
  productoId: string;
  /** Cantidad de unidades a facturar */
  cantidad: number;
  /** Precio unitario de venta (opcional en request, el backend valida contra catálogo) */
  precioUnitario?: number;
  /** Valor monetario de descuento unitario aplicado */
  descuento?: number;
}

/**
 * Estructura del cuerpo (Payload) enviada al endpoint POST /api/Ventas.
 */
export interface CreateVentaRequest {
  /** Modalidad de pago: 1 = Efectivo, 2 = Transferencia, 3 = Tarjeta */
  metodoPago: number;
  /** Identificador único del cliente registrado (opcional) */
  clienteId?: string | null;
  /** Documento o NIT del comprador. Null para asignar 222222222222 por defecto */
  clienteDocumento?: string | null;
  /** Nombre o razón social del comprador. Null para asignar Consumidor Final */
  clienteNombre?: string | null;
  /** Lista de repuestos y cantidades a procesar */
  detalles: DetalleVentaItem[];
}

/**
 * Renglón individual de detalle retornado en la respuesta oficial de la venta.
 */
export interface DetalleVentaResponse {
  /** Identificador único del registro de detalle (GUID) */
  id: string;
  /** Identificador del producto vendido (GUID) */
  productoId: string;
  /** Snapshot del nombre del repuesto al momento de la transacción */
  nombreProducto: string;
  /** Cantidad de piezas vendidas */
  cantidad: number;
  /** Precio unitario congelado en la venta */
  precioUnitario: number;
  /** Subtotal de la línea (cantidad * precioUnitario) */
  subtotal: number;
}

/**
 * Estructura de respuesta del comprobante fiscal retornado por el backend (201 Created / 200 OK).
 */
export interface VentaResponse {
  /** Identificador único global (UUID/GUID) de la venta */
  id: string;
  /** Folio consecutivo oficial emitido por la secuencia de base de datos (ej: VTA-00001) */
  numeroComprobante: string;
  /** Fecha y hora UTC del registro de la transacción */
  fechaVenta: string;
  /** Nombre textual del método de pago (Efectivo, Transferencia, Tarjeta) */
  metodoPago: string;
  /** Estado del comprobante (Completada, Anulada) */
  estado: string;
  /** Identificador del cliente (si fue asociado) */
  clienteId?: string | null;
  /** Documento de identidad o NIT fiscal */
  clienteDocumento: string;
  /** Nombre o razón social del cliente */
  clienteNombre: string;
  /** Subtotal monetario acumulado antes de impuestos */
  subtotal: number;
  /** Monto de impuesto liquidado */
  impuesto: number;
  /** Total neto final de la factura */
  total: number;
  /** Colección de repuestos asociados a la transacción */
  detalles: DetalleVentaResponse[];
}
