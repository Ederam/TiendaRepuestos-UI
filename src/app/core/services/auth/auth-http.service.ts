/**
 * @fileoverview Implementación real HTTP de autenticación contra POST /api/Auth/login.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.models';

@Injectable()
export class AuthHttpService extends AuthService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/Auth`;

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap((response) => this.handleAuthSuccess(response))
        );
    }
}