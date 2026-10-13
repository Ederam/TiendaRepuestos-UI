/**
 * @fileoverview Panel de métricas y análisis gerencial para MACROLATAS.
 * Expone KPIs de venta, distribución por medio de pago y piezas de mayor rotación.
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core
import { ReporteService } from '../../../core/services/reportes/reporte.service';
import { DashboardReporteResponse } from '../../../core/models/reporte.models';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './reportes-dashboard.component.html',
  styleUrl: './reportes-dashboard.component.scss',
})
export class ReportesDashboardComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly datos = signal<DashboardReporteResponse | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'categoria',
    'unidades',
    'ingresos',
  ];

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.isLoading.set(true);
    this.reporteService.getDashboardMetricas().subscribe({
      next: (res) => {
        this.datos.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
