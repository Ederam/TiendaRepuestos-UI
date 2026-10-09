/**
 * @fileoverview Constantes de roles de usuario del sistema TiendaRepuestos.
 * Define la fuente única de verdad para RBAC alineada con los claims del Backend .NET 8.
 */

/**
 * Roles permitidos en la aplicación.
 * Mapeo exacto de los roles configurados en ASP.NET Core Identity / JWT claims.
 */
export const ROLES = {
  /** Rol con privilegios totales sobre inventario, catálogos y reportes financieros */
  ADMIN: 'Administrador',
  /** Rol operativo para emisión de facturas y consultas de inventario en POS */
  VENDEDOR: 'Vendedor',
} as const;

/**
 * Tipo literal derivado de los valores de ROLES.
 * Garantiza comprobación estricta de tipos en tiempo de compilación.
 */
export type RolUsuario = (typeof ROLES)[keyof typeof ROLES];
