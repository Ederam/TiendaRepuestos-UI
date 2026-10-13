/**
 * @fileoverview Adaptador en memoria con métricas simuladas realistas para MACROLATAS.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ReporteService } from './reporte.service';
import { DashboardReporteResponse } from '../../models/reporte.models';

@Injectable()
export class ReporteMockService extends ReporteService {
  override getDashboardMetricas(): Observable<DashboardReporteResponse> {
    const mockData: DashboardReporteResponse = {
      resumen: {
        ventasHoyTotal: 7,
        ingresosHoyMonto: 4850000,
        repuestosStockCritico: 3,
        totalReferenciasActivas: 28,
      },
      topRepuestos: [
        {
          productoId: 1,
          codigo: 'HLX-CAP-001',
          nombre: 'Capó Delantero Toyota Hilux 2021-2024',
          categoria: 'Latas y Carrocería',
          unidadesVendidas: 5,
          ingresosGenerados: 6250000,
        },
        {
          productoId: 4,
          codigo: 'HLX-FAR-004',
          nombre: 'Farola Izquierda Toyota Hilux LED',
          categoria: 'Iluminación',
          unidadesVendidas: 4,
          ingresosGenerados: 2880000,
        },
        {
          productoId: 3,
          codigo: 'DMX-BMP-003',
          nombre: 'Bumper Delantero Chevrolet D-Max 2018-2022',
          categoria: 'Bumpers y Defensas',
          unidadesVendidas: 3,
          ingresosGenerados: 1620000,
        },
        {
          productoId: 7,
          codigo: 'CHV-CMP-007',
          nombre: 'Compuerta Trasera Chevrolet Luv D-Max',
          categoria: 'Latas y Carrocería',
          unidadesVendidas: 2,
          ingresosGenerados: 2200000,
        },
        {
          productoId: 5,
          codigo: 'REN-GDB-005',
          nombre: 'Guardabarro Izquierdo Renault Duster',
          categoria: 'Latas y Carrocería',
          unidadesVendidas: 2,
          ingresosGenerados: 640000,
        },
      ],
      distribucionPagos: [
        {
          metodoPago: 'Efectivo',
          cantidadTransacciones: 4,
          totalMonto: 2450000,
          porcentaje: 50.5,
        },
        {
          metodoPago: 'Transferencia (Bancolombia/Nequi)',
          cantidadTransacciones: 2,
          totalMonto: 1800000,
          porcentaje: 37.1,
        },
        {
          metodoPago: 'Tarjeta Débito/Crédito',
          cantidadTransacciones: 1,
          totalMonto: 600000,
          porcentaje: 12.4,
        },
      ],
    };

    return of(mockData).pipe(delay(250));
  }
}
