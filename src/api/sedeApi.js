// src/api/sedeApi.js
import apiClient from '../utils/apiClient';

// --- Funciones API para Sedes ---

/**
 * Obtiene todas las Sedes.
 * Llama a GET /sedes (Ajusta si tu base API es diferente, ej. /api/sedes)
 */
export const getAllSedes = async () => {
  try {
    const response = await apiClient.get('/sedes');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error en sedeApi.getAllSedes:", error.message);
    throw error;
  }
};

/**
 * Obtiene una Sede por su ID.
 * Llama a GET /sedes/:id
 * @param {string|number} id - ID de la sede.
 */
export const getSedeById = async (id) => {
  try {
    const response = await apiClient.get(`/sedes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error en sedeApi.getSedeById (ID: ${id}):`, error.message);
    throw error;
  }
};

/**
 * Crea una nueva Sede.
 * Llama a POST /sedes
 * @param {object} sedeData - Objeto con los datos de la sede (ej. { NombreSede: '...' }).
 */
export const createSede = async (sedeData) => {
  try {
    const response = await apiClient.post('/sedes', sedeData);
    return response.data;
  } catch (error) {
    console.error("Error en sedeApi.createSede:", error.message);
    throw error;
  }
};

/**
 * Actualiza una Sede existente.
 * Llama a PUT /sedes/:id
 * @param {string|number} id - ID de la sede a actualizar.
 * @param {object} sedeData - Objeto con los datos a actualizar.
 */
export const updateSede = async (id, sedeData) => {
  try {
    const response = await apiClient.put(`/sedes/${id}`, sedeData);
    return response.data;
  } catch (error) {
    console.error(`Error en sedeApi.updateSede (ID: ${id}):`, error.message);
    throw error;
  }
};

/**
 * Elimina una Sede por su ID.
 * Llama a DELETE /sedes/:id
 * @param {string|number} id - ID de la sede a eliminar.
 */
export const deleteSede = async (id) => {
  try {
    await apiClient.delete(`/sedes/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error en sedeApi.deleteSede (ID: ${id}):`, error.message);
    throw error;
  }
};

// --- Funciones API para Ejemplares (relacionadas con Sedes) ---

/**
 * Obtiene todos los Ejemplares de una Sede específica.
 * Llama a GET /ejemplares?sedeId={id}
 * ❗ IMPORTANTE: Requiere que el backend sea modificado para soportar el filtrado por `sedeId`.
 * (Ajusta '/ejemplares' si tu ruta base para ejemplares es diferente)
 * @param {string|number} sedeId - ID de la sede.
 */
export const getEjemplaresBySedeId = async (sedeId) => {
  if (!sedeId) {
    console.warn("getEjemplaresBySedeId llamado sin sedeId");
    return [];
  }
  try {

    const response = await apiClient.get(`/specimens?sedeId=${sedeId}`); // <--- Solo /specimens

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error en sedeApi.getEjemplaresBySedeId (Sede ID: ${sedeId}):`, error.message);
    throw error;
  }
};