/**
 * @fileoverview Modelo de errores estándar según la especificación RFC 7807 (Problem Details).
 * Utilizado por el backend .NET 8 para respuestas HTTP 4xx y 5xx con detalle estructurado.
 */

/**
 * Representa la estructura de respuesta de error emitida por la API de .NET 8.
 */
export interface ProblemDetails {
  /** URI de referencia que identifica el tipo de problema */
  type?: string;
  /** Resumen corto y legible por humanos del problema */
  title: string;
  /** Código de estado HTTP retornado por el servidor */
  status: number;
  /** Explicación detallada específica de esta ocurrencia del problema */
  detail?: string;
  /** URI que identifica la solicitud o recurso específico que generó el error */
  instance?: string;
  /** Diccionario de errores de validación de FluentValidation (campo -> arreglo de mensajes) */
  errors?: Record<string, string[]>;
  /** Propiedades adicionales dinámicas retornadas por el backend */
  [key: string]: unknown;
}
