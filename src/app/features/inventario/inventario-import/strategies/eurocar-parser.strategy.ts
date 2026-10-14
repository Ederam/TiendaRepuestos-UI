import * as XLSX from 'xlsx';
import { CargaMasivaItemRequest } from '@core/models/producto.models';
import { ExcelParserStrategy } from './excel-parser.strategy';
import { ExcelNumericUtils } from '../utils/excel-numeric.utils';

export class EurocarParserStrategy implements ExcelParserStrategy {
  constructor(private readonly esSegunda: boolean = false) {}

  parse(workbook: XLSX.WorkBook): CargaMasivaItemRequest[] {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    });
    return rows.flatMap((row) => this.mapearFila(row));
  }

  private mapearFila(row: any): CargaMasivaItemRequest[] {
    const codigo = String(
      row['Codigo_Producto'] || row['REFERENCIA'] || '',
    ).trim();
    const nombre = String(
      row['Descripción'] || row['DESCRIPCION'] || '',
    ).trim();
    if (!codigo || !nombre) return [];

    // Priorizamos los datos de la columna aliada EUROCAR si están presentes
    const precioEuro = ExcelNumericUtils.parse(row['PRECIO EURO']);
    const precioBase = ExcelNumericUtils.parse(row['Precio2']);
    const precioVenta = precioEuro > 0 ? precioEuro : precioBase;

    const cantEuro = ExcelNumericUtils.parse(row['CANT EURO']);
    const cantBase = ExcelNumericUtils.parse(row['Cant']);
    const stockActual = cantEuro > 0 ? cantEuro : cantBase > 0 ? cantBase : 1;

    const ubicacion = String(
      row['UBI EURO'] || row['Personalizado14'] || 'BODEGA EUROCAR',
    ).trim();

    return [
      {
        codigo: codigo.toUpperCase(),
        nombre,
        categoriaNombre: 'Colisión / Latas',
        marcaRepuesto: this.extraerMarca(nombre),
        marcaVehiculo: this.extraerVehiculo(nombre),
        condicion: this.esSegunda ? 'Segunda' : 'Nuevo',
        origen: 'ALIADO_EUROCAR',
        ubicacion,
        costo: Math.round(precioVenta * 0.8), // Margen comercial estimado
        precioVenta,
        stockActual,
      },
    ];
  }

  private extraerMarca(descripcion: string): string {
    const desc = descripcion.toUpperCase();
    if (desc.includes('TYC')) return 'TYC';
    if (desc.includes('DEPO')) return 'DEPO';
    if (desc.includes('TAIWAN')) return 'TAIWÁN';
    return 'GENÉRICO';
  }

  private extraerVehiculo(descripcion: string): string {
    const desc = descripcion.toUpperCase();
    if (desc.includes('AUDI')) return 'AUDI';
    if (desc.includes('RENAULT')) return 'RENAULT';
    if (desc.includes('CHEVROLET')) return 'CHEVROLET';
    return 'MULTIMARCA';
  }
}
