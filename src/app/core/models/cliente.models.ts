/**
 * @fileoverview Modelo de datos para clientes y facturación de MACROLATAS.
 */

export interface Cliente {
  id: number;
  documento: string; // Cédula o NIT
  nombre: string; // Nombre o Razón Social
  telefono?: string;
  correo?: string;
  direccion?: string;
  esFacturaElectronica: boolean;
}

export interface CreateClienteRequest {
  documento: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  esFacturaElectronica?: boolean;
}
