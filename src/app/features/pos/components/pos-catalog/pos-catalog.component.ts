/**
 * @fileoverview Componente del Catálogo de Repuestos para el Punto de Venta (POS).
 * Responsable exclusivo de la búsqueda, filtros ergonómicos (Doble fila: Marcas y Tipos),
 * modos de visualización (Grid y Lista) y presentación de autopartes (SRP).
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Modelos y Servicios
import { Producto } from '@core/models/producto.models';
import { ProductoService } from '@core/services/productos/producto.service';
import { NotificationService } from '@core/services/notification.service';
import { PosCartService } from '../../services/pos-cart.service';
import {
  FILTROS_MARCAS_POS,
  FILTROS_TIPOS_POS,
  FiltroRapidoOpcion,
  coincideSinonimoColision,
} from '@core/constants/categorias.constants';
import { obtenerPosicionLado } from '@core/utils/sku-generator.util';

@Component({
  selector: 'app-pos-catalog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './pos-catalog.component.html',
  styleUrl: './pos-catalog.component.scss',
})
export class PosCatalogComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly notify = inject(NotificationService);
  readonly cartService = inject(PosCartService);

  /** Estado de visibilidad del panel de ticket y contador de ítems (para laptops) */
  readonly ticketVisible = input<boolean>(true);
  readonly cantidadEnTicket = input<number>(0);
  readonly toggleTicket = output<void>();

  /** Helper compartido para detección de lado de colisión */
  readonly obtenerPosicionLado = obtenerPosicionLado;

  /** Píldoras de filtros ergonómicos para mostrador */
  readonly filtrosMarca: readonly FiltroRapidoOpcion[] = FILTROS_MARCAS_POS;
  readonly filtrosTipo: readonly FiltroRapidoOpcion[] = FILTROS_TIPOS_POS;

  /** Señales de filtros */
  readonly filtroMarca = signal<string>('');
  readonly filtroTipo = signal<string>('');
  readonly textoBusqueda = signal<string>('');

  /** Modo de visualización: 'grid' (tarjetas) o 'list' (lista mostrador) */
  readonly modoVista = signal<'grid' | 'list'>('grid');

  /** Estado de carga y productos base del backend */
  private readonly _productosBase = signal<Producto[]>([]);
  readonly isBuscando = signal<boolean>(false);

  /** Control reactivo para la barra de búsqueda */
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  /**
   * Filtro reactivo puro con Signals que cruza (Texto AND Marca AND Tipo)
   * y calcula el stock disponible descontando unidades en ticket.
   */
  readonly productosDisponibles = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    const marca = this.filtroMarca().toUpperCase().trim();
    const tipo = this.filtroTipo().toUpperCase().trim();
    const base = this._productosBase();
    const itemsCarrito = this.cartService.items();

    const filtrados = base.filter((prod) => {
      // 1. Filtro por Texto (multi-token AND)
      if (texto) {
        const tokens = texto.split(/\s+/).filter(Boolean);
        const target =
          `${prod.nombre} ${prod.codigo} ${prod.marcaRepuesto || ''} ${prod.marcaVehiculo || ''}`.toLowerCase();
        const coincideTexto = tokens.every((token) => target.includes(token));
        if (!coincideTexto) return false;
      }

      // 2. Filtro por Marca de Vehículo
      if (marca) {
        const targetMarca =
          `${prod.marcaVehiculo || ''} ${prod.marcaRepuesto || ''} ${prod.nombre}`.toUpperCase();
        if (!targetMarca.includes(marca)) return false;
      }

      // 3. Filtro por Tipo de Autoparte con normalización de sinónimos de colisión
      if (tipo) {
        const targetTipo = `${prod.nombre} ${prod.descripcion || ''} ${prod.nombreCategoria || ''}`;
        if (!coincideSinonimoColision(targetTipo, tipo)) return false;
      }

      return true;
    });

    const proyectados = filtrados.map((prod: Producto) => {
      const enCarrito = itemsCarrito.find(
        (c) => c.producto.codigo === prod.codigo,
      );
      const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
      const stockDisponible = Math.max(0, prod.stockActual - cantidadEnCarrito);

      return {
        ...prod,
        stockDisponibleVisual: stockDisponible,
      };
    });

    // Ordenar con existencias primero
    return proyectados.sort((a, b) => {
      if (a.stockDisponibleVisual > 0 && b.stockDisponibleVisual === 0)
        return -1;
      if (a.stockDisponibleVisual === 0 && b.stockDisponibleVisual > 0)
        return 1;
      return 0;
    });
  });

  ngOnInit(): void {
    // Recuperar modo de vista guardado
    try {
      const vistaGuardada = localStorage.getItem('macrolatas_pos_vista') as
        | 'grid'
        | 'list';
      if (vistaGuardada === 'grid' || vistaGuardada === 'list') {
        this.modoVista.set(vistaGuardada);
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }

    this.setupBuscador();
    this.buscarProductos();
  }

  private setupBuscador(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((valor) => {
        this.textoBusqueda.set(valor);
        this.buscarProductos();
      });
  }

  /**
   * Criterio combinado de búsqueda enviado a la capa de persistencia/API.
   */
  private construirCriterio(): string {
    const terminos: string[] = [];
    const texto = this.textoBusqueda().trim();
    if (texto) terminos.push(texto);

    const marca = this.filtroMarca();
    if (marca) terminos.push(marca);

    const tipo = this.filtroTipo();
    if (tipo) terminos.push(tipo);

    return terminos.join(' ');
  }

  /**
   * Consulta al servicio de productos con los términos combinados.
   */
  buscarProductos(): void {
    this.isBuscando.set(true);
    const query = this.construirCriterio();

    this.productoService
      .getProductosPaginado({
        busqueda: query,
        soloActivos: true,
        pageNumber: 1,
        pageSize: 60,
      })
      .subscribe({
        next: (res) => {
          this._productosBase.set(res.items);
          this.isBuscando.set(false);
        },
        error: () => this.isBuscando.set(false),
      });
  }

  /** Alterna entre cuadrícula y vista lista */
  alternarModoVista(modo: 'grid' | 'list'): void {
    this.modoVista.set(modo);
    try {
      localStorage.setItem('macrolatas_pos_vista', modo);
    } catch {
      // Ignorar
    }
  }

  /** Selecciona o alterna píldora de marca */
  seleccionarFiltroMarca(valor: string): void {
    this.filtroMarca.set(valor);
    this.buscarProductos();
  }

  /** Selecciona o alterna píldora de tipo */
  seleccionarFiltroTipo(valor: string): void {
    this.filtroTipo.set(valor);
    this.buscarProductos();
  }

  /** Limpia todos los filtros activos */
  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.textoBusqueda.set('');
    this.filtroMarca.set('');
    this.filtroTipo.set('');
    this.buscarProductos();
  }

  /** Cantidad que el producto tiene apartada en el ticket activo */
  obtenerCantidadEnCarrito(producto: Producto): number {
    const prodId =
      producto.id && producto.id !== '00000000-0000-0000-0000-000000000000'
        ? producto.id
        : null;
    const prodCodigo = (producto.codigo || '').trim().toUpperCase();
    const prodNombre = (producto.nombre || '').trim().toUpperCase();

    const item = this.cartService.items().find((i) => {
      if (
        prodId &&
        i.producto.id &&
        i.producto.id !== '00000000-0000-0000-0000-000000000000'
      ) {
        if (i.producto.id === prodId) return true;
      }
      const itemCodigo = (i.producto.codigo || '').trim().toUpperCase();
      if (prodCodigo && itemCodigo && prodCodigo === itemCodigo) return true;
      return prodNombre === (i.producto.nombre || '').trim().toUpperCase();
    });

    return item ? item.cantidad : 0;
  }

  /**
   * Incorpora el repuesto a la canasta con guarda defensiva estricta de existencias.
   * Si ya no hay unidades disponibles, aborta la operación de inmediato.
   */
  agregarAlCarrito(producto: Producto): void {
    const cantEnTicket = this.obtenerCantidadEnCarrito(producto);
    const stockDisponible = Math.max(0, producto.stockActual - cantEnTicket);

    if (stockDisponible <= 0) {
      this.notify.showWarning(
        `No es posible agregar más unidades. El repuesto "${producto.nombre}" ya tiene todas sus existencias (${producto.stockActual} u.) en el ticket.`,
      );
      return;
    }

    const res = this.cartService.agregarProducto(producto);
    if (!res.exito && res.mensaje) {
      this.notify.showWarning(res.mensaje);
    }
  }
}
