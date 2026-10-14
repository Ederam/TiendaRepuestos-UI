/**
 * @fileoverview Contrato base (Clase Abstracta) para el servicio de productos.
 * Permite desacoplar los componentes de la infraestructura física (HTTP o Mock).
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

export abstract class ProductoService {
  abstract getProductosPaginado(
    params: ProductoFilterParams,
  ): Observable<PagedResponse<Producto>>;
  abstract createProducto(request: CreateProductoRequest): Observable<Producto>;
  abstract cargaMasiva(
    items: CargaMasivaItemRequest[],
  ): Observable<CargaMasivaResponse>;
}
