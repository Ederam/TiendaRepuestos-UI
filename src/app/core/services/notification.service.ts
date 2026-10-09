/**
 * @fileoverview Servicio transversal para despliegue de mensajes globales (SnackBars).
 * Desacopla la lógica de negocio y los interceptores de la biblioteca UI Angular Material.
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /** Instancia del servicio MatSnackBar de Angular Material */
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Muestra un mensaje emergente de error con estilo visual crítico.
   * @param message Mensaje o concatenación de errores a desplegar.
   */
  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 6000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra una notificación de advertencia o confirmación preventiva.
   * @param message Mensaje informativo o de restricción.
   */
  showWarning(message: string): void {
    this.snackBar.open(message, 'Entendido', {
      duration: 4500,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra un mensaje de éxito para operaciones completadas satisfactoriamente.
   * @param message Mensaje confirmando la operación.
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Aceptar', {
      duration: 3500,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
