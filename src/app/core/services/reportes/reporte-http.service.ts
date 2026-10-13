/**
 * @fileoverview Adaptador HTTP real contra los endpoints de analítica de .NET 8.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReporteService } from './reporte.service';
import { DashboardReporteResponse } from '../../models/reporte.models';

@Injectable()
export class ReporteHttpService extends ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Reportes`;

  override getDashboardMetricas(): Observable<DashboardReporteResponse> {
    return this.http.get<DashboardReporteResponse>(`${this.apiUrl}/dashboard`);
  }
}
