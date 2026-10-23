/**
 * @fileoverview Catálogo de métodos de pago soportados en el sistema POS MACROLATAS.
 * Fuente única de verdad para transacciones comerciales.
 */

export const METODOS_PAGO = {
  EFECTIVO: { id: 1, label: 'Efectivo', code: 'Efectivo' },
  TRANSFERENCIA: {
    id: 2,
    label: 'Transferencia (Nequi / Daviplata / Bancolombia)',
    code: 'Transferencia',
  },
  TARJETA: { id: 3, label: 'Tarjeta Débito / Crédito', code: 'Tarjeta' },
} as const;

export type MetodoPagoId =
  (typeof METODOS_PAGO)[keyof typeof METODOS_PAGO]['id'];

export const LISTA_METODOS_PAGO = Object.values(METODOS_PAGO);
