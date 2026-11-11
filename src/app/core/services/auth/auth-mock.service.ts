/**
 * @fileoverview Implementación mock de autenticación para desarrollo local autónomo.
 * Asigna dinámicamente el rol de Vendedor o Administrador según el correo ingresado.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  LoginResponse,
  RegistroUsuarioRequest,
  VendedorResumen,
} from '../../models/auth.models';
import { ROLES } from '../../constants/roles.constants';

@Injectable()
export class AuthMockService extends AuthService {
  private readonly mockVendedores: VendedorResumen[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      nombreCompleto: 'Reynel Ramírez',
      email: 'admin@macrolatas.com',
      rol: ROLES.ADMIN,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      nombreCompleto: 'Cajero Mostrador',
      email: 'caja@macrolatas.com',
      rol: ROLES.VENDEDOR,
    },
  ];

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

  registrarUsuario(data: RegistroUsuarioRequest): Observable<any> {
    const nuevo: VendedorResumen = {
      id: crypto.randomUUID(),
      nombreCompleto: data.nombreCompleto,
      email: data.email,
      rol: data.rol === 2 ? ROLES.ADMIN : ROLES.VENDEDOR,
    };
    this.mockVendedores.push(nuevo);
    return of(nuevo).pipe(delay(300));
  }

  obtenerVendedores(): Observable<VendedorResumen[]> {
    return of([...this.mockVendedores]).pipe(delay(200));
  }
}
