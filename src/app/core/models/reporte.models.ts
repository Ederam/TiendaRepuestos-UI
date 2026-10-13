/**
 * @fileoverview DTOs y modelos de métricas operativas y financieras para MACROLATAS.
 */

export interface MetricasResumen {
  ventasHoyTotal: number;
  ingresosHoyMonto: number;
  repuestosStockCritico: number;
  totalReferenciasActivas: number;
}

export interface RepuestoTopVentas {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
}

export interface MetodoPagoDistribucion {
  metodoPago: string;
  cantidadTransacciones: number;
  totalMonto: number;
  porcentaje: number;
}

export interface DashboardReporteResponse {
  resumen: MetricasResumen;
  topRepuestos: RepuestoTopVentas[];
  distribucionPagos: MetodoPagoDistribucion[];
}

export interface StockCriticoItem {
  productoId: number;
  codigo: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  deficit: number;
}

export interface TopVendidoItem {
  productoId: number;
  nombre: string;
  totalUnidadesVendidas: number;
  totalRecaudado: number;
}
