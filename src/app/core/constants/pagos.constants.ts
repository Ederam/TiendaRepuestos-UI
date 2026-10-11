/**
 * @fileoverview Catálogo de métodos de pago soportados en el sistema POS MACROLATAS.
 * Fuente única de verdad para transacciones comerciales.
 */

export const METODOS_PAGO = {
    EFECTIVO: { id: 'Efectivo', label: 'Efectivo' },
    TRANSFERENCIA: { id: 'Transferencia', label: 'Transferencia (Nequi / Daviplata / Bancolombia)' },
    TARJETA: { id: 'Tarjeta', label: 'Tarjeta Débito / Crédito' }
} as const;

export type MetodoPagoId = typeof METODOS_PAGO[keyof typeof METODOS_PAGO]['id'];

export const LISTA_METODOS_PAGO = Object.values(METODOS_PAGO);