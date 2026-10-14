/**
 * @fileoverview Adaptador HTTP real de ProductoService contra ASP.NET Core 8.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductoService } from './producto.service';
import {
  Producto,
  CreateProductoRequest,
  CargaMasivaItemRequest,
  CargaMasivaResponse,
} from '../../models/producto.models';
import {
  PagedResponse,
  ProductoFilterParams,
} from '../../models/api-response.models';

@Injectable()
export class ProductoHttpService extends ProductoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Productos`;

  override cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse> {
    return this.http.post<CargaMasivaResponse>(`${this.apiUrl}/carga-masiva`, {
      items,
    });
  }

  override getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>> {
    let httpParams = new HttpParams();

    if (params.busqueda && params.busqueda.trim() !== '') {
      httpParams = httpParams.set('busqueda', params.busqueda.trim());
    }
    if (params.categoriaId !== undefined && params.categoriaId !== null) {
      httpParams = httpParams.set('categoriaId', params.categoriaId.toString());
    }
    if (params.soloActivos !== undefined && params.soloActivos !== null) {
      httpParams = httpParams.set('soloActivos', params.soloActivos.toString());
    }

    httpParams = httpParams.set(
      'pageNumber',
      (params.pageNumber ?? 1).toString(),
    );
    httpParams = httpParams.set('pageSize', (params.pageSize ?? 10).toString());

    return this.http.get<PagedResponse<Producto>>(`${this.apiUrl}/paginado`, {
      params: httpParams,
    });
  }

  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, request);
  }
}
