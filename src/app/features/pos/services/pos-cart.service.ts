/**
 * @fileoverview Servicio de estado reactivo (Signals) para la cesta de compras del POS.
 * Aplica el principio de responsabilidad única (SRP), desacoplando totalmente
 * la gestión del carrito, cantidades, validaciones de stock, control de costos y totales monetarios.
 */

import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../../../core/models/producto.models';

/**
 * Representa un ítem activo dentro del carrito de compras con trazabilidad de costos.
 */
export interface CarritoItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  esBajoCosto: boolean;
  esPrecioInvalido: boolean;
}

/**
 * Servicio encargado de gestionar el estado inmutable y reactivo del carrito de ventas.
 */
@Injectable({
  providedIn: 'root',
})
export class PosCartService {
  /** Señal privada que almacena los ítems del carrito */
  private readonly _items = signal<CarritoItem[]>([]);

  /** Exposición de solo lectura de los ítems en canasta */
  readonly items = this._items.asReadonly();

  /** Cálculo reactivo del número total de unidades en la orden */
  readonly cantidadItems = computed(() =>
    this._items().reduce((acum, item) => acum + item.cantidad, 0),
  );

  /** Cálculo reactivo del subtotal bruto de la orden */
  readonly subtotal = computed(() =>
    this._items().reduce((acum, item) => acum + item.subtotal, 0),
  );

  /** Impuesto liquidado (0 para régimen simplificado de mostrador) */
  readonly impuesto = computed(() => 0);

  /** Monto total neto a liquidar */
  readonly total = computed(() => this.subtotal() + this.impuesto());

  /** Bandera reactiva que detecta si hay ítems con precios por debajo del costo o en cero */
  readonly tienePreciosInvalidos = computed(() =>
    this._items().some((item) => item.esPrecioInvalido || item.esBajoCosto),
  );

  /**
   * Incorpora un producto a la canasta validando estrictamente el stock físico existente.
   * Si ya existe, incrementa su volumen hasta el límite de existencias.
   * @param producto Objeto del catálogo de repuestos seleccionado.
   * @returns Objeto indicando el resultado de la operación y el mensaje descriptivo si falló.
   */
  agregarProducto(producto: Producto): { exito: boolean; mensaje?: string } {
    // Guarda defensiva: Validación de existencia física disponible
    if (producto.stockActual <= 0) {
      return {
        exito: false,
        mensaje: `No hay unidades disponibles del repuesto "${producto.nombre}".`,
      };
    }

    const listadoActual = this._items();

    // Normalización de identificadores para búsqueda infalible del repuesto
    const prodId = producto.id && producto.id !== '00000000-0000-0000-0000-000000000000' ? producto.id : null;
    const prodCodigo = (producto.codigo || '').trim().toUpperCase();
    const prodNombre = (producto.nombre || '').trim().toUpperCase();

    // 1. Buscar si el repuesto ya está presente en el ticket
    const indice = listadoActual.findIndex((i) => {
      if (prodId && i.producto.id && i.producto.id !== '00000000-0000-0000-0000-000000000000') {
        if (i.producto.id === prodId) return true;
      }
      const itemCodigo = (i.producto.codigo || '').trim().toUpperCase();
      if (prodCodigo && itemCodigo && prodCodigo === itemCodigo) {
        return true;
      }
      const itemNombre = (i.producto.nombre || '').trim().toUpperCase();
      return prodNombre.length > 0 && prodNombre === itemNombre;
    });

    // 2. Si ya existe, validar que no supere el stock físico antes de sumar +1
    if (indice > -1) {
      const itemExistente = listadoActual[indice];
      if (itemExistente.cantidad >= producto.stockActual) {
        return {
          exito: false,
          mensaje: `Stock máximo alcanzado: No es posible agregar más unidades de "${producto.nombre}" (${producto.stockActual} u. disponibles).`,
        };
      }

      const copiaActualizada = [...listadoActual];
      const nuevaCantidad = itemExistente.cantidad + 1;

      copiaActualizada[indice] = {
        ...itemExistente,
        cantidad: nuevaCantidad,
        subtotal: nuevaCantidad * itemExistente.precioUnitario,
      };

      this._items.set(copiaActualizada);
      return { exito: true };
    }

    // 3. Si no existe, agregarlo como nuevo ítem en el carrito
    const costo = producto.costo || 0;
    const precioBase =
      producto.precioVenta > 0
        ? producto.precioVenta
        : costo > 0
          ? costo
          : 1000;
    const bajoCosto = costo > 0 && precioBase < costo;

    this._items.update((previos) => [
      ...previos,
      {
        producto,
        cantidad: 1,
        precioUnitario: precioBase,
        costoUnitario: costo,
        subtotal: precioBase,
        esBajoCosto: bajoCosto,
        esPrecioInvalido: precioBase <= 0,
      },
    ]);

    return { exito: true };
  }

  /**
   * Modifica directamente la cantidad de unidades de un repuesto validando existencias.
   * Si la cantidad resultante es cero o negativa, retira el producto del carrito.
   * @param codigo Código SKU único del repuesto o identificador del producto.
   * @param cambio Incremento o decremento relativo (+1, -1).
   * @returns Objeto con el estado de la operación.
   */
  actualizarCantidad(
    codigo: string,
    cambio: number,
  ): { exito: boolean; mensaje?: string } {
    let mensajeAdvertencia: string | undefined;

    const actualizados = this._items()
      .map((item) => {
        if (item.producto.codigo === codigo) {
          const nuevaCantidad = item.cantidad + cambio;
          // Guarda defensiva: No permitir superar el stock disponible
          if (cambio > 0 && nuevaCantidad > item.producto.stockActual) {
            mensajeAdvertencia = `Stock máximo alcanzado: ${item.producto.stockActual} unidades disponibles.`;
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        }
        return item;
      })
      .filter((item) => item.cantidad > 0);

    this._items.set(actualizados);

    return {
      exito: !mensajeAdvertencia,
      mensaje: mensajeAdvertencia,
    };
  }

  /**
   * Modifica el precio unitario pactado para un repuesto asegurando margen comercial.
   * Regla de negocio MACROLATAS: Se permite negociación siempre que precioUnitario >= costoUnitario.
   * @param codigo Código SKU único del repuesto a modificar.
   * @param nuevoPrecio Monto comercial acordado con el cliente en mostrador.
   * @returns Objeto con las banderas de validación técnica y financiera.
   */
  actualizarPrecioUnitario(
    codigo: string,
    nuevoPrecio: number,
  ): { esBajoCosto: boolean; esInvalido: boolean; costo: number } {
    const precio = Number(nuevoPrecio) || 0;
    let esBajoCosto = false;
    let esInvalido = precio <= 0;
    let costoRef = 0;

    const actualizados = this._items().map((item) => {
      if (item.producto.codigo === codigo) {
        costoRef = item.costoUnitario;
        esBajoCosto = costoRef > 0 && precio < costoRef;
        esInvalido = precio <= 0;

        return {
          ...item,
          precioUnitario: precio,
          subtotal: item.cantidad * precio,
          esBajoCosto,
          esPrecioInvalido: esInvalido,
        };
      }
      return item;
    });

    this._items.set(actualizados);

    return {
      esBajoCosto,
      esInvalido,
      costo: costoRef,
    };
  }

  /**
   * Remueve definitivamente un repuesto del ticket.
   * @param codigo Identificador del producto a retirar.
   */
  eliminarItem(codigo: string): void {
    this._items.update((previos) =>
      previos.filter((i) => i.producto.codigo !== codigo),
    );
  }

  /**
   * Vacía íntegramente la canasta de compras.
   */
  limpiar(): void {
    this._items.set([]);
  }
}
