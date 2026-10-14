/**
 * @fileoverview Adaptador en memoria de ProductoService con soporte estricto de filtros.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
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
import { MOCK_PRODUCTOS } from '../../mocks/repuestos.mock';
import { CATEGORIAS_REPUESTOS } from '../../constants/categorias.constants';

@Injectable()
export class ProductoMockService extends ProductoService {
  private catalogoEnMemoria: Producto[] = [...MOCK_PRODUCTOS];

  override cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse> {
    let agregados = 0;

    items.forEach((item) => {
      // Si ya existe el código, actualizamos existencias y precio; si no, lo creamos
      const existente = this.catalogoEnMemoria.find(
        (p) => p.codigo.toLowerCase() === item.codigo.toLowerCase(),
      );

      if (existente) {
        existente.stockActual += item.stockActual;
        existente.precioVenta =
          item.precioVenta > 0 ? item.precioVenta : existente.precioVenta;
        existente.costo = item.costo > 0 ? item.costo : existente.costo;
        if (item.ubicacion) existente.ubicacion = item.ubicacion;
        agregados++;
      } else {
        const nuevo: Producto = {
          id: Math.max(...this.catalogoEnMemoria.map((p) => p.id), 0) + 1,
          codigo: item.codigo.toUpperCase().trim(),
          nombre: item.nombre.trim(),
          descripcion: item.descripcion || '',
          categoriaId: 1,
          nombreCategoria: item.categoriaNombre || 'General',
          marcaRepuesto: item.marcaRepuesto || 'GENÉRICO',
          marcaVehiculo: item.marcaVehiculo || 'MULTIMARCA',
          condicion: item.condicion || 'Nuevo',
          origen: item.origen || 'PROPIO_MACROLATAS',
          ubicacion: item.ubicacion || 'BODEGA PRINCIPAL',
          precioVenta: item.precioVenta,
          costo: item.costo,
          stockActual: item.stockActual,
          stockMinimo: 2,
          activo: true,
        };
        this.catalogoEnMemoria.unshift(nuevo);
        agregados++;
      }
    });

    const respuesta: CargaMasivaResponse = {
      registrosProcesados: items.length,
      registrosExitosos: agregados,
      registrosOmitidos: items.length - agregados,
      mensajes: [
        `Se procesaron correctamente ${agregados} referencias en el catálogo.`,
      ],
    };

    return of(respuesta).pipe(delay(400));
  }

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
      condicion: request.condicion || 'Nuevo',
      origen: request.origen || 'PROPIO_MACROLATAS',
      marcaRepuesto: request.marcaRepuesto || 'GENÉRICO',
      marcaVehiculo: request.marcaVehiculo || 'MULTIMARCA',
      ubicacion: request.ubicacion || 'BODEGA PRINCIPAL',
    };

    this.catalogoEnMemoria.unshift(nuevo);
    return of(nuevo).pipe(delay(150));
  }
}
