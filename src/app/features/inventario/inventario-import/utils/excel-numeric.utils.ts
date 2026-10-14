export class ExcelNumericUtils {
  static parse(valor: unknown): number {
    if (!valor) return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;

    let str = String(valor).trim().replace(/\$/g, '').replace(/\s/g, '');
    if (str.includes('.') && !str.includes(',')) {
      str = str.replace(/\./g, '');
    } else if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }
}
