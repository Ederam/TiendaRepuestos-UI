/**
 * @fileoverview Configuración centralizada de rutas y navegación del sistema.
 * Define la estructura del menú lateral y las restricciones de acceso por rol.
 */

import { ROLES, RolUsuario } from './roles.constants';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  rolesPermitidos?: RolUsuario[];
  adminOnly?: boolean;
}

export const MENU_PRINCIPAL: readonly NavItem[] = [
  {
    label: 'Punto de Venta (POS)',
    route: '/pos',
    icon: 'point_of_sale',
  },
  {
    label: 'Inventario / Catálogo',
    route: '/inventario',
    icon: 'inventory_2',
    adminOnly: true,
    rolesPermitidos: [ROLES.ADMIN],
  },
  {
    label: 'Reportes y Métricas',
    route: '/reportes',
    icon: 'bar_chart',
    adminOnly: true,
    rolesPermitidos: [ROLES.ADMIN],
  },
] as const;
