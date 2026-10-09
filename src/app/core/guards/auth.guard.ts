/**
 * @fileoverview Guard funcional de autenticación para Angular 19.
 * Bloquea el acceso a rutas protegidas si el usuario no tiene una sesión activa o si su token ha expirado.
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Verifica si el usuario cuenta con una sesión válida antes de permitir la navegación.
 * En caso negativo, redirige a la pantalla de login preservando la URL destino en queryParams.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isAuthenticated()) {
    return true;
  }

  notificationService.showWarning(
    'Debes iniciar sesión para acceder a este recurso.',
  );

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
