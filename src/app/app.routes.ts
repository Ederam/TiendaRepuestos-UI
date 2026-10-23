/**
 * @fileoverview Configuración del árbol principal de rutas de la aplicación TiendaRepuestos-UI.
 * Utiliza MainLayoutComponent como cascarón para rutas privadas y aplica RBAC estricto.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { publicGuard } from './core/guards/public.guard';
import { ROLES } from './core/constants/roles.constants';

export const routes: Routes = [
  // Ruta pública: Autenticación
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

  // Rutas privadas: Protegidas con authGuard y montadas sobre MainLayoutComponent
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pos',
      },
      // POS / Ventas - Vendedor y Administrador
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
      },
      {
        path: 'pos',
        // CARGA HIJAS: Permite resolver tanto '' (/pos) como 'historial' (/pos/historial)
        loadChildren: () =>
          import('./features/pos/pos.routes').then((m) => m.POS_ROUTES),
      },
      // Inventario - Exclusivo Administrador
      {
        path: 'inventario',
        canActivate: [roleGuard],
        data: { expectedRoles: [ROLES.ADMIN] },
        loadComponent: () =>
          import('./features/inventario/inventario-list/inventario-list.component').then(
            (m) => m.InventarioListComponent,
          ),
      },
      // Reportes - Exclusivo Administrador
      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { expectedRoles: [ROLES.ADMIN] },
        loadComponent: () =>
          import('./features/reportes/reportes-dashboard/reportes-dashboard.component').then(
            (m) => m.ReportesDashboardComponent,
          ),
      },
      {
        path: 'inventario/importar',
        loadComponent: () =>
          import('./features/inventario/inventario-import/inventario-import.component').then(
            (m) => m.InventarioImportComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [ROLES.ADMIN] },
      },
    ],
  },

  // Comodín para rutas no encontradas
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
