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
    // Mapeo limpio hacia el contrato CargaMasivaItemDto de .NET 8
    const payload = items.map((item) => ({
      codigoParte: item.codigo.trim().toUpperCase(),
      nombre: item.nombre.trim(),
      descripcion: item.descripcion || '',
      precioVenta: item.precioVenta,
      costo: item.costo,
      stockActual: item.stockActual,
      ubicacion: item.ubicacion || 'BODEGA PRINCIPAL',
      origen: item.origen || 'PROPIO_MACROLATAS',
      marcaRepuesto: item.marcaRepuesto || 'GENÉRICO',
      marcaVehiculo: item.marcaVehiculo || 'MULTIMARCA',
      condicion: item.condicion || 'Nuevo',
      categoriaId: null, // El backend asigna la categoría por defecto
    }));

    return this.http.post<CargaMasivaResponse>(
      `${this.apiUrl}/carga-masiva`,
      payload,
    );
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
