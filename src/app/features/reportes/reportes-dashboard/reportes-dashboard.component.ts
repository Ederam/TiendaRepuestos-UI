/**
 * @fileoverview Dashboard de analítica y métricas para MACROLATAS.
 * Proporciona indicadores KPI, distribución de medios de pago y rotación de repuestos.
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services & Models
import { ReporteService } from '../../../core/services/reportes/reporte.service';
import { DashboardReporteResponse } from '../../../core/models/reporte.models';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './reportes-dashboard.component.html',
  styleUrl: './reportes-dashboard.component.scss',
})
export class ReportesDashboardComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly isLoading = signal<boolean>(false);

  /** Datos reactivos del reporte sincronizados con la plantilla HTML */
  readonly datos = signal({
    ingresosHoy: 4850000,
    transaccionesHoy: 7,
    repuestosBajoStock: 3,
    totalRepuestosActivos: 28,
    ventasPorMetodo: [
      {
        metodo: 'Efectivo',
        total: 2450000,
        transacciones: 4,
        porcentaje: 50.5,
      },
      {
        metodo: 'Transferencia (Bancolombia/Nequi)',
        total: 1800000,
        transacciones: 2,
        porcentaje: 37.1,
      },
      {
        metodo: 'Tarjeta Débito/Crédito',
        total: 600000,
        transacciones: 1,
        porcentaje: 12.4,
      },
    ],
    topRepuestos: [
      {
        codigo: 'HLX-CAP-001',
        nombre: 'Capó Delantero Toyota Hilux 2021-2024',
        cantidadVendida: 5,
        linea: 'Latas y Carrocería',
        totalGenerado: 6250000,
      },
      {
        codigo: 'HLX-FAR-004',
        nombre: 'Farola Izquierda Toyota Hilux LED',
        cantidadVendida: 4,
        linea: 'Iluminación',
        totalGenerado: 2880000,
      },
      {
        codigo: 'DMX-BMP-003',
        nombre: 'Bumper Delantero Chevrolet D-Max 2018-2022',
        cantidadVendida: 3,
        linea: 'Bumpers y Defensas',
        totalGenerado: 1620000,
      },
      {
        codigo: 'CHV-CMP-007',
        nombre: 'Compuerta Trasera Chevrolet Luv D-Max',
        cantidadVendida: 2,
        linea: 'Latas y Carrocería',
        totalGenerado: 2200000,
      },
      {
        codigo: 'REN-GDB-005',
        nombre: 'Guardabarro Izquierdo Renault Duster',
        cantidadVendida: 2,
        linea: 'Latas y Carrocería',
        totalGenerado: 640000,
      },
    ],
  });

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.isLoading.set(true);
    this.reporteService.getDashboardMetricas().subscribe({
      next: (res: DashboardReporteResponse) => {
        if (res) {
          const nuevosTop =
            res.topRepuestos?.map((item) => ({
              codigo: item.codigo,
              nombre: item.nombre,
              cantidadVendida: item.unidadesVendidas,
              linea: item.categoria,
              totalGenerado: item.ingresosGenerados,
            })) ?? this.datos().topRepuestos;

          const nuevosPagos =
            res.distribucionPagos?.map((pago) => ({
              metodo: pago.metodoPago,
              total: pago.totalMonto,
              transacciones: pago.cantidadTransacciones,
              porcentaje: pago.porcentaje,
            })) ?? this.datos().ventasPorMetodo;

          this.datos.set({
            ingresosHoy:
              res.resumen?.ingresosHoyMonto ?? this.datos().ingresosHoy,
            transaccionesHoy:
              res.resumen?.ventasHoyTotal ?? this.datos().transaccionesHoy,
            repuestosBajoStock:
              res.resumen?.repuestosStockCritico ??
              this.datos().repuestosBajoStock,
            totalRepuestosActivos:
              res.resumen?.totalReferenciasActivas ??
              this.datos().totalRepuestosActivos,
            ventasPorMetodo: nuevosPagos,
            topRepuestos: nuevosTop,
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
