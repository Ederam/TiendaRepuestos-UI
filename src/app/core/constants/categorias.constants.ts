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
 * Píldoras homologadas de familias y tipos de autoparte en MAYÚSCULAS para POS e Inventario.
 */
export const FILTROS_TIPO_REPUESTO: readonly FiltroRapidoOpcion[] = [
  { label: 'TODOS', valor: '' },
  { label: 'FAROLAS', valor: 'FAROLA' },
  { label: 'STOPS', valor: 'STOP' },
  { label: 'BOMPERES', valor: 'BOMPER' },
  { label: 'CAPOTS', valor: 'CAPOT' },
  { label: 'PERSIANAS', valor: 'PERSIANA' },
  { label: 'DIRECCIONALES', valor: 'DIRECCIONAL' },
  { label: 'ESPEJOS', valor: 'ESPEJO' },
  { label: 'GUARDABARROS', valor: 'GUARDABARRO' },
] as const;

/**
 * Píldoras homologadas de marcas automotrices en MAYÚSCULAS para POS e Inventario.
 */
export const FILTROS_MARCA_VEHICULO: readonly FiltroRapidoOpcion[] = [
  { label: 'TODAS', valor: '' },
  { label: 'CHEVROLET', valor: 'CHEVROLET' },
  { label: 'RENAULT', valor: 'RENAULT' },
  { label: 'MAZDA', valor: 'MAZDA' },
  { label: 'KIA', valor: 'KIA' },
  { label: 'HYUNDAI', valor: 'HYUNDAI' },
  { label: 'TOYOTA', valor: 'TOYOTA' },
  { label: 'NISSAN', valor: 'NISSAN' },
  { label: 'FORD', valor: 'FORD' },
  { label: 'VOLKSWAGEN', valor: 'VOLKSWAGEN' },
] as const;

/**
 * Alias de compatibilidad para mostrador POS - Fila 1: Marcas populares (homologado)
 */
export const FILTROS_MARCAS_POS: readonly FiltroRapidoOpcion[] = FILTROS_MARCA_VEHICULO;

/**
 * Alias de compatibilidad para mostrador POS - Fila 2: Tipos de autoparte (homologado)
 */
export const FILTROS_TIPOS_POS: readonly FiltroRapidoOpcion[] = FILTROS_TIPO_REPUESTO;

/**
 * Diccionario de sinónimos y variantes terminológicas de colisión para búsqueda inteligente.
 * Normaliza términos equivalentes como BOMPER <-> BUMPER <-> DEFENSA bajo la misma condición.
 */
export const SINONIMOS_COLISION: Record<string, readonly string[]> = {
  BOMPER: ['BOMPER', 'BOMPERES', 'BUMPER', 'BUMPERS', 'DEFENSA', 'DEFENSAS'],
  BUMPER: ['BOMPER', 'BOMPERES', 'BUMPER', 'BUMPERS', 'DEFENSA', 'DEFENSAS'],
  FAROLA: ['FAROLA', 'FAROLAS', 'FARO', 'FAROS'],
  STOP: ['STOP', 'STOPS'],
  DIRECCIONAL: ['DIRECCIONAL', 'DIRECCIONALES'],
  CAPOT: ['CAPOT', 'CAPOTS', 'CAPO'],
  PERSIANA: ['PERSIANA', 'PERSIANAS', 'REJILLA', 'REJILLAS'],
  ESPEJO: ['ESPEJO', 'ESPEJOS', 'RETROVISOR', 'RETROVISORES'],
  GUARDABARRO: ['GUARDABARRO', 'GUARDABARROS', 'GUARDAPOLVO'],
};

/**
 * Obtiene las variantes de búsqueda de un término de colisión o el término mismo.
 */
export function obtenerSinonimosColision(termino: string): readonly string[] {
  if (!termino) return [];
  const upper = termino.toUpperCase().trim();
  return SINONIMOS_COLISION[upper] || [upper];
}

/**
 * Evalúa si una cadena de texto contiene el término solicitado o cualquiera de sus sinónimos.
 */
export function coincideSinonimoColision(texto: string, termino: string): boolean {
  if (!termino) return true;
  const upperTexto = texto.toUpperCase();
  const variantes = obtenerSinonimosColision(termino);
  return variantes.some((v) => upperTexto.includes(v));
}
