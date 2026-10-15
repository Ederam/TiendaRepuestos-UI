/**
 * @fileoverview Adaptador en memoria de ProductoService con soporte estricto de filtros,
 * indexación O(1) para carga masiva e idempotencia (Upsert) multiorigen.
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
  private nextId = Math.max(...this.catalogoEnMemoria.map((p) => p.id), 0) + 1;

  /**
   * Genera una clave compuesta única por origen y código para garantizar idempotencia.
   */
  private buildCompositeKey(
    origen: string | undefined,
    codigo: string,
  ): string {
    const orig = (origen || 'PROPIO_MACROLATAS').trim().toUpperCase();
    const cod = (codigo || '').trim().toUpperCase();
    return `${orig}::${cod}`;
  }

  override cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse> {
    // 1. Construir índice Map en O(N) para búsquedas directas O(1)
    const mapaProductos = new Map<string, Producto>();
    for (const prod of this.catalogoEnMemoria) {
      mapaProductos.set(this.buildCompositeKey(prod.origen, prod.codigo), prod);
    }

    let insertados = 0;
    let actualizados = 0;
    const nuevosParaAgregar: Producto[] = [];

    // 2. Procesar lote en O(1) por registro sin congelar el hilo principal
    for (const item of items) {
      const codigoLimpio = item.codigo?.trim().toUpperCase();
      if (!codigoLimpio) continue;

      const origenLimpio = item.origen || 'PROPIO_MACROLATAS';
      const key = this.buildCompositeKey(origenLimpio, codigoLimpio);
      const existente = mapaProductos.get(key);

      if (existente) {
        // ACTUALIZACIÓN IDEMPOTENTE:
        // Se actualizan precios, ubicación y catálogo; el stock se sincroniza al nuevo valor del archivo
        existente.precioVenta =
          item.precioVenta > 0 ? item.precioVenta : existente.precioVenta;
        existente.costo = item.costo > 0 ? item.costo : existente.costo;
        existente.stockActual = item.stockActual; // Sincronización directa para evitar duplicar stock
        if (item.ubicacion) existente.ubicacion = item.ubicacion;
        if (item.nombre) existente.nombre = item.nombre.trim();
        if (item.descripcion) existente.descripcion = item.descripcion;
        if (item.marcaRepuesto) existente.marcaRepuesto = item.marcaRepuesto;
        if (item.marcaVehiculo) existente.marcaVehiculo = item.marcaVehiculo;
        actualizados++;
      } else {
        // INSERCIÓN DE NUEVA REFERENCIA
        const nuevo: Producto = {
          id: this.nextId++,
          codigo: codigoLimpio,
          nombre: item.nombre?.trim() || 'Sin Nombre',
          descripcion: item.descripcion || '',
          categoriaId: 1,
          nombreCategoria: item.categoriaNombre || 'General',
          marcaRepuesto: item.marcaRepuesto || 'GENÉRICO',
          marcaVehiculo: item.marcaVehiculo || 'MULTIMARCA',
          condicion: item.condicion || 'Nuevo',
          origen: origenLimpio,
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

    // 3. Volcar los nuevos elementos al inicio de la lista
    if (nuevosParaAgregar.length > 0) {
      this.catalogoEnMemoria.unshift(...nuevosParaAgregar);
    }

    const respuesta: CargaMasivaResponse = {
      registrosProcesados: items.length,
      registrosExitosos: insertados + actualizados,
      registrosOmitidos: items.length - (insertados + actualizados),
      mensajes: [
        `Proceso completado: ${insertados} referencias creadas, ${actualizados} actualizadas (Total: ${insertados + actualizados}).`,
      ],
    };

    return of(respuesta).pipe(delay(250));
  }

  override getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>> {
    let filtrados = [...this.catalogoEnMemoria];

    if (params.soloActivos) {
      filtrados = filtrados.filter((p) => p.activo === true);
    }

    if (params.busqueda && params.busqueda.trim() !== '') {
      const q = params.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q),
      );
    }

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

    return of(response).pipe(delay(100));
  }

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
