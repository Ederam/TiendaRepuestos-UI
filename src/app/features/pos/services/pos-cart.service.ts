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
   * Incorpora un producto a la canasta. Si ya existe, incrementa su volumen controlando el stock disponible.
   * @param producto Objeto del catálogo de repuestos seleccionado.
   * @returns Objeto indicando el resultado de la operación y el mensaje descriptivo si falló.
   */
  agregarProducto(producto: Producto): { exito: boolean; mensaje?: string } {
    const listadoActual = this._items();
    const indice = listadoActual.findIndex(
      (i) => i.producto.codigo === producto.codigo,
    );

    if (indice > -1) {
      const itemExistente = listadoActual[indice];
      if (itemExistente.cantidad + 1 > producto.stockActual) {
        return {
          exito: false,
          mensaje: `Existencias agotadas para "${producto.nombre}".`,
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

    if (producto.stockActual < 1) {
      return {
        exito: false,
        mensaje: `Existencias agotadas para "${producto.nombre}".`,
      };
    }

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
   * @param codigo Código SKU único del repuesto.
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
          if (nuevaCantidad > item.producto.stockActual) {
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
   * Permite la edición flexible de precios en el mostrador validando políticas contra costo y cero.
   * @param codigo Código SKU del repuesto.
   * @param nuevoPrecio Valor monetario digitado por el cajero.
   * @returns Objeto con las validaciones de negocio emitidas.
   */
  actualizarPrecioUnitario(
    codigo: string,
    nuevoPrecio: number,
  ): { esInvalido: boolean; esBajoCosto: boolean; costo: number } {
    const precioNumerico = Number(nuevoPrecio) || 0;
    let resultadoValidacion = {
      esInvalido: false,
      esBajoCosto: false,
      costo: 0,
    };

    const actualizados = this._items().map((item) => {
      if (item.producto.codigo === codigo) {
        const esInvalido = precioNumerico <= 0;
        const esBajoCosto =
          item.costoUnitario > 0 && precioNumerico < item.costoUnitario;

        resultadoValidacion = {
          esInvalido,
          esBajoCosto,
          costo: item.costoUnitario,
        };

        return {
          ...item,
          precioUnitario: precioNumerico,
          subtotal: item.cantidad * precioNumerico,
          esBajoCosto,
          esPrecioInvalido: esInvalido,
        };
      }
      return item;
    });

    this._items.set(actualizados);
    return resultadoValidacion;
  }

  /**
   * Elimina un ítem específico de la orden activa.
   * @param codigo Código SKU del repuesto a excluir.
   */
  eliminarItem(codigo: string): void {
    this._items.update((elementos) =>
      elementos.filter((item) => item.producto.codigo !== codigo),
    );
  }

  /**
   * Restablece el carrito dejando la orden activa en ceros.
   */
  limpiar(): void {
    this._items.set([]);
  }
}
