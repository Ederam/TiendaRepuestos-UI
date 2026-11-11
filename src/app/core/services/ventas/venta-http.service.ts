/**
 * @fileoverview Adaptador HTTP real de VentaService contra los endpoints de ASP.NET Core 8 Web API.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaService } from './venta.service';
import { CreateVentaRequest, VentaResponse } from '../../models/venta.models';

/**
 * Implementación de infraestructura HTTP para el módulo de facturación y POS.
 */
@Injectable({
  providedIn: 'root',
})
export class VentaHttpService extends VentaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Ventas`;

  /**
   * Envía la orden al endpoint POST /api/Ventas.
   * @param request Datos de la orden a procesar.
   */
  override registrarVenta(
    request: CreateVentaRequest,
  ): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, request);
  }

  /**
   * Consulta el histórico de comprobantes mediante GET /api/Ventas.
   * @param vendedorId Filtro opcional por identificador o nombre de vendedor.
   */
  override obtenerVentas(vendedorId?: string): Observable<VentaResponse[]> {
    let params = new HttpParams();
    if (vendedorId && vendedorId.trim() !== '') {
      params = params.set('vendedorId', vendedorId.trim());
    }
    return this.http.get<VentaResponse[]>(this.apiUrl, { params });
  }

  /**
   * Consulta una venta individual por su GUID mediante GET /api/Ventas/{id}.
   * @param id GUID de la venta.
   */
  override obtenerVentaPorId(id: string): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/${id}`);
  }
}
