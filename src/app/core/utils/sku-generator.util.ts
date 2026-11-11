/**
 * @fileoverview Utilidad de dominio para la deducción y sugerencia de códigos SKU
 * internos según la libreta física y nomenclatura operativa de MACROLATAS.
 */

/**
 * Tabla base de prefijos por familia de autoparte.
 */
export const PREFIJOS_TIPO_REPUESTO: Record<string, string> = {
  FAROLA: 'F',
  FAROLAS: 'F',
  STOP: 'ST',
  STOPS: 'ST',
  DIRECCIONAL: 'D',
  DIRECCIONALES: 'D',
  CAPOT: 'CAP',
  BUMPER: 'BMP',
  BOMPER: 'BMP',
  PERSIANA: 'PER',
  GUARDABARRO: 'GB',
  ESPEJO: 'ESP',
};

/**
 * Diccionario de colisión de MACROLATAS para importación masiva y códigos compactos:
 * (FAROLA -> F, STOP -> S, BOMPER -> B, CAPOT -> C, DIRECCIONAL -> D, PERSIANA -> P).
 */
export const DICCIONARIO_COLISION_SKU: Record<string, string> = {
  FAROLA: 'F',
  FAROLAS: 'F',
  STOP: 'S',
  STOPS: 'S',
  BOMPER: 'B',
  BOMPERES: 'B',
  BUMPER: 'B',
  BUMPERS: 'B',
  CAPOT: 'C',
  CAPOTS: 'C',
  DIRECCIONAL: 'D',
  DIRECCIONALES: 'D',
  PERSIANA: 'P',
  PERSIANAS: 'P',
  ESPEJO: 'ESP',
  ESPEJOS: 'ESP',
  GUARDABARRO: 'GB',
  GUARDABARROS: 'GB',
};

/**
 * Tabla de códigos numéricos por marca automotriz según la libreta física de Macrolatas.
 */
export const CODIGOS_MARCA_VEHICULO: Record<string, string> = {
  RENAULT: '101',
  CITROEN: '115',
  CHEROKEE: '111',
  SKODA: '150',
  FORD: '151',
  HYUNDAI: '200',
  HONDA: '201',
  CHEVROLET: '222',
  FIAT: '250',
  MAZDA: '301',
  CHINAS: '302',
  CHINA: '302',
  NISSAN: '305',
  DAEWOO: '300',
  KIA: '333',
  MITSUBISHI: '400',
  PEUGEOT: '500',
  VOLKSWAGEN: '550',
  TOYOTA: '555',
  DODGE: '600',
  SUBARU: '650',
  SUZUKI: '700',
};

/**
 * Genera una sugerencia de código SKU basada en el texto del nombre.
 * Formato: [TIPO]-[MARCA][LADO]-[CONSECUTIVO] (Ej: F-222-LH-105)
 *
 * @param descripcionTexto Nombre o descripción ingresada por el usuario.
 * @param consecutivo Número secuencial opcional. Si no se provee, genera uno aleatorio.
 * @returns Código SKU propuesto.
 */
export function generarCodigoSugerido(
  descripcionTexto: string,
  consecutivo?: number,
): string {
  if (!descripcionTexto || descripcionTexto.trim().length < 3) {
    return '';
  }

  const texto: string = descripcionTexto.toUpperCase().trim();

  // 1. Detectar Familia / Tipo
  let tipo: string = 'REP';
  for (const [clave, prefijo] of Object.entries(PREFIJOS_TIPO_REPUESTO)) {
    if (texto.includes(clave)) {
      tipo = prefijo;
      break;
    }
  }

  // 2. Detectar Marca Automotriz
  let codigoMarca: string = '999';
  for (const [marca, codigo] of Object.entries(CODIGOS_MARCA_VEHICULO)) {
    if (texto.includes(marca)) {
      codigoMarca = codigo;
      break;
    }
  }

  // 3. Detectar Posición / Lado
  let lado: string = '';
  if (
    texto.includes(' LH') ||
    texto.includes(' IZQ') ||
    texto.includes('-LH')
  ) {
    lado = '-LH';
  } else if (
    texto.includes(' RH') ||
    texto.includes(' DER') ||
    texto.includes('-RH')
  ) {
    lado = '-RH';
  }

  const secuencia: string = consecutivo
    ? consecutivo.toString().padStart(3, '0')
    : Math.floor(100 + Math.random() * 900).toString();

  return `${tipo}-${codigoMarca}${lado}-${secuencia}`;
}

/**
 * Autogenera un código SKU híbrido para importación masiva de Excel cuando la celda de código viene vacía.
 * Aplica el diccionario de colisión (FAROLA -> F, STOP -> S, BOMPER -> B, CAPOT -> C, DIRECCIONAL -> D, PERSIANA -> P)
 * + terminación de lado (LH / RH) + secuencia numérica única.
 *
 * @param descripcionTexto Nombre o descripción del repuesto.
 * @param secuencia Consecutivo incremental para garantizar unicidad.
 * @returns Código SKU estandarizado (Ej: F-LH-0001, S-RH-0002, B-0003).
 */
export function generarSkuAutogeneradoExcel(
  descripcionTexto: string,
  secuencia: number,
): string {
  if (!descripcionTexto || descripcionTexto.trim().length === 0) {
    return `REP-${secuencia.toString().padStart(4, '0')}`;
  }

  const texto: string = descripcionTexto.toUpperCase().trim();

  // 1. Detectar Tipo mediante Diccionario de Colisión
  let prefijo: string = 'REP';
  for (const [clave, codigo] of Object.entries(DICCIONARIO_COLISION_SKU)) {
    if (texto.includes(clave)) {
      prefijo = codigo;
      break;
    }
  }

  // 2. Detectar Terminación de Lado (LH / RH)
  let lado: string = '';
  if (
    texto.includes(' LH') ||
    texto.includes(' IZQ') ||
    texto.includes('-LH') ||
    texto.includes('IZQUIERD')
  ) {
    lado = 'LH';
  } else if (
    texto.includes(' RH') ||
    texto.includes(' DER') ||
    texto.includes('-RH') ||
    texto.includes('DERECH')
  ) {
    lado = 'RH';
  }

  const secPadded: string = secuencia.toString().padStart(4, '0');
  return lado ? `${prefijo}-${lado}-${secPadded}` : `${prefijo}-${secPadded}`;
}

/**
 * Identifica si el repuesto corresponde al lado Izquierdo (LH) o Derecho (RH)
 * retornando la etiqueta visual y su clase CSS distintiva.
 */
export function obtenerPosicionLado(
  nombre: string,
): { texto: string; clase: string } | null {
  if (!nombre) return null;
  const u = nombre.toUpperCase();
  if (u.includes(' LH') || u.includes('-LH') || u.includes(' IZQ')) {
    return { texto: 'IZQ (LH)', clase: 'badge-side-lh' };
  }
  if (u.includes(' RH') || u.includes('-RH') || u.includes(' DER')) {
    return { texto: 'DER (RH)', clase: 'badge-side-rh' };
  }
  return null;
}
