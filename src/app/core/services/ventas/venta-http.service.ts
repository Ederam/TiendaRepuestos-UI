/**
 * @fileoverview Adaptador HTTP real de VentaService contra ASP.NET Core 8.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaService } from './venta.service';
import { CreateVentaRequest, VentaResponse } from '../../models/venta.models';

@Injectable()
export class VentaHttpService extends VentaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/Ventas`;

    override registrarVenta(request: CreateVentaRequest): Observable<VentaResponse> {
        return this.http.post<VentaResponse>(this.apiUrl, request);
    }
}