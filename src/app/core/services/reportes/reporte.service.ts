/**
 * @fileoverview Puerto abstracto para el suministro de métricas y analítica del almacén.
 */

import { Observable } from 'rxjs';
import { DashboardReporteResponse } from '../../models/reporte.models';

export abstract class ReporteService {
  /**
   * Obtiene las métricas consolidadas del panel de control gerencial.
   */
  abstract getDashboardMetricas(): Observable<DashboardReporteResponse>;
}
