/**
 * @fileoverview Adaptador HTTP real de ProductoService que consume la Web API de ASP.NET Core 8.
 * Normaliza contratos entre el backend y el frontend, mapeando GUIDs y entidades de catálogo.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

interface BackendProductoDto {
  id: string;
  nombre: string;
  codigoParte?: string;
  codigo?: string;
  descripcion?: string;
  categoriaId: string | number;
  nombreCategoria?: string;
  precioVenta: number;
  costo?: number;
  stockActual: number;
  stockMinimo: number;
  estado?: number | string;
  origen?: string;
  ubicacion?: string;
  marcaRepuesto?: string;
  marcaVehiculo?: string;
  condicion?: string;
  activo: boolean;
}

@Injectable()
export class ProductoHttpService extends ProductoService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = `${environment.apiUrl}/Productos`;

  private normalizarProducto(dto: BackendProductoDto): Producto {
    const parsedCategoriaId = Number(dto.categoriaId);

    return {
      id: dto.id ? dto.id.toString() : '00000000-0000-0000-0000-000000000000',
      codigo: (dto.codigoParte || dto.codigo || '').trim().toUpperCase(),
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      categoriaId:
        !isNaN(parsedCategoriaId) && parsedCategoriaId > 0
          ? parsedCategoriaId
          : 1,
      nombreCategoria: dto.nombreCategoria || 'General',
      marcaRepuesto: dto.marcaRepuesto || 'GENÉRICO',
      marcaVehiculo: dto.marcaVehiculo || 'MULTIMARCA',
      condicion: (dto.condicion as any) || 'Nuevo',
      origen: (dto.origen as any) || 'PROPIO_MACROLATAS',
      ubicacion: dto.ubicacion || 'BODEGA PRINCIPAL',
      costo: dto.costo || 0,
      precioVenta: dto.precioVenta || 0,
      stockActual: dto.stockActual || 0,
      stockMinimo: dto.stockMinimo || 2,
      activo: dto.activo ?? true,
    };
  }

  override cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse> {
    const payload = items.map((item: CargaMasivaItemRequest) => ({
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
      categoriaId: null,
    }));

    return this.http.post<CargaMasivaResponse>(
      `${this.apiUrl}/carga-masiva`,
      payload,
    );
  }

  override getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>> {
    let httpParams: HttpParams = new HttpParams();

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

    return this.http
      .get<PagedResponse<BackendProductoDto>>(`${this.apiUrl}/paginado`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          ...response,
          items: (response.items || []).map((dto) =>
            this.normalizarProducto(dto),
          ),
        })),
      );
  }

  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const payload = {
      nombre: request.nombre.trim(),
      codigoParte: request.codigo.trim().toUpperCase(),
      precioVenta: request.precioVenta,
      stockInicial: request.stockActual,
      stockMinimo: request.stockMinimo,
      estado: 0,
      categoriaId: '00000000-0000-0000-0000-000000000000',
    };

    return this.http
      .post<BackendProductoDto>(this.apiUrl, payload)
      .pipe(map((dto) => this.normalizarProducto(dto)));
  }

  override updateProducto(
    id: string,
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const payload = {
      nombre: request.nombre.trim(),
      codigoParte: request.codigo.trim().toUpperCase(),
      precioVenta: request.precioVenta,
      costo: request.costo,
      categoriaId: '00000000-0000-0000-0000-000000000000',
    };

    return this.http
      .put<BackendProductoDto>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((dto) => this.normalizarProducto(dto)));
  }
}
