/**
 * @fileoverview Catálogo oficial de categorías y filtros rápidos de repuestos para MACROLATAS.
 * Fuente única de verdad para clasificación en inventario, POS y formularios.
 */

export interface CategoriaOption {
  id: number;
  nombre: string;
}

export const CATEGORIAS_REPUESTOS: readonly CategoriaOption[] = [
  { id: 1, nombre: 'Latas y Carrocería' },
  { id: 2, nombre: 'Bumpers y Defensas' },
  { id: 3, nombre: 'Iluminación' },
  { id: 4, nombre: 'Mecánica Rápida' },
] as const;

/**
 * Estructura de píldoras de filtro rápido con etiqueta visual y valor de coincidencia de catálogo.
 */
export interface FiltroRapidoOpcion {
  label: string;
  valor: string;
}

/**
 * Píldoras de familias y tipos de autoparte (con valor singular coincidente con catálogo).
 */
export const FILTROS_TIPO_REPUESTO: readonly FiltroRapidoOpcion[] = [
  { label: 'Todas las piezas', valor: '' },
  { label: 'Farolas', valor: 'FAROLA' },
  { label: 'Stops', valor: 'STOP' },
  { label: 'Bomperes', valor: 'BOMPER' },
  { label: 'Capots', valor: 'CAPOT' },
  { label: 'Direccionales', valor: 'DIRECCIONAL' },
  { label: 'Persianas', valor: 'PERSIANA' },
  { label: 'Espejos', valor: 'ESPEJO' },
  { label: 'Guardabarros', valor: 'GUARDABARRO' },
] as const;

/**
 * Píldoras de marcas automotrices más comerciales en MACROLATAS.
 */
export const FILTROS_MARCA_VEHICULO: readonly FiltroRapidoOpcion[] = [
  { label: 'Todas las marcas', valor: '' },
  { label: 'Chevrolet', valor: 'CHEVROLET' },
  { label: 'Renault', valor: 'RENAULT' },
  { label: 'Mazda', valor: 'MAZDA' },
  { label: 'Nissan', valor: 'NISSAN' },
  { label: 'Toyota', valor: 'TOYOTA' },
  { label: 'Ford', valor: 'FORD' },
  { label: 'Kia', valor: 'KIA' },
  { label: 'Hyundai', valor: 'HYUNDAI' },
  { label: 'Volkswagen', valor: 'VOLKSWAGEN' },
] as const;

/**
 * Píldoras ergonómicas para mostrador POS - Fila 1: Marcas populares
 */
export const FILTROS_MARCAS_POS: readonly FiltroRapidoOpcion[] = [
  { label: 'TODAS', valor: '' },
  { label: 'CHEVROLET', valor: 'CHEVROLET' },
  { label: 'RENAULT', valor: 'RENAULT' },
  { label: 'MAZDA', valor: 'MAZDA' },
  { label: 'KIA', valor: 'KIA' },
  { label: 'HYUNDAI', valor: 'HYUNDAI' },
  { label: 'TOYOTA', valor: 'TOYOTA' },
  { label: 'NISSAN', valor: 'NISSAN' },
] as const;

/**
 * Píldoras ergonómicas para mostrador POS - Fila 2: Tipos de autoparte
 */
export const FILTROS_TIPOS_POS: readonly FiltroRapidoOpcion[] = [
  { label: 'TODOS', valor: '' },
  { label: 'FAROLAS', valor: 'FAROLA' },
  { label: 'STOPS', valor: 'STOP' },
  { label: 'BOMPERES', valor: 'BOMPER' },
  { label: 'CAPOTS', valor: 'CAPOT' },
  { label: 'PERSIANAS', valor: 'PERSIANA' },
  { label: 'DIRECCIONALES', valor: 'DIRECCIONAL' },
] as const;
