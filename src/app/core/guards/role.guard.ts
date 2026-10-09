/**
 * @fileoverview Guard funcional para Control de Acceso Basado en Roles (RBAC).
 * Valida que el rol activo del usuario coincida con los roles autorizados definidos en la ruta.
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { RolUsuario } from '../constants/roles.constants';

/**
 * Inspecciona los datos de la ruta (`data.expectedRoles`) y valida contra el rol del AuthService.
 * Si el rol no está autorizado, cancela la navegación y redirige a la vista por defecto.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const expectedRoles = route.data['expectedRoles'] as RolUsuario[] | undefined;
  const currentRole = authService.userRole();

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (currentRole && expectedRoles.includes(currentRole)) {
    return true;
  }

  notificationService.showWarning(
    'No tienes autorización para acceder a esta sección.',
  );

  // Redirección segura según el rol actual
  return router.createUrlTree(['/pos']);
};
