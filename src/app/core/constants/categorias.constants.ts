/**
 * @fileoverview Catálogo oficial de categorías de repuestos para MACROLATAS.
 * Fuente única de verdad para clasificación en inventario y formularios.
 */

export interface CategoriaOption {
    id: number;
    nombre: string;
}

export const CATEGORIAS_REPUESTOS: readonly CategoriaOption[] = [
    { id: 1, nombre: 'Latas y Carrocería' },
    { id: 2, nombre: 'Bumpers y Defensas' },
    { id: 3, nombre: 'Iluminación' },
    { id: 4, nombre: 'Mecánica Rápida' }
] as const;