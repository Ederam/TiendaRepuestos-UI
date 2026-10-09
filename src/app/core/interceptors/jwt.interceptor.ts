/**
 * @fileoverview Interceptor HTTP funcional para inyectar el Bearer Token en Angular 19.
 * Intercepta peticiones salientes dirigidas a la API del backend y adjunta el encabezado Authorization.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Interceptor funcional que adjunta el JWT a las cabeceras HTTP de las peticiones a la API.
 * Evita inyectar el token en el endpoint de autenticación inicial (/Auth/login) o en APIs externas.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const isApiUrl = req.url.startsWith(environment.apiUrl);
  const isLoginEndpoint = req.url.includes('/Auth/login');

  if (token && isApiUrl && !isLoginEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
