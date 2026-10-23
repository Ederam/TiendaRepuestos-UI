/**
 * @fileoverview Adaptador en memoria de ProductoService con soporte estricto de filtros,
 * indexación O(1) para carga masiva, cálculo de sinCambios e identificadores GUID compatibles.
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
  /** Catálogo en memoria normalizado con identificadores string/GUID */
  private catalogoEnMemoria: Producto[] = MOCK_PRODUCTOS.map((p, index) => ({
    ...p,
    id: p.id ? p.id.toString() : `mock-guid-${index + 1}`,
  }));

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
    const mapaProductos: Map<string, Producto> = new Map<string, Producto>();
    for (const prod of this.catalogoEnMemoria) {
      mapaProductos.set(this.buildCompositeKey(prod.origen, prod.codigo), prod);
    }

    let insertados: number = 0;
    let actualizados: number = 0;
    let sinCambios: number = 0;
    let omitidos: number = 0;
    const nuevosParaAgregar: Producto[] = [];

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
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `guid-${Date.now()}-${insertados}`,
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
   * Crea un nuevo producto de forma individual en memoria asignando un GUID como identificador.
   * @param request Datos del formulario de creación.
   */
  override createProducto(
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const cat = CATEGORIAS_REPUESTOS.find((c) => c.id === request.categoriaId);

    const nuevo: Producto = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `guid-${Date.now()}`,
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

  /**
   * Actualiza las propiedades de un producto existente en el catálogo en memoria.
   * @param id Identificador GUID del producto.
   * @param request Valores actualizados.
   */
  override updateProducto(
    id: string,
    request: CreateProductoRequest,
  ): Observable<Producto> {
    const index: number = this.catalogoEnMemoria.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Repuesto con identificador ${id} no encontrado.`);
    }

    const cat = CATEGORIAS_REPUESTOS.find((c) => c.id === request.categoriaId);
    const actualizado: Producto = {
      ...this.catalogoEnMemoria[index],
      nombre: request.nombre.trim(),
      codigo: request.codigo.toUpperCase().trim(),
      descripcion: request.descripcion,
      categoriaId: request.categoriaId,
      nombreCategoria:
        cat?.nombre || this.catalogoEnMemoria[index].nombreCategoria,
      precioVenta: request.precioVenta,
      costo: request.costo,
      stockActual: request.stockActual,
      stockMinimo: request.stockMinimo,
      condicion: request.condicion || this.catalogoEnMemoria[index].condicion,
      origen: request.origen || this.catalogoEnMemoria[index].origen,
      marcaRepuesto:
        request.marcaRepuesto || this.catalogoEnMemoria[index].marcaRepuesto,
      marcaVehiculo:
        request.marcaVehiculo || this.catalogoEnMemoria[index].marcaVehiculo,
      ubicacion: request.ubicacion || this.catalogoEnMemoria[index].ubicacion,
    };

    this.catalogoEnMemoria[index] = actualizado;
    return of(actualizado).pipe(delay(150));
  }
}
