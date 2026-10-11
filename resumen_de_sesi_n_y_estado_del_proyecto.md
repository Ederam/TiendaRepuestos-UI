# Resumen de Sesión de Ingeniería: TiendaRepuestos-UI (MACROLATAS)

> **Fecha:** 10 de Octubre de 2026
> **Stack:** Angular 19 (Standalone, Signals, Material, Strict Mode)
> **Directorio de Trabajo:** `D:\ER-DEV\App-Repuestos\TiendaRepuestos-UI`

---

## 1. Diagnóstico del Error Visual en el Navegador

En la captura de pantalla se observa la notificación:
> **"No se pudo conectar con el servidor backend. Verifique su conexión y CORS."**

### Causa Técnica:
1. **El interceptor de errores funcionó correctamente:** Capturó un error HTTP con `status: 0` (falla de red) y desplegó el mensaje adecuado a través de `NotificationService`.
2. **Origen de la llamada:** La aplicación intentó consultar el endpoint real `https://localhost:7298/api/Auth/login` porque en `app.config.ts` o en `src/environments/environment.development.ts`, la inyección resolvió a `AuthHttpService` en lugar de `AuthMockService`, o `useMocks` aún no estaba activo/guardado en el archivo que lee la compilación de `ng serve`. Al no estar el backend de .NET 8 encendido, el navegador rechazó la conexión.
3. **Punto pendiente para la próxima sesión:** Ajustar la lectura del flag en `app.config.ts` para que el botón Demo active el bypass local sin disparar la petición HTTP al backend.

---

## 2. Entregables y Arquitectura Construida en la Sesión

1. **Diseño de la Capa Core y Puertos/Adaptadores:**
   - Contratos abstractos en `core/services/` (`AuthService`, `ProductoService`, `VentaService`).
   - Implementaciones HTTP reales para integración directa con .NET 8.
   - Implementaciones Mock con catálogo automotriz para MACROLATAS (`repuestos.mock.ts`).
   - Reorganización de servicios por carpetas de dominio (`auth/`, `productos/`, `ventas/`).
2. **Seguridad y Enrutamiento Funcional (RBAC):**
   - Guards funcionales `authGuard`, `roleGuard` y `publicGuard` basados en `CanActivateFn`.
   - Constantes centralizadas inmutables (`ROLES`, `METODOS_PAGO`) eliminando cadenas quemadas.
   - Jerarquía con `RouterOutlet` anidado y lazy loading completo en `app.routes.ts`.
3. **Identidad Visual Corporativa (MACROLATAS):**
   - Extracción de paleta institucional (Azul Cobalto y Rojo Carmín) e integración en el Shell (`MainLayoutComponent`).
   - Barra superior (Toolbar) y menú lateral responsivo filtrado reactivamente por roles.
4. **Módulo de Inventario:**
   - Tabla reactiva de repuestos con `MatTable` y paginación en servidor con `MatPaginator`.
   - Búsqueda en tiempo real con operador reactivo `debounceTime(400)` para prevenir saturación de peticiones.
   - Indicador visual y tooltip para productos con stock bajo umbral crítico.
5. **Módulo de Punto de Venta (POS):**
   - Carrito de compras reactivo en memoria gestionado con Signals.
   - Totalización reactiva automática mediante `computed()`.
   - Validación de cantidades contra existencias reales antes de agregar al ticket.

---

## 3. Comandos de Consola para Guardar y Subir Cambios a Git

Ejecuta el siguiente bloque en tu terminal de PowerShell en la raíz del proyecto (`D:\ER-DEV\App-Repuestos\TiendaRepuestos-UI`):

```powershell
# 1. Comprobar todos los archivos creados y modificados
git status

# 2. Agregar todos los cambios al staging area
git add .

# 3. Crear el commit formal con la convención de mensajes
git commit -m "feat(architecture): modularizacion de servicios por dominio, adaptadores mock, modulo POS y shell MACROLATAS"

# 4. Enviar los cambios al repositorio remoto en GitHub
git push origin main
```

---

## 4. Tareas Pendientes para Iniciar la Próxima Sesión

1. **Verificar la inyección de `AuthMockService` en `app.config.ts`** para garantizar el ingreso demo local 100% desconectado.
2. **Probar el flujo completo en el navegador:** Login Demo -> Inventario -> Caja POS -> Venta emitida.
3. **Ajustar el diálogo modal (`MatDialog`) para registrar nuevos repuestos** en el inventario desde el rol de Administrador.