/**
 * @fileoverview Componente para la lectura, normalización y carga masiva de repuestos
 * desde plantillas Excel (Macrolatas, Eurocar y formato estándar).
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Core
import { ProductoService } from '../../../core/services/productos/producto.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CargaMasivaItemRequest,
  CondicionRepuesto,
  OrigenInventario,
} from '../../../core/models/producto.models';

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

  /**
   * Maneja el archivo cargado y utiliza SheetJS para parsearlo.
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.nombreArchivo.set(file.name);
    this.isProcesando.set(true);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        this.procesarWorkbook(workbook);
      } catch (err) {
        this.notify.showError('Ocurrió un error al leer el archivo Excel.');
        this.isProcesando.set(false);
      }
    };

    reader.readAsBinaryString(file);
  }

  /**
   * Mapea las columnas del Excel según el formato elegido.
   */
  private procesarWorkbook(workbook: XLSX.WorkBook): void {
    const formato = this.formatoSeleccionado();
    const items: CargaMasivaItemRequest[] = [];

    if (formato === 'MACROLATAS') {
      // Recorrer las hojas relevantes del archivo de Macrolatas
      const hojasAExcluir = ['wo_cadenaCN'];
      const hojasValidas = workbook.SheetNames.filter(
        (name) => !hojasAExcluir.includes(name),
      );

      hojasValidas.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        rows.forEach((row) => {
          const codigo = row['REFERENCIA'] || row['Codigo_Producto'];
          const nombre = row['DESCRPCION'] || row['Descripción'];

          if (codigo && nombre && String(codigo).trim() !== '') {
            items.push({
              codigo: String(codigo).trim().toUpperCase(),
              nombre: String(nombre).trim(),
              categoriaNombre: sheetName,
              marcaRepuesto: String(row['MARCA'] || 'GENÉRICO')
                .trim()
                .toUpperCase(),
              marcaVehiculo: String(row['MARCA VEHICULO'] || '')
                .trim()
                .toUpperCase(),
              condicion: 'Nuevo',
              origen: 'PROPIO_MACROLATAS',
              ubicacion: String(row['UBICACIÓN'] || 'BODEGA PRINCIPAL').trim(),
              costo: Number(row['COSTO']) || 0,
              precioVenta: Number(row['PRECIO']) || 0,
              stockActual: Number(row['CANT']) || 1,
            });
          }
        });
      });
    } else {
      // Formato EUROCAR / ALIADOS
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const esSegunda = formato === 'EUROCAR_SEGUNDA';

      rows.forEach((row) => {
        const codigo = row['Codigo_Producto'] || row['REFERENCIA'];
        const nombre = row['Descripción'] || row['DESCRPCION'];

        if (codigo && nombre && String(codigo).trim() !== '') {
          items.push({
            codigo: String(codigo).trim().toUpperCase(),
            nombre: String(nombre).trim(),
            categoriaNombre: 'Colisión / Latas',
            marcaRepuesto: 'TAIWÁN / EURO',
            marcaVehiculo: '',
            condicion: esSegunda ? 'Segunda' : 'Nuevo',
            origen: 'ALIADO_EUROCAR',
            ubicacion: String(
              row['UBI EURO'] || row['Personalizado14'] || 'BODEGA ALIADO',
            ).trim(),
            costo: Number(row['PRECIO EURO'] || row['Precio2']) * 0.8 || 0, // Costo estimado de compra aliado
            precioVenta: Number(row['PRECIO EURO'] || row['Precio2']) || 0,
            stockActual: Number(row['CANT EURO'] || row['Cant']) || 1,
          });
        }
      });
    }

    this.itemsPrevisualizacion.set(items);
    this.isProcesando.set(false);
    this.notify.showSuccess(
      `Se previsualizaron ${items.length} referencias listas para importar.`,
    );
  }

  confirmarImportacion(): void {
    const lista = this.itemsPrevisualizacion();
    if (lista.length === 0) return;

    this.isProcesando.set(true);

    this.productoService.cargaMasiva(lista).subscribe({
      next: (res) => {
        this.isProcesando.set(false);
        this.notify.showSuccess(
          `¡Éxito! ${res.registrosExitosos} repuestos registrados en el inventario.`,
        );
        this.itemsPrevisualizacion.set([]);
        this.nombreArchivo.set('');
      },
      error: () => {
        this.isProcesando.set(false);
        this.notify.showError('No se pudo completar la carga masiva.');
      },
    });
  }

  cancelar(): void {
    this.itemsPrevisualizacion.set([]);
    this.nombreArchivo.set('');
  }
}
