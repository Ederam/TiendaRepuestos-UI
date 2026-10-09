/**
 * @fileoverview Configuración del árbol principal de rutas de la aplicación TiendaRepuestos-UI.
 * Aplica carga perezosa (Lazy Loading) y protección estricta con guards funcionales.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { publicGuard } from './core/guards/public.guard';
import { ROLES } from './core/constants/roles.constants';

export const routes: Routes = [
  // Redirección por defecto
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pos',
  },

  // Área pública (Login)
  {
    path: 'auth',
    canActivate: [publicGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },

  // Área transaccional y operativa (POS / Ventas) - Ambos roles autorizados
  {
    path: 'pos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
      },
    ],
  },

  // Gestión de Inventario / Productos - Exclusivo Administrador
  {
    path: 'inventario',
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [ROLES.ADMIN] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/inventario/inventario-list/inventario-list.component').then(
            (m) => m.InventarioListComponent,
          ),
      },
    ],
  },

  // Reportes Gerenciales y Financieros - Exclusivo Administrador
  {
    path: 'reportes',
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [ROLES.ADMIN] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/reportes/reportes-dashboard/reportes-dashboard.component').then(
            (m) => m.ReportesDashboardComponent,
          ),
      },
    ],
  },

  // Comodín para rutas inexistentes (404)
  {
    path: '**',
    redirectTo: 'pos',
  },
];
