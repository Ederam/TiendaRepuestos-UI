/**
 * @fileoverview Contratos de datos (DTOs) para el módulo de Autenticación y Sesión.
 */

import { RolUsuario } from '../constants/roles.constants';

/**
 * Payload requerido para iniciar sesión en POST /api/Auth/login.
 */
export interface LoginRequest {
  /** Correo corporativo del usuario registrado */
  email: string;
  /** Contraseña en texto plano para validación contra ASP.NET Core Identity */
  password: string;
}

/**
 * Respuesta emitida por el backend tras un inicio de sesión exitoso.
 */
export interface LoginResponse {
  /** Token JWT firmado con algoritmo HMAC-SHA256 */
  token: string;
  /** Correo del usuario autenticado */
  email: string;
  /** Rol asignado que rige los permisos del usuario en la SPA */
  rol: RolUsuario;
  /** Nombre completo del operador para presentación en interfaz */
  nombreCompleto: string;
}

/**
 * Estado mínimo de sesión conservado en memoria y almacenamiento local.
 * Excluye credenciales sensibles y almacena únicamente claims de presentación.
 */
export interface UserSession {
  /** Correo del usuario activo */
  email: string;
  /** Rol asignado */
  rol: RolUsuario;
  /** Nombre completo del usuario */
  nombreCompleto: string;
}
