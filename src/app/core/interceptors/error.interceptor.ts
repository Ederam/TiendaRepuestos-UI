/**
 * @fileoverview Interceptor HTTP funcional para captura y tratamiento global de excepciones.
 * Mapea respuestas con especificación RFC 7807 (ProblemDetails) y gestiona códigos de error HTTP.
 */

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { ProblemDetails } from '../models/problem-details.models';

/**
 * Interceptor funcional para la captura centralizada de errores HTTP.
 * Despliega notificaciones comprensibles al usuario y ejecuta acciones según el código de estado.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userFriendlyMessage = 'Ocurrió un error inesperado en el servidor.';

      if (error.error && typeof error.error === 'object') {
        const problem = error.error as ProblemDetails;

        if (problem.errors && Object.keys(problem.errors).length > 0) {
          // Errores de validación FluentValidation / ASP.NET Core
          const validationMessages = Object.values(problem.errors).flat();
          userFriendlyMessage = validationMessages.join(' | ');
        } else if (problem.detail) {
          userFriendlyMessage = problem.detail;
        } else if (problem.title) {
          userFriendlyMessage = problem.title;
        }
      }

      switch (error.status) {
        case 401:
          notify.showError('Sesión expirada o credenciales inválidas.');
          authService.logout();
          break;
        case 403:
          notify.showWarning(
            'No tienes permisos suficientes para realizar esta acción.',
          );
          break;
        case 404:
          notify.showWarning(userFriendlyMessage || 'Recurso no encontrado.');
          break;
        case 400:
          notify.showError(userFriendlyMessage);
          break;
        case 500:
          notify.showError('Error interno del servidor. Contacte a soporte.');
          break;
        case 0:
          notify.showError(
            'No se pudo conectar con el servidor backend. Verifique su conexión y CORS.',
          );
          break;
        default:
          notify.showError(userFriendlyMessage);
          break;
      }

      return throwError(() => error);
    }),
  );
};
