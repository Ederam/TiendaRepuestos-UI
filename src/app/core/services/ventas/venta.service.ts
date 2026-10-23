/**
 * @fileoverview Contrato base (Clase Abstracta / Puerto) para la gestión y consulta de ventas.
 * Desacoplado de infraestructura para permitir implementaciones HTTP reales o simuladores en memoria (Mock).
 */

import { Observable } from 'rxjs';
import { CreateVentaRequest, VentaResponse } from '../../models/venta.models';

/**
 * Puerto de servicio para el procesamiento y consulta de transacciones en el punto de venta.
 */
export abstract class VentaService {
  /**
   * Registra una orden de venta en el backend, asignando folio atómico y deduciendo existencias de inventario.
   * @param request Datos de la transacción, modalidad de pago, cliente y productos.
   * @returns Observable con el comprobante fiscal estructurado devuelto por el servidor.
   */
  abstract registrarVenta(
    request: CreateVentaRequest,
  ): Observable<VentaResponse>;

  /**
   * Obtiene la relación histórica consolidada de todas las ventas emitidas en el establecimiento.
   * @returns Observable con el arreglo de comprobantes de venta.
   */
  abstract obtenerVentas(): Observable<VentaResponse[]>;

  /**
   * Consulta una venta específica por su identificador único (GUID).
   * @param id Identificador global de la venta.
   * @returns Observable con el comprobante desglosado.
   */
  abstract obtenerVentaPorId(id: string): Observable<VentaResponse>;
}
