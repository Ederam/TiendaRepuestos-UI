/**
 * @fileoverview Configuración global de la aplicación TiendaRepuestos-UI.
 * Provee enrutamiento, animaciones, cliente HTTP e inyección condicional de adaptadores.
 */

import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

// Interceptores
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Contratos base (Puertos)
import { AuthService } from './core/services/auth/auth.service';
import { ProductoService } from './core/services/productos/producto.service';
import { VentaService } from './core/services/ventas/venta.service';

// Implementaciones Reales HTTP (Adaptadores)
import { AuthHttpService } from './core/services/auth/auth-http.service';
import { ProductoHttpService } from './core/services/productos/producto-http.service';
import { VentaHttpService } from './core/services/ventas/venta-http.service';

// Implementaciones Mock (Adaptadores)
import { AuthMockService } from './core/services/auth/auth-mock.service';
import { ProductoMockService } from './core/services/productos/producto-mock.service';
import { VentaMockService } from './core/services/ventas/venta-mock.service';
import { ReporteService } from '@core/services/reportes/reporte.service';
import { ReporteMockService } from '@core/services/reportes/reporte-mock.service';
import { ReporteHttpService } from '@core/services/reportes/reporte-http.service';
import { provideServiceWorker } from '@angular/service-worker';
import { ClienteMockService } from '@core/services/clientes/cliente-mock.service';
import { ClienteHttpService } from '@core/services/clientes/cliente-http.service';
import { ClienteService } from '@core/services/clientes/cliente.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),

    // Inyección de Dependencias por Adaptador según environment.useMocks
    {
      provide: AuthService,
      useClass: environment.useMocks ? AuthMockService : AuthHttpService,
    },
    {
      provide: ProductoService,
      useClass: environment.useMocks
        ? ProductoMockService
        : ProductoHttpService,
    },
    {
      provide: VentaService,
      useClass: environment.useMocks ? VentaMockService : VentaHttpService,
    },
    {
      provide: ClienteService,
      useClass: environment.useMocks ? ClienteMockService : ClienteHttpService,
    },
    {
      provide: ReporteService,
      useClass: environment.useMocks ? ReporteMockService : ReporteHttpService,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
