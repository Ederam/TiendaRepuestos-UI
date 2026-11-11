/**
 * @fileoverview Implementación real HTTP de autenticación contra POST /api/Auth/login.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  LoginResponse,
  RegistroUsuarioRequest,
  VendedorResumen,
} from '../../models/auth.models';

@Injectable()
export class AuthHttpService extends AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Auth`;
  private readonly usuariosUrl = `${environment.apiUrl}/Usuarios`;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  registrarUsuario(data: RegistroUsuarioRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  obtenerVendedores(): Observable<VendedorResumen[]> {
    return this.http.get<VendedorResumen[]>(`${this.usuariosUrl}/vendedores`);
  }
}
