// src/app/features/inventario/inventario-import/inventario-import.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProductoService } from '@core/services/productos/producto.service';
import { NotificationService } from '@core/services/notification.service';
import { CargaMasivaItemRequest } from '@core/models/producto.models';
import { ExcelParserStrategy } from './strategies/excel-parser.strategy';
import { MacrolatasParserStrategy } from './strategies/macrolatas-parser.strategy';
import { EurocarParserStrategy } from './strategies/eurocar-parser.strategy';

type FormatoPlantilla = 'MACROLATAS' | 'EUROCAR_NUEVO' | 'EUROCAR_SEGUNDA';

@Component({
  selector: 'app-inventario-import',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
  ],
  templateUrl: './inventario-import.component.html',
  styleUrl: './inventario-import.component.scss',
})
export class InventarioImportComponent {
  private readonly productoService = inject(ProductoService);
  private readonly notify = inject(NotificationService);

  readonly formatoSeleccionado = signal<FormatoPlantilla>('MACROLATAS');
  readonly itemsPrevisualizacion = signal<CargaMasivaItemRequest[]>([]);
  readonly isProcesando = signal<boolean>(false);
  readonly nombreArchivo = signal<string>('');

  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'marca',
    'condicion',
    'origen',
    'ubicacion',
    'costo',
    'precio',
    'stock',
  ];

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.nombreArchivo.set(file.name);
    this.isProcesando.set(true);

    const reader = new FileReader();
    reader.onload = (e) => this.procesarBuffer(e.target?.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  }

  private procesarBuffer(buffer: ArrayBuffer): void {
    setTimeout(() => {
      try {
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellFormula: false,
          cellHTML: false,
          cellText: false,
          dense: true,
        });
        const strategy = this.obtenerEstrategia();
        const items = strategy.parse(workbook);

        this.itemsPrevisualizacion.set(items);
        this.notify.showSuccess(
          `Se previsualizaron ${items.length} referencias.`,
        );
      } catch {
        this.notify.showError('Error al procesar el archivo Excel.');
      } finally {
        this.isProcesando.set(false);
      }
    }, 50);
  }

  private obtenerEstrategia(): ExcelParserStrategy {
    switch (this.formatoSeleccionado()) {
      case 'EUROCAR_NUEVO':
        return new EurocarParserStrategy(false);
      case 'EUROCAR_SEGUNDA':
        return new EurocarParserStrategy(true);
      default:
        return new MacrolatasParserStrategy();
    }
  }

  confirmarImportacion(): void {
    const lista = this.itemsPrevisualizacion();
    if (!lista.length) return;

    this.isProcesando.set(true);
    this.productoService.cargaMasiva(lista).subscribe({
      next: (res) => {
        this.notify.showSuccess(
          `¡Éxito! ${res.registrosExitosos} repuestos registrados.`,
        );
        this.cancelar();
      },
      error: () =>
        this.notify.showError('No se pudo completar la carga masiva.'),
      complete: () => this.isProcesando.set(false),
    });
  }

  cancelar(): void {
    this.itemsPrevisualizacion.set([]);
    this.nombreArchivo.set('');
  }
}
