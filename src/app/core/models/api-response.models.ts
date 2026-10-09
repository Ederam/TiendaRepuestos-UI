/**
 * @fileoverview Contratos genéricos para respuestas paginadas y filtrado de datos.
 */

/**
 * Envoltorio para resultados paginados devueltos por el backend .NET 8.
 * @template T Tipo de los elementos contenidos en la lista paginada.
 */
export interface PagedResponse<T> {
  /** Arreglo de elementos pertenecientes a la página actual */
  items: T[];
  /** Índice de la página solicitada (1-based) */
  pageNumber: number;
  /** Cantidad máxima de registros por página */
  pageSize: number;
  /** Cantidad total de registros existentes en la base de datos */
  totalCount: number;
  /** Cantidad total de páginas calculadas */
  totalPages: number;
  /** Indica si existe una página anterior */
  hasPreviousPage: boolean;
  /** Indica si existe una página siguiente */
  hasNextPage: boolean;
}

/**
 * Parámetros de consulta para el listado paginado de productos.
 */
export interface ProductoFilterParams {
  /** Término de búsqueda por nombre o código del producto */
  busqueda?: string;
  /** Identificador de categoría para filtrado opcional */
  categoriaId?: number | null;
  /** Filtro de estado: true para activos, false para inactivos o ambos si no se define */
  soloActivos?: boolean;
  /** Número de página actual */
  pageNumber?: number;
  /** Tamaño de página */
  pageSize?: number;
}
