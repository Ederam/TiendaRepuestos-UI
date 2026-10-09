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
