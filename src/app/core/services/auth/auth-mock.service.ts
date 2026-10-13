/**
 * @fileoverview Implementación mock de autenticación para desarrollo local autónomo.
 * Asigna dinámicamente el rol de Vendedor o Administrador según el correo ingresado.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.models';
import { ROLES } from '../../constants/roles.constants';

@Injectable()
export class AuthMockService extends AuthService {
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const esVendedor = credentials.email?.toLowerCase().includes('vendedor');

    const mockResponse: LoginResponse = {
      token: 'mock-jwt-token-macrolatas',
      email:
        credentials.email ||
        (esVendedor ? 'caja@macrolatas.com' : 'admin@macrolatas.com'),
      rol: esVendedor ? ROLES.VENDEDOR : ROLES.ADMIN,
      nombreCompleto: esVendedor ? 'Cajero Mostrador' : 'Reynel Ramírez',
    };

    return of(mockResponse).pipe(
      delay(300),
      tap((res) => this.handleAuthSuccess(res)),
    );
  }
}
