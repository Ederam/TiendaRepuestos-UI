/**
 * @fileoverview Adaptador en memoria de ProductoService para pruebas locales y diseño ágil.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ProductoService } from './producto.service';
import { Producto, CreateProductoRequest } from '../../models/producto.models';
import { PagedResponse, ProductoFilterParams } from '../../models/api-response.models';
import { MOCK_PRODUCTOS } from '../../mocks/repuestos.mock';

@Injectable()
export class ProductoMockService extends ProductoService {
    private catalogoEnMemoria: Producto[] = [...MOCK_PRODUCTOS];

    override getProductosPaginado(params: ProductoFilterParams): Observable<PagedResponse<Producto>> {
        let filtrados = [...this.catalogoEnMemoria];

        if (params.busqueda && params.busqueda.trim() !== '') {
            const q = params.busqueda.toLowerCase().trim();
            filtrados = filtrados.filter(
                (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
            );
        }

        const page = params.pageNumber ?? 1;
        const size = params.pageSize ?? 10;
        const totalCount = filtrados.length;
        const totalPages = Math.ceil(totalCount / size);
        const start = (page - 1) * size;
        const items = filtrados.slice(start, start + size);

        const response: PagedResponse<Producto> = {
            items,
            pageNumber: page,
            pageSize: size,
            totalCount,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages
        };

        return of(response).pipe(delay(200));
    }

    override createProducto(request: CreateProductoRequest): Observable<Producto> {
        const nuevo: Producto = {
            id: Math.max(...this.catalogoEnMemoria.map((p) => p.id), 0) + 1,
            codigo: request.codigo,
            nombre: request.nombre,
            descripcion: request.descripcion,
            categoriaId: request.categoriaId,
            nombreCategoria: 'General',
            precioVenta: request.precioVenta,
            costo: request.costo,
            stockActual: request.stockActual,
            stockMinimo: request.stockMinimo,
            activo: true
        };

        this.catalogoEnMemoria.unshift(nuevo);
        return of(nuevo).pipe(delay(200));
    }
}