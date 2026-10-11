/**
 * @fileoverview Servicio de autenticación y gestión del estado de sesión en Angular 19.
 * Contiene el estado reactivo con Signals y delega la ejecución de login a la subclase.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, UserSession } from '../../models/auth.models';
import { ROLES, RolUsuario } from '../../constants/roles.constants';

const TOKEN_KEY = 'TR_AUTH_TOKEN';
const USER_KEY = 'TR_AUTH_USER';

@Injectable()
export abstract class AuthService {
  protected readonly router = inject(Router);

  private readonly _currentUser = signal<UserSession | null>(this.getStoredUser());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !this.isTokenExpired());
  readonly userRole = computed<RolUsuario | null>(() => this._currentUser()?.rol ?? null);
  readonly isAdmin = computed(() => this._currentUser()?.rol === ROLES.ADMIN);
  readonly isVendedor = computed(() => this._currentUser()?.rol === ROLES.VENDEDOR);

  /** Método abstracto a implementar por AuthHttpService o AuthMockService */
  abstract login(credentials: LoginRequest): Observable<LoginResponse>;

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  protected handleAuthSuccess(res: LoginResponse): void {
    const session: UserSession = {
      email: res.email,
      rol: res.rol,
      nombreCompleto: res.nombreCompleto
    };

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session));

    this._token.set(res.token);
    this._currentUser.set(session);
  }

  private getStoredUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;

    // Si es un token mock de desarrollo, consideramos que no expira
    if (token.startsWith('mock-jwt-token')) return false;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson) as { exp?: number };

      if (!decoded.exp) return false;
      return Math.floor(Date.now() / 1000) >= decoded.exp;
    } catch {
      return true;
    }
  }
}