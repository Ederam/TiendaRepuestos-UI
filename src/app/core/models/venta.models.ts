export interface DetalleVentaItem {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface CreateVentaRequest {
  clienteDocumento?: string;
  clienteNombre?: string;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  detalles: DetalleVentaItem[];
}

export interface VentaResponse {
  id: number;
  numeroFactura: string;
  fecha: string;
  total: number;
}
