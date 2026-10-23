/**
 * @fileoverview Diálogo modal de visualización e impresión de ticket térmico (80mm) para MACROLATAS.
 * Prepara el formato de comprobante de venta y dispara la orden de impresión nativa del sistema.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Models & Services
import { VentaResponse } from '../../../core/models/venta.models';
import { CarritoItem } from '../services/pos-cart.service';

/**
 * Estructura de parámetros inyectados en la apertura del modal térmico.
 */
export interface TicketDialogData {
  venta: VentaResponse;
  items: CarritoItem[];
  clienteNombre?: string;
  clienteDocumento?: string;
  metodoPago: string | number;
}

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './ticket-dialog.component.html',
  styleUrl: './ticket-dialog.component.scss',
})
export class TicketDialogComponent {
  readonly dialogRef = inject(MatDialogRef<TicketDialogComponent>);
  readonly data: TicketDialogData = inject(MAT_DIALOG_DATA);

  /** Fecha actual de emisión formateada para el comprobante */
  readonly fechaEmision = new Date();

  /**
   * Ejecuta la orden de impresión del navegador.
   * La regla CSS @media print aísla exclusivamente el contenedor del ticket.
   */
  imprimirTicket(): void {
    window.print();
  }

  /**
   * Cierra el modal de confirmación.
   */
  cerrar(): void {
    this.dialogRef.close();
  }
}
