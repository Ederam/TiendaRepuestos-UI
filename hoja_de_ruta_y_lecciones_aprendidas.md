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

- **Contexto:** Angular 19 promueve APIs funcionales e independientes. Los módulos clásicos (`@NgModule`) agregan boilerplates innecesarios.
- **Decisión:** Toda la aplicación usará Standalone Components, `provideHttpClient(withInterceptors([...]))` y `provideRouter()`.
- **Consecuencia:** Menor tamaño de empaquetado, inicio más rápido (Tree-Shaking directo) y compatibilidad nativa con las herramientas modernas de Angular.

### ADR-02: Uso de Signals frente a NgRx para Estado de UI y Sesión

- **Contexto:** El POS requiere reaccionar instantáneamente a cambios de stock, usuario autenticado y totales de venta.
- **Decisión:** Gestionar el estado de sesión y del carrito de compras mediante `signal()` y `computed()` dentro de servicios inyectables (`providedIn: 'root'`), sin librerías externas de Redux.
- **Consecuencia:** Se elimina la complejidad de actions, reducers y selectors de NgRx. El rendimiento es óptimo debido a que Angular conoce el nodo exacto del DOM que debe refrescar.

### ADR-03: Sustitución de Enums de TypeScript por `as const`

- **Contexto:** Los `enum` en TypeScript generan código compilado adicional y comportamiento bidireccional que puede provocar colisiones de tipos.
- **Decisión:** Centralizar los roles en un objeto congelado (`ROLES = { ADMIN: '...', VENDEDOR: '...' } as const`) y tipar con `typeof ROLES[keyof typeof ROLES]`.
- **Consecuencia:** Cero sobrecarga en tiempo de ejecución, compatibilidad 100% con los strings del backend y autocompletado en todo el IDE.

---

## 4. Lecciones Aprendidas y Bitácora de Errores Comunes

### Lección 1: Resolución de Rutas de Environments en Angular 19

- **Problema:** Error de compilación `TS2307: Cannot find module '../../../environments/environment'`.
- **Causa:** En las versiones modernas de Angular, el generador no crea la carpeta `environments` por defecto, o la ubica en `src/environments/`. Al importar con rutas relativas largas desde subdirectorios de `core/`, un desfase de un nivel (`../`) rompe el enlace estático.
- **Solución:**
  1. Mantener `environment.ts` y `environment.development.ts` directamente en `src/environments/`.
  2. Verificar los niveles de salto: desde `src/app/core/services/` hacia `src/environments/` el camino relativo exacto es `../../../environments/environment`.

### Lección 2: Parseo Seguro de Tokens JWT en Cliente

- **Problema:** Caídas inesperadas en tiempo de ejecución si el token en `localStorage` está dañado o truncado.
- **Causa:** Ejecutar `JSON.parse(atob(token.split('.')[1]))` asume que el token siempre existe y está bien formado. Si el usuario modifica el valor manualmente, la app crasheaba con `DOMException: Invalid base64 string`.
- **Solución:** Todo parseo de claims o verificación de expiración (`exp`) debe estar blindado dentro de un bloque `try / catch` que retorne `true` (expirado) ante cualquier excepción de deserialización.

### Lección 3: Consumo de Estándar RFC 7807 (ProblemDetails)

- **Problema:** En formularios complejos, el backend devuelve un diccionario de errores de validación (`errors: { Codigo: ["Ya existe"], Stock: ["Debe ser mayor a 0"] }`), pero la UI solo mostraba `Http failure response: 400 Bad Request`.
- **Causa:** El interceptor intentaba leer solo `error.message`.
- **Solución:** Normalizar el `errorInterceptor` para inspeccionar si la respuesta contiene la estructura `ProblemDetails`. Si existe el mapa de `errors`, extraer todos los arreglos con `Object.values(problem.errors).flat()` y unirlos con separador amigable para el operador.

---

## 5. Control de Cambios y Versiones

| Versión   | Fecha        | Autor / Rol | Descripción de Cambios                                                                                                                       |
| :-------- | :----------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **0.1.0** | Octubre 2026 | Tech Lead   | Estructuración inicial de `core`: DTOs, AuthService con Signals, interceptores HTTP funcionales y creación de este documento de seguimiento. |

### Hito 4 — Consolidación de Identidad Comercial (MACROLATAS) y Módulo Inventario

- **Fecha:** 2026-10-10
- **Entregables:**
  - Adaptación de la paleta institucional (Azul Cobalto y Rojo Carmín) en Shell Layout.
  - Implementación de `ProductoService` y catálogo paginado en `InventarioListComponent`.
  - Integración de operador reactivo `debounceTime(400)` para búsquedas optimizadas sin saturación HTTP.
  - Alertas visuales inmediatas para stock por debajo del mínimo crítico.

### Hito 5 — Patrón Puertos y Adaptadores (Hexagonal) y Módulo POS Reactivo

- **Fecha:** 2026-10-10
- **Entregables:**
  - Implementación del principio Abierto/Cerrado (OCP) desacoplando la capa de datos.
  - Creación de contratos abstractos puros (`AuthService`, `ProductoService`, `VentaService`) como Puertos.
  - Implementación de Adaptadores HTTP (`*HttpService`) y Adaptadores Mock en memoria (`*MockService`).
  - Inyección condicional mediante `app.config.ts` según bandera `environment.useMocks`.
  - Construcción del Módulo POS (`PosComponent`) con Signals reactivos para el ticket de venta, cálculo automático con `computed()` y catálogo de métodos de pago (`METODOS_PAGO`).
- **Lecciones Aprendidas:**
  - Las clases abstractas que actúan como puertos no deben declarar miembros privados de infraestructura (`private http`), ya que impiden la sustitución limpia en TypeScript (error TS2720).
  - En Angular 19, los slots de proyección de `MatButton` requieren contenedores unificados para evitar advertencias de compilación `NG8011` en bloques condicionales `@else`.

  ### Hito 6 — Validación Extremo a Extremo de Flujo POS y Refinamiento UI

- **Fecha:** 2026-10-12
- **Entregables:**
  - Validación de ciclo completo de venta y descuento reactivo de stock en mostrador.
  - Ajuste de contraste tipográfico en menú lateral para modo oscuro institucional.
  - Corrección de corte de etiquetas flotantes en inputs outline de Angular Material.
  - Adición de botón de borrado rápido (`X`) en buscador del POS.
  - Verificación exitosa de guardias de ruta ante accesos no autenticados directos por URL.

### Hito 7 — Modal Interactivo de Repuestos (MatDialog) y Sanitización de Datos

- **Fecha:** 2026-10-12
- **Entregables:**
  - Componente modal `ProductoDialogComponent` con `MatDialog` para creación y edición de repuestos.
  - Parametrización de categorías en `CATEGORIAS_REPUESTOS` eliminando listas quemadas en vista.
  - Sanitización en el ciclo de vida del formulario para forzar códigos de repuesto en mayúsculas (`toUpperCase()`) tanto visual como en memoria.
  - Sincronización reactiva del catálogo tras inserciones y actualizaciones.
- **Lecciones Aprendidas:**
  - `style="text-transform: uppercase;"` en CSS es únicamente cosmético; no altera el valor del `FormControl`. Es necesario sanear el valor en TypeScript con `.toUpperCase()` en los eventos de blur o submit.

  ### Hito 8 — Diagnóstico de Renderizado POS y Filtrado en Adaptador Mock

- **Fecha:** 2026-10-13
- **Entregables:**
  - Corrección del operador de filtrado `soloActivos` en `ProductoMockService` para garantizar retorno de catálogo.
  - Aseguramiento de estructura de doble columna en `PosComponent` (Catálogo y Ticket de Venta).
  - Normalización de estados reactivos con Signals para sincronización de stock en mostrador.
- **Lecciones Aprendidas:**
  - **Colapso de CSS Grid/Flexbox:** Declarar `height: calc(100vh - X)` con `overflow: hidden` dentro de un contenedor hijo sin altura mínima forzada provoca que el navegador colapse el área a 0 píxeles. La solución es emplear `min-height` y permitir que el contenido defina su flujo natural.
  - **Coherencia en Adaptadores Mock:** Los adaptadores de prueba deben reflejar con exactitud los filtros requeridos por los componentes (`soloActivos`, paginación, búsqueda), de lo contrario devolverán colecciones vacías simulando falsos errores de red o visuales.

### Hito 9 — Dashboard Gerencial de Reportes y Capacidades PWA

- **Fecha:** 2026-10-13
- **Entregables:**
  - Puerto `ReporteService` y adaptadores (`ReporteHttpService`, `ReporteMockService`) para analítica de ventas.
  - Implementación de `ReportesDashboardComponent` con KPIs de ingresos, tickets, alertas de stock mínimo y top repuestos más vendidos.
  - Gráfica de distribución proporcional de pagos (Efectivo, Transferencia, Tarjeta).
  - Integración del Service Worker de Angular y manifiesto PWA para instalación como app nativa.

### Hito 10 — Centralización de Tokens CSS, Dashboard KPI y Fundamentos PWA

- **Fecha:** 2026-10-13
- **Entregables:**
  - Desacoplamiento de tokens de color mediante CSS Custom Properties (`var(--brand-red)`, `var(--brand-navy)`) en `styles.scss` para soporte de Theming y Marca Blanca.
  - Consolidación del panel de métricas y tarjetas KPI gerenciales para visualización inmediata de salud financiera y rotación de stock.
  - Incorporación del ecosistema PWA: Service Worker de Angular y `manifest.webmanifest` para instalación directa en dispositivos de mostrador y bodega.
- **Lecciones Aprendidas:**
  - **Tokens de Diseño:** El uso reiterado de variables SCSS locales (`$color`) genera dispersión y deuda técnica; las variables CSS nativas (`:root`) permiten centralizar la identidad corporativa y facilitan la conmutación dinámica de estilos multi-cliente.
  - **Concepto PWA:** Un Service Worker almacena en caché local la carcasa de la aplicación (Application Shell), permitiendo arrancar la SPA en terminales móviles con rendimiento nativo.

### Hito 11 — Comprobante Térmico POS e Integración de Impresión Nativa

- **Fecha:** 2026-10-13
- **Entregables:**
  - Componente modal `TicketDialogComponent` con plantilla formateada para comprobantes térmicos de 80mm.
  - Inclusión de metadatos comerciales completos de **MACROLATAS** (Calle 65 # 27B - 13, 7 de Agosto, Bogotá D.C., líneas celulares y PBX).
  - Integración automática del flujo de facturación en `PosComponent`: registro de venta seguido de apertura modal del ticket.
  - Implementación de reglas `@media print` para aislamiento de elementos del DOM (`visibility: hidden` transversal y foco único en `#printable-ticket`) con configuración de página continua `size: 80mm auto`.
- **Lecciones Aprendidas:**
  - **Impresión Térmica en Navegadores:** Para evitar que `window.print()` imprima la barra superior, el Sidenav o márgenes tipo carta (A4), es fundamental fijar `@page { margin: 0; size: 80mm auto; }` y ocultar selectivamente los elementos de la interfaz mediante clases `.no-print`.
  - **Experiencia de Usuario en Mostrador:** El operador no debe tener que buscar la factura en un módulo secundario; tras pulsar "Cobrar", el sistema debe presentar inmediatamente el recibo para impresión con un solo clic.

### Hito 12 — Resolución de Renderizado de Impresión Térmica en Angular CDK y Desacoplamiento de Tokens

- **Fecha:** 2026-10-13
- **Entregables:**
  - Ajuste de selectores `@media print` en `TicketDialogComponent` para omitir `.cdk-overlay-container` y forzar visualización en Chromium sin hojas en blanco.
  - Reemplazo de variables locales SCSS por tokens nativos `var(--brand-navy)` y `var(--brand-red)` de `:root`.
  - Normalización arquitectónica de interfaces locales frente a DTOs de dominio.
- **Lecciones Aprendidas:**
  - **Impresión de Modales en Angular Material:** Ocultar `body *` en CSS de impresión apaga también los contenedores creados por Angular CDK en el body (`.cdk-overlay-container`). Para imprimir un diálogo modal, se deben resetear las propiedades de posicionamiento, sombras y overflow del overlay container y ocultar exclusivamente `app-root` y las clases `.no-print`.

### 3. Registro para la Hoja de Ruta (`hoja_de_ruta_y_lecciones_aprendidas.md`)

Copia y pega este bloque en **`hoja_de_ruta_y_lecciones_aprendidas.md`**:

```markdown
### Hito 13 — Diagnóstico de Impresión en Overlays CDK y Corrección Sintáctica de Tokens CSS

- **Fecha:** 2026-10-13
- **Entregables:**
  - Corrección de sintaxis en `ticket-dialog.component.scss` integrando la función nativa `var(--brand-navy)` dentro de propiedades CSS válidas.
  - Ajuste de selectores en `@media print`: desestructuración de `.cdk-overlay-container` y reseteo de propiedades de posicionamiento para garantizar la transferencia del DOM modal al spooler de impresión del navegador.
  - Estandarización de tablas y bitácora en la documentación de control de versiones.
- **Lecciones Aprendidas:**
  - **Sintaxis de CSS Custom Properties:** La instrucción `var(--token)` no puede existir de forma aislada en la raíz de una hoja de estilos; debe asignarse a una propiedad (`background-color: var(--token);`).
  - **Impresión de Diálogos Modales (CDK Overlays):** Los componentes desplegados mediante `MatDialog` residen en un contenedor hermano fuera de `app-root` (`.cdk-overlay-container`). Al aplicar `@media print`, la instrucción `body * { visibility: hidden; }` oculta el contenedor global del overlay e invalida el layout de impresión. La solución correcta consiste en ocultar selectivamente `app-root` y redefinir `.cdk-overlay-container` como `display: block; position: static;` permitiendo la captura limpia del ticket térmico en PDF o rollo físico.
```

### Hito 15 — Resolución de Dependencia de Animaciones para Build de Producción

- **Fecha:** 2026-10-13
- **Entregables:**
  - Instalación formal de `@angular/animations` para compatibilidad completa con `provideAnimationsAsync()`.
  - Validación exitosa de empaquetado de producción (`npm run build`) generando artefactos en `dist/tienda-repuestos-ui/browser`.
- **Lecciones Aprendidas:**
  - **`provideAnimationsAsync()` en Entornos de Producción:** Aunque `ng serve` puede tolerar la ausencia de `@angular/animations` en memoria, el bundler de producción (esbuild) valida estrictamente las importaciones dinámicas (`import('@angular/animations/browser')`), requiriendo que la dependencia esté declarada en `package.json`.

### Hito 17 — Descuento Reactivo de Existencias en POS y Reordenamiento Inteligente

- **Fecha:** 2026-10-14
- **Entregables:**
  - Actualización de branding institucional: "MACROLATAS — Repuestos de Colisión para Carros".
  - Cálculo de existencias disponibles en mostrador en tiempo real (`stockDisponibleVisual = stockActual - cantidadEnCarrito`) mediante Signals y `computed()`.
  - Reordenamiento automático del catálogo: los productos con disponibilidad física se sitúan en las primeras posiciones y los agotados se desplazan al final.
  - Modelado conceptual para proveedores múltiples, marcas alternativas (TYC, DEPO, Genérico) y consulta de inventario compartido (Latas y Bomperes / Eurocar).
- **Lecciones Aprendidas:**
  - **Doble Estado de Inventario en Mostrador:** El stock físico de base de datos no es idéntico al stock disponible inmediato para venta mientras hay un ticket en proceso. Emplear un valor proyectado derivado (`computed`) garantiza consistencia visual y previene errores de sobreventa sin modificar prematuramente el registro en el servidor.

### Hito 18 — Gestión Ágil de Clientes en Mostrador y Soporte para Facturación

- **Fecha:** 2026-10-14
- **Rama Git:** `feat/clientes-facturacion`
- **Entregables:**
  - Puerto `ClienteService` y adaptadores (`ClienteMockService` / `ClienteHttpService`) para búsqueda por documento o término.
  - Autocompletado reactivo de clientes en mostrador (`MatAutocomplete`) para agilizar transacciones repetitivas sin digitar datos manualmente.
  - Modal rápido `ClienteDialogComponent` para registrar nuevos clientes (Cédula/NIT, Nombre, Teléfono, Correo y bandera de Factura Electrónica) sin interrumpir el ticket de venta.
- **Lecciones Aprendidas:**
  - **Experiencia de Usuario en Mostrador Tradicional:** En un almacén de repuestos, obligar a registrar un cliente antes de vender ralentiza la operación. La solución óptima es mantener "Cliente Mostrador" por defecto y habilitar el autocompletado y registro rápido solo cuando el cliente requiera comprobante formal o factura electrónica.

### Hito 18 — Resolución de Dependencias en Standalone Component y Autocompletado de Clientes

- **Fecha:** 2026-10-14
- **Rama Git:** `feat/clientes-facturacion`
- **Entregables:**
  - Registro de `MatAutocompleteModule` en `PosComponent.imports` para habilitar directivas `matAutocomplete`.
  - Normalización de paths de importación hacia la capa `core` de clientes.
  - Verificación del autocompletado de clientes en el formulario del POS y modal de alta rápida.
- **Lecciones Aprendidas:**
  - **Componentes Standalone en Angular 19:** A diferencia de la arquitectura tradicional basada en `NgModule`, en componentes `standalone: true` toda directiva de plantilla (`matAutocomplete`, `matPrefix`, etc.) debe estar expresamente declarada en la lista `imports` del componente específico; de lo contrario, el compilador no enlaza las propiedades en el DOM (errores NG8001/NG8002).

### Hito 19 — Integración de Gestión de Clientes en Producción y Ciclo de Vida de Tokens

- **Fecha:** 2026-10-14
- **Entregables:**
  - Fusión de la rama `feat/clientes-facturacion` a la rama `main` y despliegue continuo en Vercel.
  - Validación del comportamiento de persistencia en `localStorage` vs. expiración de tokens JWT en `AuthService`.
  - Habilitación del flujo completo de ventas: selección/alta ágil de clientes, ticket con autocalculo y emisión de comprobante térmico.
- **Lecciones Aprendidas:**
  - **Expiración de Tokens JWT:** En arquitecturas SPA, la persistencia en `localStorage` mantiene viva la sesión mientras el token no haya superado su claim `exp`. La exclusión controlada de expiración en entornos mock acelera el desarrollo de interfaz, mientras que en producción la validación contra el reloj Unix garantiza la seguridad de las sesiones inactivas.
