/**
 * @fileoverview Servicio de datos para la gestión y consulta de inventario automotriz.
 * Conecta con los endpoints de productos de .NET 8 con soporte de paginación y filtros.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, CreateProductoRequest } from '../models/producto.models';
import { PagedResponse, ProductoFilterParams } from '../models/api-response.models';

@Injectable({
    providedIn: 'root'
})
export class ProductoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/Productos`;

    /**
     * Obtiene la lista paginada y filtrada de repuestos desde el backend.
     * @param params Filtros de búsqueda, categoría, estado y número/tamaño de página.
     * @returns Observable con la estructura PagedResponse<Producto>.
     */
    getProductosPaginado(params: ProductoFilterParams): Observable<PagedResponse<Producto>> {
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

        httpParams = httpParams.set('pageNumber', (params.pageNumber ?? 1).toString());
        httpParams = httpParams.set('pageSize', (params.pageSize ?? 10).toString());

        return this.http.get<PagedResponse<Producto>>(`${this.apiUrl}/paginado`, {
            params: httpParams
        });
    }

    /**
     * Registra un nuevo repuesto en el catálogo general (Exclusivo Administrador).
     * @param request Datos del producto a registrar.
     * @returns Observable con el producto creado.
     */
    createProducto(request: CreateProductoRequest): Observable<Producto> {
        return this.http.post<Producto>(this.apiUrl, request);
    }
}