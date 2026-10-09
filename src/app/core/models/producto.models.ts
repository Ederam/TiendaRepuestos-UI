export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  nombreCategoria?: string;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export interface CreateProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
}
