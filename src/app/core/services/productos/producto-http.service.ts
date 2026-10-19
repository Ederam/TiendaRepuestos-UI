/**
 * @fileoverview Adaptador HTTP real de ProductoService que consume la Web API de ASP.NET Core 8.
 * Implementa comunicación REST estricta con manejo de parámetros de paginación y carga masiva.
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

/**
 * Adaptador de infraestructura que realiza llamadas HTTP directas contra los endpoints de Productos en el backend.
 */
@Injectable()
export class ProductoHttpService extends ProductoService {
  /** Cliente HTTP nativo inyectado mediante función inject */
  private readonly http: HttpClient = inject(HttpClient);

  /** URL base del controlador de Productos resuelta desde el environment */
  private readonly apiUrl: string = `${environment.apiUrl}/Productos`;

  /**
   * Envía un lote masivo de repuestos parseados al endpoint de persistencia idempotente (Upsert).
   * @param items Lista de repuestos extraídos por las estrategias de Excel.
   * @returns Flujo observable con el balance cuantitativo de inserciones, actualizaciones y registros sin cambios.
   */
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

  /**
   * Consulta el catálogo de repuestos en el servidor aplicando filtros y paginación.
   * @param params Filtros de búsqueda textual, categoría, estado y límites de página.
   * @returns Flujo observable con la página resultante y los metadatos de paginación.
   */
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

    return this.http.get<PagedResponse<Producto>>(`${this.apiUrl}/paginado`, {
      params: httpParams,
    });
  }

  /**
   * Registra un repuesto de manera individual en el sistema.
   * @param request Datos de entrada para la creación del producto.
   * @returns Flujo observable con el repuesto registrado.
   */
  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    // Si viene un ID numérico o inválido, enviamos Guid.Empty ("00000000-0000-0000-0000-000000000000")
    // para que el backend le asigne la categoría por defecto de forma segura.
    const payload = {
      nombre: request.nombre.trim(),
      codigoParte: request.codigo.trim().toUpperCase(),
      precioVenta: request.precioVenta,
      stockInicial: request.stockActual,
      stockMinimo: request.stockMinimo,
      estado: 0, // EstadoProducto.Nuevo
      categoriaId: '00000000-0000-0000-0000-000000000000',
    };

    return this.http.post<Producto>(this.apiUrl, payload);
  }
}
