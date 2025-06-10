// src/api/dashboardApi.js
import apiClient from '../utils/apiClient'; // Asegúrate que la ruta a tu apiClient sea correcta

/**
 * Obtiene el número total de ejemplares.
 * Llama a GET /api/dashboard/total-ejemplares
 * @returns {Promise<{ totalEjemplares: number }>}
 */
export const getTotalEjemplaresApi = async () => {
  try {
    const response = await apiClient.get('/dashboard/total-ejemplares');
    return response.data; // Se espera un objeto como { totalEjemplares: 150 }
  } catch (error) {
    console.error("Error en dashboardApi.getTotalEjemplaresApi:", error.response?.data?.message || error.message);
    throw error; // Relanzar para que el componente que llama pueda manejarlo
  }
};

/**
 * Obtiene los contratos nuevos creados por mes para un año específico.
 * Llama a GET /api/dashboard/contratos-nuevos-mensuales?anio=YYYY
 * @param {number} anio - El año para el cual se quieren los datos.
 * @returns {Promise<Array<{ mes: number, nombreMes: string, cantidadNuevos: number }>>}
 */
export const getContratosNuevosPorMesApi = async (anio) => {
  try {
    const response = await apiClient.get('/dashboard/contratos-nuevos-mensuales', {
      params: { anio } // Esto añadirá ?anio=YYYY a la URL
    });
    // El backend ya devuelve un array formateado con 12 meses.
    return response.data;
  } catch (error) {
    console.error("Error en dashboardApi.getContratosNuevosPorMesApi:", error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Obtiene la distribución actual de ejemplares por sede.
 * Llama a GET /api/dashboard/distribucion-ejemplares-sede
 * @returns {Promise<Array<{ nombreSede: string, cantidadEjemplares: number }>>}
 */
export const getDistribucionEjemplaresPorSedeApi = async () => {
  try {
    const response = await apiClient.get('/dashboard/distribucion-ejemplares-sede');
    return response.data; // Se espera un array de objetos
  } catch (error) {
    console.error("Error en dashboardApi.getDistribucionEjemplaresPorSedeApi:", error.response?.data?.message || error.message);
    throw error;
  }
};