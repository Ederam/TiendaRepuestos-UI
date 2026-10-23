/**
 * @fileoverview Contrato base (Clase Abstracta) para el servicio de productos en MACROLATAS.
 * Define las operaciones disponibles para desacoplar los componentes de la infraestructura física (HTTP o Mock).
 */

import { Observable } from 'rxjs';
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
 * Puerto primario para la gestión del catálogo e inventario.
 */
export abstract class ProductoService {
  /**
   * Consulta el catálogo de repuestos de forma paginada y filtrada.
   * @param params Criterios de filtro y paginación.
   */
  abstract getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>>;

  /**
   * Registra un repuesto de forma individual.
   * @param request Datos del repuesto a crear.
   */
  abstract createProducto(request: CreateProductoRequest): Observable<Producto>;

  /**
   * Actualiza la información técnica, financiera y física de un repuesto existente.
   * @param id Identificador único (GUID) del repuesto.
   * @param request Datos actualizados.
   */
  abstract updateProducto(
    id: string,
    request: CreateProductoRequest,
  ): Observable<Producto>;

  /**
   * Procesa la inserción o actualización masiva de repuestos en lote.
   * @param items Lista de repuestos extraídos del archivo de cálculo.
   */
  abstract cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse>;
}
