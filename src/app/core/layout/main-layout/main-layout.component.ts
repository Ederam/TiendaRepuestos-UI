/**
 * @fileoverview Componente maestro (Shell) de TiendaRepuestos-UI.
 * Proporciona la estructura global con barra superior (Toolbar), menú lateral retráctil
 * (Sidenav) y filtrado de opciones de navegación según los roles activos (RBAC).
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

// Core Services & Constants
import { AuthService } from '../../services/auth/auth.service';
import { ROLES } from '../../constants/roles.constants';

/**
 * Representa un elemento interactivo del menú de navegación lateral.
 */
interface NavItem {
    label: string;
    route: string;
    icon: string;
    adminOnly?: boolean;
}

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule
    ],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    /** Signal derivado del usuario actual en sesión */
    readonly currentUser = this.authService.currentUser;

    /** Signal que determina si el usuario en sesión es Administrador */
    readonly isAdmin = this.authService.isAdmin;

    /** Lista de opciones de navegación del sistema */
    readonly navItems: NavItem[] = [
        {
            label: 'Punto de Venta (POS)',
            route: '/pos',
            icon: 'point_of_sale'
        },
        {
            label: 'Inventario / Catálogo',
            route: '/inventario',
            icon: 'inventory_2',
            adminOnly: true
        },
        {
            label: 'Reportes y Métricas',
            route: '/reportes',
            icon: 'bar_chart',
            adminOnly: true
        }
    ];

    /**
     * Finaliza la sesión actual y redirige a la pantalla de login.
     */
    onLogout(): void {
        this.authService.logout();
    }
}