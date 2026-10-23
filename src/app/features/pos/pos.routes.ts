/**
 * @fileoverview Definición de rutas hijas para el módulo de Punto de Venta (POS).
 */

import { Routes } from '@angular/router';

export const POS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pos.component').then((m) => m.PosComponent),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./ventas-historial/ventas-historial.component').then(
        (m) => m.VentasHistorialComponent,
      ),
  },
];
