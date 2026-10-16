/**
 * @fileoverview Componente orquestador para la importación masiva de repuestos en MACROLATAS.
 * Permite seleccionar el tipo de plantilla, previsualizar los datos parseados con SheetJS
 * y ejecutar la persistencia masiva en backend o mock.
 */

import { Component, inject, signal, WritableSignal } from '@angular/core';
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
import {
  CargaMasivaItemRequest,
  CargaMasivaResponse,
} from '@core/models/producto.models';
import { ExcelParserStrategy } from './strategies/excel-parser.strategy';
import { MacrolatasParserStrategy } from './strategies/macrolatas-parser.strategy';
import { EurocarParserStrategy } from './strategies/eurocar-parser.strategy';

/**
 * Opciones de formatos de plantilla soportados en el sistema.
 */
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
  /** Servicio abstracto de productos inyectado */
  private readonly productoService: ProductoService = inject(ProductoService);

  /** Servicio de notificaciones y toasts */
  private readonly notify: NotificationService = inject(NotificationService);

  /** Formato de plantilla seleccionado por el operador */
  readonly formatoSeleccionado: WritableSignal<FormatoPlantilla> =
    signal<FormatoPlantilla>('MACROLATAS');

  /** Colección de registros procesados para la tabla de previsualización */
  readonly itemsPrevisualizacion: WritableSignal<CargaMasivaItemRequest[]> =
    signal<CargaMasivaItemRequest[]>([]);

  /** Indicador de procesamiento en segundo plano */
  readonly isProcesando: WritableSignal<boolean> = signal<boolean>(false);

  /** Nombre del archivo cargado por el usuario */
  readonly nombreArchivo: WritableSignal<string> = signal<string>('');

  /** Columnas visibles de la grilla de previsualización */
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

  /**
   * Maneja el evento de selección de archivo binario desde el input file.
   * @param event Evento estándar del DOM.
   */
  onFileChange(event: Event): void {
    const input: HTMLInputElement = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file: File = input.files[0];
    this.nombreArchivo.set(file.name);
    this.isProcesando.set(true);

    const reader: FileReader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) =>
      this.procesarBuffer(e.target?.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  }

  /**
   * Lee el buffer binario en un libro de SheetJS y ejecuta la estrategia correspondiente.
   * @param buffer Contenido binario del archivo Excel.
   */
  private procesarBuffer(buffer: ArrayBuffer): void {
    setTimeout(() => {
      try {
        const workbook: XLSX.WorkBook = XLSX.read(buffer, {
          type: 'array',
          cellFormula: false,
          cellHTML: false,
          cellText: false,
          dense: true,
        });
        const strategy: ExcelParserStrategy = this.obtenerEstrategia();
        const items: CargaMasivaItemRequest[] = strategy.parse(workbook);

        this.itemsPrevisualizacion.set(items);
        this.notify.showSuccess(
          `Se previsualizaron ${items.length} referencias listas para confirmar.`,
        );
      } catch {
        this.notify.showError('Error al procesar el archivo Excel.');
      } finally {
        this.isProcesando.set(false);
      }
    }, 50);
  }

  /**
   * Factoría que retorna la estrategia adecuada según el formato seleccionado.
   * @returns Instancia concreta de ExcelParserStrategy.
   */
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

  /**
   * Envía el lote previsualizado al servicio de persistencia y reporta el balance cuantitativo.
   */
  confirmarImportacion(): void {
    const lista: CargaMasivaItemRequest[] = this.itemsPrevisualizacion();
    if (!lista.length) return;

    this.isProcesando.set(true);
    this.productoService.cargaMasiva(lista).subscribe({
      next: (res: CargaMasivaResponse) => {
        const mensaje: string =
          `¡Éxito! ${res.insertados} creados, ${res.actualizados} actualizados, ` +
          `${res.sinCambios} sin cambios. (Total: ${res.totalProcesados})`;

        this.notify.showSuccess(mensaje);
        this.cancelar();
      },
      error: () => {
        this.notify.showError(
          'No se pudo completar la carga masiva en el servidor.',
        );
      },
      complete: () => {
        this.isProcesando.set(false);
      },
    });
  }

  /**
   * Limpia la previsualización y reinicia el estado de carga.
   */
  cancelar(): void {
    this.itemsPrevisualizacion.set([]);
    this.nombreArchivo.set('');
  }
}
