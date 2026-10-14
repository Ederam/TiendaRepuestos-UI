/**
 * @fileoverview Adaptador HTTP real de ClienteService contra ASP.NET Core 8.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClienteService } from './cliente.service';
import { Cliente, CreateClienteRequest } from '../../models/cliente.models';

@Injectable()
export class ClienteHttpService extends ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Clientes`;

  override buscarPorTermino(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('termino', termino.trim());
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  override buscarPorDocumento(documento: string): Observable<Cliente | null> {
    return this.http.get<Cliente | null>(
      `${this.apiUrl}/por-documento/${encodeURIComponent(documento.trim())}`,
    );
  }

  override registrarCliente(
    request: CreateClienteRequest,
  ): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, request);
  }
}
