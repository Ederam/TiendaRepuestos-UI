/**
 * @fileoverview Modelos y DTOs para repuestos automotrices en MACROLATAS.
 * Soporta inventario multiorigen, marcas alternativas y condiciones (Nuevo/Segunda).
 */

export type CondicionRepuesto = 'Nuevo' | 'Segunda';
export type OrigenInventario =
  | 'PROPIO_MACROLATAS'
  | 'ALIADO_EUROCAR'
  | 'ALIADO_LATAS';

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  nombreCategoria?: string;
  marcaRepuesto?: string; // Ej: TYC, DEPO, CHINA, ORIGINAL
  marcaVehiculo?: string; // Ej: TOYOTA, CHEVROLET, RENAULT
  condicion: CondicionRepuesto; // Nuevo o Segunda
  origen: OrigenInventario; // MACROLATAS o Aliado
  ubicacion?: string; // Ej: B-3-PISO, BI-F15
  costo: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export interface CreateProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  marcaRepuesto?: string;
  marcaVehiculo?: string;
  condicion?: CondicionRepuesto;
  origen?: OrigenInventario;
  ubicacion?: string;
  costo: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
}

export interface CargaMasivaItemRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaNombre?: string;
  marcaRepuesto?: string;
  marcaVehiculo?: string;
  condicion: CondicionRepuesto;
  origen: OrigenInventario;
  ubicacion?: string;
  costo: number;
  precioVenta: number;
  stockActual: number;
}

export interface CargaMasivaResponse {
  totalProcesados: number;
  insertados: number;
  actualizados: number;
  sinCambios: number;
  omitidos: number;
  mensajes: string[];
}
