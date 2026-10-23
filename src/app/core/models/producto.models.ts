/**
 * @fileoverview Modelos de dominio y contratos DTO para el catálogo e inventario automotriz de MACROLATAS.
 * Proporciona soporte para catálogo multiorigen (propio y aliados), estados de repuesto y persistencia masiva.
 */

/**
 * Define la condición física o procedencia del repuesto automotriz.
 */
export type CondicionRepuesto = 'Nuevo' | 'Segunda';

/**
 * Identifica el origen de adquisición o propiedad del inventario.
 */
export type OrigenInventario =
  | 'PROPIO_MACROLATAS'
  | 'ALIADO_EUROCAR'
  | 'ALIADO_LATAS';

/**
 * Representa la entidad central de un repuesto automotriz dentro de la SPA.
 */
export interface Producto {
  /** Identificador único autonumérico o subrogado */
  id: string;
  /** Código técnico o referencia de fabricante */
  codigo: string;
  /** Nombre comercial o descripción principal */
  nombre: string;
  /** Descripción complementaria o aplicaciones vehiculares */
  descripcion?: string;
  /** Identificador de la categoría asignada */
  categoriaId: number;
  /** Nombre descriptivo de la categoría */
  nombreCategoria?: string;
  /** Marca de la pieza de recambio (Ej: TYC, DEPO, CHINA, ORIGINAL) */
  marcaRepuesto?: string;
  /** Marca del vehículo compatible (Ej: TOYOTA, CHEVROLET, RENAULT) */
  marcaVehiculo?: string;
  /** Condición de la pieza: Nuevo o Segunda */
  condicion: CondicionRepuesto;
  /** Procedencia del catálogo: inventario propio o proveedor aliado */
  origen: OrigenInventario;
  /** Ubicación física en bodega o estante (Ej: B-3-PISO, BODEGA PRINCIPAL) */
  ubicacion?: string;
  /** Costo monetario de adquisición unitario */
  costo: number;
  /** Precio final sugerido de venta al público */
  precioVenta: number;
  /** Saldo actual en stock físico */
  stockActual: number;
  /** Umbral mínimo de stock para disparo de alertas */
  stockMinimo: number;
  /** Estado de activación lógica del producto */
  activo: boolean;
}

/**
 * Contrato de solicitud para la creación manual individual de un repuesto.
 */
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

/**
 * Contrato de elemento individual emitido por las estrategias de parseo (SheetJS)
 * hacia los adaptadores de persistencia masiva.
 */
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

/**
 * Contrato de respuesta cuantitativa estructurada devuelta por el proceso de Upsert masivo.
 */
export interface CargaMasivaResponse {
  /** Cantidad total de registros recibidos y analizados en el lote */
  totalProcesados: number;
  /** Cantidad de nuevos repuestos creados en el catálogo */
  insertados: number;
  /** Cantidad de repuestos preexistentes que sufrieron modificaciones en valores */
  actualizados: number;
  /** Cantidad de repuestos preexistentes cuyos datos eran idénticos (sin cambios) */
  sinCambios: number;
  /** Cantidad de filas descartadas por falta de campos obligatorios */
  omitidos: number;
  /** Mensajes explicativos del resultado de la transacción */
  mensajes: string[];
}
