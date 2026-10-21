/**
 * @fileoverview Adaptador HTTP real de ClienteService contra ASP.NET Core 8.
 * Implementa búsqueda tolerante con silenciador de errores 404 para búsquedas predictivas en POS.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClienteService } from './cliente.service';
import { Cliente, CreateClienteRequest } from '../../models/cliente.models';

/**
 * Adaptador de infraestructura para peticiones REST sobre el recurso Clientes.
 */
@Injectable()
export class ClienteHttpService extends ClienteService {
  /** Cliente HTTP nativo inyectado */
  private readonly http: HttpClient = inject(HttpClient);

  /** URL base del recurso resuelta desde environment */
  private readonly apiUrl: string = `${environment.apiUrl}/Clientes`;

  /**
   * Busca clientes por coincidencia en Cédula/NIT o Nombre.
   * Si no se encuentran coincidencias (HTTP 404), retorna limpiamente una lista vacía
   * para no disparar alertas de error invasivas durante el tipeo en el POS.
   * @param termino Texto o número digitado por el operador.
   * @returns Flujo observable con la colección de clientes coincidentes.
   */
  override buscarPorTermino(termino: string): Observable<Cliente[]> {
    if (!termino || termino.trim().length < 2) {
      return of([]);
    }

    const params: HttpParams = new HttpParams().set('termino', termino.trim());

    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }
        return of([]);
      }),
    );
  }

  /**
   * Consulta un cliente puntual por su número exacto de documento.
   * Silencia el 404 retornando null si el cliente no está registrado.
   * @param documento Cédula o NIT a consultar.
   * @returns Flujo observable con el cliente si existe, o null si no se encuentra.
   */
  override buscarPorDocumento(documento: string): Observable<Cliente | null> {
    if (!documento || documento.trim().length === 0) {
      return of(null);
    }

    return this.http
      .get<Cliente | null>(
        `${this.apiUrl}/por-documento/${encodeURIComponent(documento.trim())}`,
      )
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of(null);
          }
          return of(null);
        }),
      );
  }

  /**
   * Registra un nuevo cliente formal en el sistema.
   * @param request Datos del cliente a persistir.
   * @returns Flujo observable con el cliente creado.
   */
  override registrarCliente(
    request: CreateClienteRequest,
  ): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, request);
  }
}
