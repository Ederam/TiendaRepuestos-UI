/**
 * @fileoverview Componente raíz de la aplicación TiendaRepuestos-UI.
 * Actúa como host principal delegando la vista a los componentes enrutados.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'TiendaRepuestos-UI';
}
