/**
 * @fileoverview Implementación mock de autenticación para desarrollo local autónomo.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.models';
import { ROLES } from '../../constants/roles.constants';

@Injectable()
export class AuthMockService extends AuthService {
    login(credentials: LoginRequest): Observable<LoginResponse> {
        const mockResponse: LoginResponse = {
            token: 'mock-jwt-token-macrolatas-admin',
            email: credentials.email || 'reynel.ramirez@macrolatas.com',
            rol: ROLES.ADMIN,
            nombreCompleto: 'Reynel Ramírez'
        };

        return of(mockResponse).pipe(
            delay(300),
            tap((res) => this.handleAuthSuccess(res))
        );
    }
}