/**
 * @fileoverview Adaptador en memoria de ProductoService con soporte estricto de filtros,
 * indexación O(1) para carga masiva, cálculo de sinCambios e idempotencia (Upsert) multiorigen.
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

/**
 * Servicio mock para pruebas y entornos autónomos (como Vercel sin backend público).
 */
@Injectable()
export class ProductoMockService extends ProductoService {
  /** Catálogo en memoria precargado con el mock inicial */
  private catalogoEnMemoria: Producto[] = [...MOCK_PRODUCTOS];

  /** Contador incremental para generación de identificadores numéricos */
  private nextId: number =
    Math.max(...this.catalogoEnMemoria.map((p: Producto) => p.id), 0) + 1;

  /**
   * Genera una clave compuesta única por origen y código para garantizar idempotencia en O(1).
   * @param origen Procedencia del producto.
   * @param codigo Código de referencia técnica.
   * @returns Identificador compuesto formateado.
   */
  private buildCompositeKey(
    origen: string | undefined,
    codigo: string,
  ): string {
    const orig: string = (origen || 'PROPIO_MACROLATAS').trim().toUpperCase();
    const cod: string = (codigo || '').trim().toUpperCase();
    return `${orig}::${cod}`;
  }

  /**
   * Procesa la importación masiva en memoria calculando inserciones, actualizaciones y registros sin cambios.
   * @param items Lista de repuestos parseados desde el archivo Excel.
   * @returns Observable con el resumen cuantitativo de la operación.
   */
  override cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse> {
    // 1. Construir índice Map en O(N) para búsquedas directas en O(1)
    const mapaProductos: Map<string, Producto> = new Map<string, Producto>();
    for (const prod of this.catalogoEnMemoria) {
      mapaProductos.set(this.buildCompositeKey(prod.origen, prod.codigo), prod);
    }

    let insertados: number = 0;
    let actualizados: number = 0;
    let sinCambios: number = 0;
    let omitidos: number = 0;
    const nuevosParaAgregar: Producto[] = [];

    // 2. Procesar lote en O(1) por registro
    for (const item of items) {
      const codigoLimpio: string | undefined = item.codigo
        ?.trim()
        .toUpperCase();
      if (!codigoLimpio || !item.nombre?.trim()) {
        omitidos++;
        continue;
      }

      const origenLimpio: string = item.origen || 'PROPIO_MACROLATAS';
      const key: string = this.buildCompositeKey(origenLimpio, codigoLimpio);
      const existente: Producto | undefined = mapaProductos.get(key);

      if (existente) {
        // Detección real de cambios para reflejar el comportamiento exacto de .NET 8
        const nuevoPrecio: number =
          item.precioVenta > 0 ? item.precioVenta : existente.precioVenta;
        const nuevoCosto: number =
          item.costo > 0 ? item.costo : existente.costo;
        const nuevaUbicacion: string =
          item.ubicacion?.trim().toUpperCase() ||
          existente.ubicacion ||
          'BODEGA PRINCIPAL';
        const nuevoNombre: string = item.nombre.trim();
        const nuevaDesc: string = item.descripcion || '';
        const nuevaMarcaRepuesto: string =
          item.marcaRepuesto || existente.marcaRepuesto || 'GENÉRICO';
        const nuevaMarcaVehiculo: string =
          item.marcaVehiculo || existente.marcaVehiculo || 'MULTIMARCA';

        const huboCambios: boolean =
          existente.precioVenta !== nuevoPrecio ||
          existente.costo !== nuevoCosto ||
          existente.stockActual !== item.stockActual ||
          existente.ubicacion !== nuevaUbicacion ||
          existente.nombre !== nuevoNombre ||
          existente.descripcion !== nuevaDesc ||
          existente.marcaRepuesto !== nuevaMarcaRepuesto ||
          existente.marcaVehiculo !== nuevaMarcaVehiculo;

        if (huboCambios) {
          existente.precioVenta = nuevoPrecio;
          existente.costo = nuevoCosto;
          existente.stockActual = item.stockActual;
          existente.ubicacion = nuevaUbicacion;
          existente.nombre = nuevoNombre;
          existente.descripcion = nuevaDesc;
          existente.marcaRepuesto = nuevaMarcaRepuesto;
          existente.marcaVehiculo = nuevaMarcaVehiculo;
          actualizados++;
        } else {
          sinCambios++;
        }
      } else {
        const nuevo: Producto = {
          id: this.nextId++,
          codigo: codigoLimpio,
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

        mapaProductos.set(key, nuevo);
        nuevosParaAgregar.push(nuevo);
        insertados++;
      }
    }

    if (nuevosParaAgregar.length > 0) {
      this.catalogoEnMemoria.unshift(...nuevosParaAgregar);
    }

    const respuesta: CargaMasivaResponse = {
      totalProcesados: items.length,
      insertados,
      actualizados,
      sinCambios,
      omitidos,
      mensajes: [
        `Proceso completado: ${insertados} creados, ${actualizados} actualizados, ${sinCambios} sin cambios, ${omitidos} omitidos.`,
      ],
    };

    return of(respuesta).pipe(delay(250));
  }

  /**
   * Obtiene el listado de productos paginado y filtrado en memoria.
   * @param params Criterios de búsqueda y navegación.
   * @returns Observable con el bloque paginado.
   */
  override getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>> {
    let filtrados: Producto[] = [...this.catalogoEnMemoria];

    if (params.soloActivos) {
      filtrados = filtrados.filter((p: Producto) => p.activo === true);
    }

    if (params.busqueda && params.busqueda.trim() !== '') {
      const q: string = params.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (p: Producto) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q),
      );
    }

    if (params.categoriaId) {
      filtrados = filtrados.filter(
        (p: Producto) => p.categoriaId === params.categoriaId,
      );
    }

    const page: number = params.pageNumber ?? 1;
    const size: number = params.pageSize ?? 10;
    const totalCount: number = filtrados.length;
    const totalPages: number = Math.ceil(totalCount / size) || 1;
    const start: number = (page - 1) * size;
    const items: Producto[] = filtrados.slice(start, start + size);

    const response: PagedResponse<Producto> = {
      items,
      pageNumber: page,
      pageSize: size,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    return of(response).pipe(delay(100));
  }

  /**
   * Crea un nuevo producto de forma individual en memoria.
   * @param request Datos del formulario de creación.
   * @returns Observable con el producto recién creado.
   */
  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const cat = CATEGORIAS_REPUESTOS.find((c) => c.id === request.categoriaId);

    const nuevo: Producto = {
      id: this.nextId++,
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
