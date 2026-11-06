/**
 * @fileoverview Componente Orquestador de Punto de Venta (POS) para MACROLATAS.
 * Coordina la vista principal desacoplando la lógica en subcomponentes especializados (SRP):
 * - PosCatalogComponent: Catálogo, filtros ergonómicos (Doble fila) y buscador reactivo.
 * - PosTicketComponent: Gestión del ticket, cliente DIAN/Mostrador y cobro.
 * - PosCartService: Estado reactivo y control de precios/cantidades de la canasta.
 */

import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosCatalogComponent } from './components/pos-catalog/pos-catalog.component';
import { PosTicketComponent } from './components/pos-ticket/pos-ticket.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    PosCatalogComponent,
    PosTicketComponent,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent {
  @ViewChild(PosCatalogComponent) readonly catalog?: PosCatalogComponent;

  /**
   * Se ejecuta tras el registro exitoso de una venta en PosTicketComponent.
   * Refresca las existencias del catálogo de repuestos para reflejar el stock actualizado.
   */
  onVentaRegistrada(): void {
    this.catalog?.buscarProductos();
  }
}
