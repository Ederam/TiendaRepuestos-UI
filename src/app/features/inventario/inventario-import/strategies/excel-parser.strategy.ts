import * as XLSX from 'xlsx';
import { CargaMasivaItemRequest } from '@core/models/producto.models';

export interface ExcelParserStrategy {
  parse(workbook: XLSX.WorkBook): CargaMasivaItemRequest[];
}
