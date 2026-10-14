import * as XLSX from 'xlsx';
import { CargaMasivaItemRequest } from '@core/models/producto.models';
import { ExcelParserStrategy } from './excel-parser.strategy';
import { ExcelNumericUtils } from '../utils/excel-numeric.utils';

export class MacrolatasParserStrategy implements ExcelParserStrategy {
  private readonly hojasExcluidas = ['wo_cadenaCN', 'RESUMEN', 'CONFIGURACION'];

  parse(workbook: XLSX.WorkBook): CargaMasivaItemRequest[] {
    const hojasValidas = workbook.SheetNames.filter(
      (n) => !this.hojasExcluidas.includes(n),
    );

    return hojasValidas.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return [];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
      });
      return rows.flatMap((row) => this.mapearFila(row, sheetName));
    });
  }

  private mapearFila(row: any, categoria: string): CargaMasivaItemRequest[] {
    const codigo = String(
      row['REFERENCIA'] || row['Codigo_Producto'] || row['CODIGO'] || '',
    ).trim();
    const nombre = String(
      row['DESCRPCION'] || row['DESCRIPCION'] || row['Descripción'] || '',
    ).trim();
    if (!codigo || !nombre) return [];

    const precio = ExcelNumericUtils.parse(
      row['PRECIO'] || row['PRECIO VENTA'] || row['VR VENTA'] || row['VALOR'],
    );
    const costo = ExcelNumericUtils.parse(
      row['COSTO'] || row['VR COSTO'] || row['COMPRA'],
    );
    const stock = ExcelNumericUtils.parse(
      row['CANT'] || row['CANTIDAD'] || row['STOCK'],
    );

    return [
      {
        codigo: codigo.toUpperCase(),
        nombre,
        categoriaNombre: categoria,
        marcaRepuesto: String(row['MARCA'] || 'GENÉRICO')
          .trim()
          .toUpperCase(),
        marcaVehiculo: String(row['MARCA VEHICULO'] || 'MULTIMARCA')
          .trim()
          .toUpperCase(),
        condicion: 'Nuevo',
        origen: 'PROPIO_MACROLATAS',
        ubicacion: String(
          row['UBICACIÓN'] || row['UBICACION'] || 'BODEGA PRINCIPAL',
        ).trim(),
        costo,
        precioVenta: precio,
        stockActual: stock > 0 ? stock : 1,
      },
    ];
  }
}
