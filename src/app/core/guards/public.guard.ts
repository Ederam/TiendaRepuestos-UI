/**
 * @fileoverview Guard funcional para rutas públicas (Login/Recuperación).
 * Evita que un usuario autenticado vuelva a entrar a la vista de login sin cerrar sesión previa.
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

/**
 * Permite el acceso únicamente a usuarios no autenticados.
 * Si ya existe sesión, redirige a la vista principal de la aplicación.
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/pos']);
};
