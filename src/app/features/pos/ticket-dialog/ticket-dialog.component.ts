/**
 * @fileoverview Diálogo modal de visualización e impresión de ticket térmico (80mm) para MACROLATAS.
 * Prepara el formato de comprobante de venta y dispara la orden de impresión nativa.
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

// Models
import { VentaResponse } from '../../../core/models/venta.models';
import { CarritoItem } from '../pos.component';

export interface TicketDialogData {
  venta: VentaResponse;
  items: CarritoItem[];
  clienteNombre?: string;
  clienteDocumento?: string;
  metodoPago: string;
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

  /** Fecha actual de emisión formateada */
  readonly fechaEmision = new Date();

  /**
   * Ejecuta la orden de impresión del navegador.
   * Las reglas CSS @media print aíslan exclusivamente el contenedor del ticket.
   */
  imprimirTicket(): void {
    window.print();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
