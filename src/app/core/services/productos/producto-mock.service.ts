/**
 * @fileoverview Adaptador en memoria de ProductoService con soporte estricto de filtros.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ProductoService } from './producto.service';
import { Producto, CreateProductoRequest } from '../../models/producto.models';
import {
  PagedResponse,
  ProductoFilterParams,
} from '../../models/api-response.models';
import { MOCK_PRODUCTOS } from '../../mocks/repuestos.mock';
import { CATEGORIAS_REPUESTOS } from '../../constants/categorias.constants';

@Injectable()
export class ProductoMockService extends ProductoService {
  private catalogoEnMemoria: Producto[] = [...MOCK_PRODUCTOS];

  override getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>> {
    let filtrados = [...this.catalogoEnMemoria];

    // Filtro por solo activos
    if (params.soloActivos) {
      filtrados = filtrados.filter((p) => p.activo === true);
    }

    // Filtro por búsqueda
    if (params.busqueda && params.busqueda.trim() !== '') {
      const q = params.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q),
      );
    }

    // Filtro por categoría
    if (params.categoriaId) {
      filtrados = filtrados.filter((p) => p.categoriaId === params.categoriaId);
    }

    const page = params.pageNumber ?? 1;
    const size = params.pageSize ?? 10;
    const totalCount = filtrados.length;
    const totalPages = Math.ceil(totalCount / size) || 1;
    const start = (page - 1) * size;
    const items = filtrados.slice(start, start + size);

    const response: PagedResponse<Producto> = {
      items,
      pageNumber: page,
      pageSize: size,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    return of(response).pipe(delay(150));
  }

  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const cat = CATEGORIAS_REPUESTOS.find((c) => c.id === request.categoriaId);

    const nuevo: Producto = {
      id: Math.max(...this.catalogoEnMemoria.map((p) => p.id), 0) + 1,
      codigo: request.codigo.toUpperCase().trim(),
      nombre: request.nombre.trim(),
      descripcion: request.descripcion,
      categoriaId: request.categoriaId,
      nombreCategoria: cat?.nombre || 'General',
      precioVenta: request.precioVenta,
      costo: request.costo,
      stockActual: request.stockActual,
      stockMinimo: request.stockMinimo,
      activo: true,
    };

    this.catalogoEnMemoria.unshift(nuevo);
    return of(nuevo).pipe(delay(150));
  }
}
