import * as XLSX from 'xlsx';
import { CargaMasivaItemRequest } from '@core/models/producto.models';
import { ExcelParserStrategy } from './excel-parser.strategy';
import { ExcelNumericUtils } from '../utils/excel-numeric.utils';
import { generarSkuAutogeneradoExcel } from '@core/utils/sku-generator.util';

/**
 * Estrategia de procesamiento para libros de Excel nativos de MACROLATAS.
 * Aplica regla híbrida de códigos: conserva códigos existentes con deduplicación
 * y autogenera SKUs estructurados mediante diccionario de colisión cuando vienen vacíos.
 */
export class MacrolatasParserStrategy implements ExcelParserStrategy {
  private readonly hojasExcluidas = ['wo_cadenaCN', 'RESUMEN', 'CONFIGURACION'];
  private readonly codigosRegistrados: Set<string> = new Set<string>();
  private contadorSecuencia: number = 1;

  parse(workbook: XLSX.WorkBook): CargaMasivaItemRequest[] {
    this.codigosRegistrados.clear();
    this.contadorSecuencia = 1;

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
    const nombre = String(
      row['DESCRPCION'] || row['DESCRIPCION'] || row['Descripción'] || '',
    ).trim();

    // Si la fila no contiene ni nombre ni descripción, se omite por estar vacía
    if (!nombre) return [];

    const codigoRaw = String(
      row['REFERENCIA'] || row['Codigo_Producto'] || row['CODIGO'] || '',
    ).trim();

    let codigoFinal: string = '';
    let esAutogenerado: boolean = false;

    if (codigoRaw) {
      // 1. Si trae código, normalizar a mayúsculas y validar contra duplicados en el lote
      let baseCode = codigoRaw.toUpperCase();
      let candidate = baseCode;
      let duplicadoIndex = 2;

      while (this.codigosRegistrados.has(candidate)) {
        candidate = `${baseCode}-D${duplicadoIndex}`;
        duplicadoIndex++;
      }

      codigoFinal = candidate;
      this.codigosRegistrados.add(codigoFinal);
      esAutogenerado = false;
    } else {
      // 2. Si la celda de código viene vacía, autogenerar con diccionario de colisión + lado + secuencia
      let sku = generarSkuAutogeneradoExcel(nombre, this.contadorSecuencia++);
      while (this.codigosRegistrados.has(sku)) {
        sku = generarSkuAutogeneradoExcel(nombre, this.contadorSecuencia++);
      }
      codigoFinal = sku;
      this.codigosRegistrados.add(codigoFinal);
      esAutogenerado = true;
    }

    const precio = ExcelNumericUtils.parse(
      row['PRECIO'] || row['PRECIO VENTA'] || row['VR VENTA'] || row['VALOR'],
    );
    const costo = ExcelNumericUtils.parse(
      row['COSTO'] || row['VR COSTO'] || row['COMPRA'],
    );
    const stock = ExcelNumericUtils.parse(
      row['CANT'] || row['CANTIDAD'] || row['STOCK'],
    );

    const marcaCruda = String(row['MARCA'] || '').trim().toUpperCase();
    const vehiculoCrudo = String(row['MARCA VEHICULO'] || '').trim().toUpperCase();
    const ubiCruda = String(
      row['UBICACIÓN'] || row['UBICACION'] || '',
    ).trim().toUpperCase();

    return [
      {
        codigo: codigoFinal,
        nombre,
        categoriaNombre: categoria || 'Colisión / Latas',
        marcaRepuesto: marcaCruda ? marcaCruda : 'GENÉRICO',
        marcaVehiculo: vehiculoCrudo ? vehiculoCrudo : 'MULTIMARCA',
        condicion: 'Nuevo',
        origen: 'PROPIO_MACROLATAS',
        ubicacion: ubiCruda ? ubiCruda : 'BODEGA PRINCIPAL',
        costo: costo > 0 ? costo : (precio > 0 ? Math.round(precio * 0.7) : 0),
        precioVenta: precio > 0 ? precio : 0,
        stockActual: stock > 0 ? stock : 1,
        esCodigoAutogenerado: esAutogenerado,
      },
    ];
  }
}
