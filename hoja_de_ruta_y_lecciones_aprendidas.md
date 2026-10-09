# TiendaRepuestos-UI: Hoja de Ruta Técnica y Lecciones Aprendidas

> **Stack Base:** Angular 19 (Standalone, Signals, Functional Interceptors, Typed Router, Strict Mode)  
> **UI Library:** Angular Material (M3 / MDC Components)  
> **Backend:** .NET 8 Web API (Clean Architecture, JWT, RBAC, RFC 7807 Problem Details)  
> **Entorno de Trabajo:** `C:\DEV_ER\Mis Archivos\Projects\Repuestos\TiendaRepuestos-UI`

---

## 1. Visión y Principios Rectores

El frontend de **TiendaRepuestos** es una Single Page Application (SPA) transaccional orientada a alta concurrencia de inventario y punto de venta (POS). 

### Principios de Ingeniería
1. **Tipado Estricto de Extremo a Extremo:** Cero uso de `any`. Las interfaces y contratos de datos reflejan rigurosamente los DTOs y estándares del backend en .NET 8.
2. **Reactividad Fina con Signals:** Separación clara de responsabilidades:
   - **Signals / Computed:** Estado sincrónico en memoria (sesión de usuario, filtros, totales derivados).
   - **RxJS:** Flujos asíncronos y eventos en el tiempo (peticiones HTTP, debounce en inputs de búsqueda).
3. **Manejo Estandarizado de Errores (RFC 7807):** Toda respuesta no exitosa del backend se interpreta según `ProblemDetails`, extrayendo automáticamente los mensajes de validación de FluentValidation para el operador.
4. **Arquitectura Modular por Dominios (Core / Features / Shared):**
   - **`core/`:** Servicios singleton, interceptores HTTP, guards funcionales, constantes globales y contratos transversales.
   - **`features/`:** Páginas y componentes de negocio autocontenidos y cargados bajo demanda (`loadChildren` / `loadComponent`).
   - **`shared/`:** Componentes tontos (dumb components), pipes, directivas y wrappers de Angular Material reutilizables.

---

## 2. Hoja de Ruta de Desarrollo (Roadmap)

```
[Fase 1: Cimientos y Auth] ➔ [Fase 2: Shell & Layout] ➔ [Fase 3: Inventario] ➔ [Fase 4: Punto de Venta (POS)] ➔ [Fase 5: Reportes] ➔ [Fase 6: Hardening & Deploy]
```

```
       MATRIZ DE PROGRESO DE ENTREGABLES
┌───────────────────────────────────────────────┬────────────┬─────────────┐
│ Módulo / Hito                                 │ Estado     │ Prioridad   │
├───────────────────────────────────────────────┼────────────┼─────────────┤
│ Fase 1: Core Architecture, DTOs & Auth        │ EN PROCESO │ Crítica     │
│ Fase 2: Layout Base, Navbar & Navigation Shell│ PENDIENTE  │ Alta        │
│ Fase 3: Gestión de Productos e Inventario     │ PENDIENTE  │ Alta        │
│ Fase 4: Punto de Venta (Módulo Transaccional) │ PENDIENTE  │ Crítica     │
│ Fase 5: Reportes y Dashboards de Métricas     │ PENDIENTE  │ Media       │
│ Fase 6: Pruebas E2E, Auditoría y Producción   │ PENDIENTE  │ Alta        │
└───────────────────────────────────────────────┴────────────┴─────────────┘
```

---

### Detalle de las Fases

#### Fase 1: Arquitectura Base, Contratos DTO y Seguridad
- [x] Configuración de TypeScript Strict y verificación de compilación.
- [x] Contratos TypeScript (`ProblemDetails`, `PagedResponse`, `LoginRequest/Response`, `Producto`, `Venta`).
- [x] Constantes de roles inmutables (`ROLES as const`).
- [x] `AuthService` reactivo con `signal()` y selectores `computed()`.
- [x] Interceptor funcional JWT (`jwtInterceptor`).
- [x] Interceptor funcional de captura RFC 7807 (`errorInterceptor`).
- [ ] Route Guards funcionales (`authGuard`, `roleGuard`).
- [ ] Componente Standalone de Login con Angular Material y Reactive Forms.

#### Fase 2: Shell de Aplicación y Navegación
- [ ] Creación de `MainLayoutComponent` con `MatSidenav`, `MatToolbar` y `MatList`.
- [ ] Sistema de menú dinámico según rol (`Administrador` vs `Vendedor`).
- [ ] Rutas perezosas (`app.routes.ts`) con lazy loading completo.
- [ ] Indicador global de carga (`MatProgressBar` / `LoadingInterceptor`).

#### Fase 3: Catálogo e Inventario de Productos
- [ ] `ProductoService` con soporte para paginación de servidor y filtros combinados (`/api/Productos/paginado`).
- [ ] Vista de listado con `MatTable`, `MatPaginator`, `MatSort` y búsqueda con `debounceTime`.
- [ ] Modal reactivo (`MatDialog`) para alta y edición de repuestos (restringido a `Administrador`).
- [ ] Alertas visuales para productos con stock bajo el umbral mínimo (`stockActual <= stockMinimo`).

#### Fase 4: Punto de Venta (POS) y Facturación
- [ ] Interfaz de venta rápida optimizada para teclado y lector de código de barras.
- [ ] Carrito de compras reactivo en memoria gestionado con Signals.
- [ ] Cálculo automático en tiempo real de subtotales, IVA y descuentos con `computed()`.
- [ ] Despacho de venta contra `POST /api/Ventas` con bloqueo de botón ante envíos duplicados.
- [ ] Impresión o visualización del ticket/factura generado.

#### Fase 5: Reportes Gerenciales (Solo Administrador)
- [ ] Componente de visualización de **Stock Crítico** (`GET /api/Reportes/stock-critico`).
- [ ] Componente de **Top 5 Productos Más Vendidos** (`GET /api/Reportes/top-vendidos?limite=5`).
- [ ] Exportación rápida de reportes a formatos imprimibles o CSV.

#### Fase 6: Optimización, Seguridad y Despliegue
- [ ] Auditoría de Bundle Size y tree-shaking de Angular Material.
- [ ] Configuración de `environment.ts` para producción con proxy reverso / TLS.
- [ ] Script de despliegue mediante contenedor Docker / Nginx o Azure Static Web Apps.

---

## 3. Registro de Decisiones de Arquitectura (ADR)

### ADR-01: Migración a Enfoque 100% Standalone (Sin NgModules)
* **Contexto:** Angular 19 promueve APIs funcionales e independientes. Los módulos clásicos (`@NgModule`) agregan boilerplates innecesarios.
* **Decisión:** Toda la aplicación usará Standalone Components, `provideHttpClient(withInterceptors([...]))` y `provideRouter()`.
* **Consecuencia:** Menor tamaño de empaquetado, inicio más rápido (Tree-Shaking directo) y compatibilidad nativa con las herramientas modernas de Angular.

### ADR-02: Uso de Signals frente a NgRx para Estado de UI y Sesión
* **Contexto:** El POS requiere reaccionar instantáneamente a cambios de stock, usuario autenticado y totales de venta.
* **Decisión:** Gestionar el estado de sesión y del carrito de compras mediante `signal()` y `computed()` dentro de servicios inyectables (`providedIn: 'root'`), sin librerías externas de Redux.
* **Consecuencia:** Se elimina la complejidad de actions, reducers y selectors de NgRx. El rendimiento es óptimo debido a que Angular conoce el nodo exacto del DOM que debe refrescar.

### ADR-03: Sustitución de Enums de TypeScript por `as const`
* **Contexto:** Los `enum` en TypeScript generan código compilado adicional y comportamiento bidireccional que puede provocar colisiones de tipos.
* **Decisión:** Centralizar los roles en un objeto congelado (`ROLES = { ADMIN: '...', VENDEDOR: '...' } as const`) y tipar con `typeof ROLES[keyof typeof ROLES]`.
* **Consecuencia:** Cero sobrecarga en tiempo de ejecución, compatibilidad 100% con los strings del backend y autocompletado en todo el IDE.

---

## 4. Lecciones Aprendidas y Bitácora de Errores Comunes

### Lección 1: Resolución de Rutas de Environments en Angular 19
* **Problema:** Error de compilación `TS2307: Cannot find module '../../../environments/environment'`.
* **Causa:** En las versiones modernas de Angular, el generador no crea la carpeta `environments` por defecto, o la ubica en `src/environments/`. Al importar con rutas relativas largas desde subdirectorios de `core/`, un desfase de un nivel (`../`) rompe el enlace estático.
* **Solución:**
  1. Mantener `environment.ts` y `environment.development.ts` directamente en `src/environments/`.
  2. Verificar los niveles de salto: desde `src/app/core/services/` hacia `src/environments/` el camino relativo exacto es `../../../environments/environment`.

### Lección 2: Parseo Seguro de Tokens JWT en Cliente
* **Problema:** Caídas inesperadas en tiempo de ejecución si el token en `localStorage` está dañado o truncado.
* **Causa:** Ejecutar `JSON.parse(atob(token.split('.')[1]))` asume que el token siempre existe y está bien formado. Si el usuario modifica el valor manualmente, la app crasheaba con `DOMException: Invalid base64 string`.
* **Solución:** Todo parseo de claims o verificación de expiración (`exp`) debe estar blindado dentro de un bloque `try / catch` que retorne `true` (expirado) ante cualquier excepción de deserialización.

### Lección 3: Consumo de Estándar RFC 7807 (ProblemDetails)
* **Problema:** En formularios complejos, el backend devuelve un diccionario de errores de validación (`errors: { Codigo: ["Ya existe"], Stock: ["Debe ser mayor a 0"] }`), pero la UI solo mostraba `Http failure response: 400 Bad Request`.
* **Causa:** El interceptor intentaba leer solo `error.message`.
* **Solución:** Normalizar el `errorInterceptor` para inspeccionar si la respuesta contiene la estructura `ProblemDetails`. Si existe el mapa de `errors`, extraer todos los arreglos con `Object.values(problem.errors).flat()` y unirlos con separador amigable para el operador.

---

## 5. Control de Cambios y Versiones

| Versión | Fecha | Autor / Rol | Descripción de Cambios |
| :--- | :--- | :--- | :--- |
| **0.1.0** | Octubre 2026 | Tech Lead | Estructuración inicial de `core`: DTOs, AuthService con Signals, interceptores HTTP funcionales y creación de este documento de seguimiento. |