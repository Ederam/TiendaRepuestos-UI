/**
 * @fileoverview Catálogo mock de repuestos automotrices para MACROLATAS.
 * Permite desarrollo ágil y autónomo en frontend sin dependencia de backend.
 */

import { Producto } from '../models/producto.models';

export const MOCK_PRODUCTOS: Producto[] = [
    {
        id: 1,
        codigo: 'HLX-CAP-001',
        nombre: 'Capó Delantero Toyota Hilux 2021-2024',
        descripcion: 'Lata original nueva, con imprimación anticorrosiva lista para pintar',
        categoriaId: 1,
        nombreCategoria: 'Latas y Carrocería',
        precioVenta: 1250000,
        costo: 850000,
        stockActual: 3,
        stockMinimo: 2,
        activo: true
    },
    {
        id: 2,
        codigo: 'HLX-PTR-002',
        nombre: 'Puerta Delantera Derecha Hilux Revo',
        descripcion: 'Puerta nueva en lámina reforzada para modelo doble cabina',
        categoriaId: 1,
        nombreCategoria: 'Latas y Carrocería',
        precioVenta: 980000,
        costo: 690000,
        stockActual: 1,
        stockMinimo: 2,
        activo: true // Stock crítico para probar alerta visual
    },
    {
        id: 3,
        codigo: 'DMX-BMP-003',
        nombre: 'Bumper Delantero Chevrolet D-Max 2018-2022',
        descripcion: 'Parachoques delantero plástico termoformado de alta resistencia',
        categoriaId: 2,
        nombreCategoria: 'Bumpers y Defensas',
        precioVenta: 540000,
        costo: 380000,
        stockActual: 5,
        stockMinimo: 2,
        activo: true
    },
    {
        id: 4,
        codigo: 'HLX-FAR-004',
        nombre: 'Farola Izquierda Toyota Hilux LED',
        descripcion: 'Conjunto óptico principal con luz diurna DRL integrada',
        categoriaId: 3,
        nombreCategoria: 'Iluminación',
        precioVenta: 720000,
        costo: 510000,
        stockActual: 4,
        stockMinimo: 2,
        activo: true
    },
    {
        id: 5,
        codigo: 'REN-GDB-005',
        nombre: 'Guardabarro Izquierdo Renault Duster',
        descripcion: 'Lámina de guardabarro delantero original',
        categoriaId: 1,
        nombreCategoria: 'Latas y Carrocería',
        precioVenta: 320000,
        costo: 210000,
        stockActual: 2,
        stockMinimo: 3,
        activo: true // Stock crítico
    },
    {
        id: 6,
        codigo: 'GEN-PRS-006',
        nombre: 'Persiana Frontal Cromada Hilux Rocco',
        descripcion: 'Rejilla persiana con emblema y apliques cromados',
        categoriaId: 2,
        nombreCategoria: 'Bumpers y Defensas',
        precioVenta: 460000,
        costo: 310000,
        stockActual: 6,
        stockMinimo: 2,
        activo: true
    },
    {
        id: 7,
        codigo: 'CHV-CMP-007',
        nombre: 'Compuerta Trasera Chevrolet Luv D-Max',
        descripcion: 'Compuerta de platón con manija central y herrajes',
        categoriaId: 1,
        nombreCategoria: 'Latas y Carrocería',
        precioVenta: 1100000,
        costo: 780000,
        stockActual: 2,
        stockMinimo: 1,
        activo: true
    },
    {
        id: 8,
        codigo: 'TOY-STP-008',
        nombre: 'Stop Trasero Derecho Hilux 2020+',
        descripcion: 'Lámpara trasera con mica bicolor y arnés',
        categoriaId: 3,
        nombreCategoria: 'Iluminación',
        precioVenta: 380000,
        costo: 260000,
        stockActual: 0,
        stockMinimo: 2,
        activo: true // Agotado para probar botón deshabilitado
    }
];