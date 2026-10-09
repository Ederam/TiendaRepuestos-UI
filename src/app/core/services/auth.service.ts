/**
 * @fileoverview Servicio de autenticación y gestión del estado de sesión en Angular 19.
 * Utiliza Signals y Computed properties para reactividad de grano fino y alto rendimiento.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  UserSession,
} from '../models/auth.models';
import { ROLES, RolUsuario } from '../constants/roles.constants';

/** Clave de persistencia para el token JWT en LocalStorage */
const TOKEN_KEY = 'TR_AUTH_TOKEN';
/** Clave de persistencia para los datos mínimos del usuario en LocalStorage */
const USER_KEY = 'TR_AUTH_USER';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  /**
   * Estado reactivo interno del usuario en sesión.
   * Inicializado desde LocalStorage si existe una sesión previa.
   */
  private readonly _currentUser = signal<UserSession | null>(
    this.getStoredUser(),
  );

  /**
   * Estado reactivo interno del token Bearer actual.
   */
  private readonly _token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );

  /** Selector de solo lectura para los datos del usuario en sesión */
  readonly currentUser = this._currentUser.asReadonly();

  /** Selector de solo lectura para el token Bearer */
  readonly token = this._token.asReadonly();

  /**
   * Indica reactivamente si existe una sesión autenticada y el token no ha expirado.
   */
  readonly isAuthenticated = computed(
    () => !!this._token() && !this.isTokenExpired(),
  );

  /**
   * Obtiene el rol del usuario actual o null si no hay sesión activa.
   */
  readonly userRole = computed<RolUsuario | null>(
    () => this._currentUser()?.rol ?? null,
  );

  /**
   * Determina si el usuario actual posee el rol de Administrador.
   */
  readonly isAdmin = computed(() => this._currentUser()?.rol === ROLES.ADMIN);

  /**
   * Determina si el usuario actual posee el rol de Vendedor.
   */
  readonly isVendedor = computed(
    () => this._currentUser()?.rol === ROLES.VENDEDOR,
  );

  /**
   * Realiza la solicitud de login contra el endpoint /api/Auth/login del backend.
   * Actualiza el estado reactivo y persiste los datos en caso de éxito.
   * @param credentials Objeto con credenciales (email y password).
   * @returns Observable con la respuesta del login.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  /**
   * Limpia el almacenamiento de sesión, resetea los Signals y redirige al Login.
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Actualiza los Signals reactivos y la persistencia local con la respuesta de login.
   * @param res Respuesta con token y claims del backend.
   */
  private handleAuthSuccess(res: LoginResponse): void {
    const session: UserSession = {
      email: res.email,
      rol: res.rol,
      nombreCompleto: res.nombreCompleto,
    };

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session));

    this._token.set(res.token);
    this._currentUser.set(session);
  }

  /**
   * Lee y deserializa la sesión guardada en LocalStorage de forma segura.
   * @returns Datos del usuario o null si no existe o es inválido.
   */
  private getStoredUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }

  /**
   * Inspecciona el payload del token JWT para verificar si ya superó su tiempo de expiración.
   * @returns True si el token ha expirado o no es válido, false si sigue vigente.
   */
  private isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;

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
