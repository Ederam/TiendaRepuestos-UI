import * as XLSX from 'xlsx';
import { CargaMasivaItemRequest } from '@core/models/producto.models';
import { ExcelParserStrategy } from './excel-parser.strategy';
import { ExcelNumericUtils } from '../utils/excel-numeric.utils';
import { generarSkuAutogeneradoExcel } from '@core/utils/sku-generator.util';

/**
 * Estrategia de procesamiento para planillas del aliado EUROCAR.
 * Soporta deduplicación de códigos y autogeneración asistida de SKU en celdas vacías.
 */
export class EurocarParserStrategy implements ExcelParserStrategy {
  private readonly codigosRegistrados: Set<string> = new Set<string>();
  private contadorSecuencia: number = 1;

  constructor(private readonly esSegunda: boolean = false) {}

  parse(workbook: XLSX.WorkBook): CargaMasivaItemRequest[] {
    this.codigosRegistrados.clear();
    this.contadorSecuencia = 1;

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    });
    return rows.flatMap((row) => this.mapearFila(row));
  }

  private mapearFila(row: any): CargaMasivaItemRequest[] {
    const nombre = String(
      row['Descripción'] || row['DESCRIPCION'] || '',
    ).trim();
    if (!nombre) return [];

    const codigoRaw = String(
      row['Codigo_Producto'] || row['REFERENCIA'] || '',
    ).trim();

    let codigoFinal: string = '';
    let esAutogenerado: boolean = false;

    if (codigoRaw) {
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
      let sku = generarSkuAutogeneradoExcel(nombre, this.contadorSecuencia++);
      while (this.codigosRegistrados.has(sku)) {
        sku = generarSkuAutogeneradoExcel(nombre, this.contadorSecuencia++);
      }
      codigoFinal = sku;
      this.codigosRegistrados.add(codigoFinal);
      esAutogenerado = true;
    }

    // Priorizamos los datos de la columna aliada EUROCAR si están presentes
    const precioEuro = ExcelNumericUtils.parse(row['PRECIO EURO']);
    const precioBase = ExcelNumericUtils.parse(row['Precio2']);
    const precioVenta = precioEuro > 0 ? precioEuro : (precioBase > 0 ? precioBase : 0);

    const cantEuro = ExcelNumericUtils.parse(row['CANT EURO']);
    const cantBase = ExcelNumericUtils.parse(row['Cant']);
    const stockActual = cantEuro > 0 ? cantEuro : (cantBase > 0 ? cantBase : 1);

    const ubicacionCruda = String(
      row['UBI EURO'] || row['Personalizado14'] || '',
    ).trim().toUpperCase();

    return [
      {
        codigo: codigoFinal,
        nombre,
        categoriaNombre: 'Colisión / Latas',
        marcaRepuesto: this.extraerMarca(nombre),
        marcaVehiculo: this.extraerVehiculo(nombre),
        condicion: this.esSegunda ? 'Segunda' : 'Nuevo',
        origen: 'ALIADO_EUROCAR',
        ubicacion: ubicacionCruda ? ubicacionCruda : 'BODEGA EUROCAR',
        costo: precioVenta > 0 ? Math.round(precioVenta * 0.8) : 0,
        precioVenta,
        stockActual,
        esCodigoAutogenerado: esAutogenerado,
      },
    ];
  }

  private extraerMarca(descripcion: string): string {
    const desc = descripcion.toUpperCase();
    if (desc.includes('TYC')) return 'TYC';
    if (desc.includes('DEPO')) return 'DEPO';
    if (desc.includes('TAIWAN')) return 'TAIWÁN';
    if (desc.includes('FITAM')) return 'FITAM';
    return 'GENÉRICO';
  }

  private extraerVehiculo(descripcion: string): string {
    const desc = descripcion.toUpperCase();
    if (desc.includes('AUDI')) return 'AUDI';
    if (desc.includes('RENAULT')) return 'RENAULT';
    if (desc.includes('CHEVROLET')) return 'CHEVROLET';
    if (desc.includes('MAZDA')) return 'MAZDA';
    if (desc.includes('NISSAN')) return 'NISSAN';
    if (desc.includes('TOYOTA')) return 'TOYOTA';
    if (desc.includes('FORD')) return 'FORD';
    if (desc.includes('HYUNDAI')) return 'HYUNDAI';
    if (desc.includes('KIA')) return 'KIA';
    return 'MULTIMARCA';
  }
}
