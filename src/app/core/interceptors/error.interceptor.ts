/**
 * @fileoverview Interceptor HTTP global para manejo estandarizado de errores en MACROLATAS.
 * Traduce fallos de red en mensajes comprensibles y gestiona expiración de sesiones.
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router: Router = inject(Router);
  const notify: NotificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensajeAmigable: string =
        'Ocurrió un inconveniente. Intente de nuevo.';

      // Caso 0: Backend apagado, puerto bloqueado o sin conexión a internet
      if (error.status === 0) {
        mensajeAmigable =
          'No fue posible conectar con el sistema. Por favor verifique que el servicio esté encendido.';
      } else if (error.status === 401) {
        // No alertar si fue un fallo en la pantalla de login (la pantalla ya avisa "credenciales inválidas")
        if (!req.url.includes('/Auth/login')) {
          mensajeAmigable =
            'Su sesión ha finalizado. Por favor ingrese de nuevo.';
          localStorage.removeItem('token');
          router.navigate(['/auth/login']);
        } else {
          mensajeAmigable = 'Correo electrónico o contraseña incorrectos.';
        }
      } else if (error.status === 403) {
        mensajeAmigable = 'No cuenta con permisos para realizar esta acción.';
      } else if (error.status === 404) {
        mensajeAmigable =
          error.error?.detail || 'El registro solicitado no fue encontrado.';
      } else if (error.status === 409) {
        mensajeAmigable =
          error.error?.detail ||
          'El registro ya existe o fue modificado simultáneamente por otro usuario.';
      } else if (error.status >= 500) {
        mensajeAmigable =
          error.error?.detail ||
          'El servidor reportó un error al procesar los datos.';
      }

      notify.showError(mensajeAmigable);
      return throwError(() => error);
    }),
  );
};
