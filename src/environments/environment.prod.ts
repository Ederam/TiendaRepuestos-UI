/**
 * @fileoverview Configuración para despliegue en producción en la nube (Vercel).
 * useMocks: true asegura que la SPA funcione autónomamente sin llamadas fallidas a localhost.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  useMocks: true,
};
