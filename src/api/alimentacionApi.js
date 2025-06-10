// src/api/alimentacionApi.js

import apiClient from '../utils/apiClient'; // Asegúrate que la ruta sea correcta

/**
 * Obtiene todos los registros de alimentación.
 * Incluye los datos del espécimen asociado.
 */
export const getAllAlimentaciones = async () => {
  try {
    const response = await apiClient.get('/alimentaciones');
    // Devuelve un array vacío si la respuesta no es un array por alguna razón
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching alimentaciones:", error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener alimentaciones.' }; // Relanza para manejo en el componente/hook
  }
};

/**
 * Obtiene un registro de alimentación por su ID.
 * Incluye los datos del espécimen asociado.
 * @param {number|string} id El ID del registro de alimentación.
 */
export const getAlimentacionById = async (id) => {
  try {
    const response = await apiClient.get(`/alimentaciones/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching alimentación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener alimentación por ID.' };
  }
};

/**
 * Crea un nuevo registro de alimentación.
 * @param {object} alimentacionData Datos del registro ({ nombreAlimento, cantidad, specimenId }).
 */
export const createAlimentacion = async (alimentacionData) => {
  try {
    const response = await apiClient.post('/alimentaciones', alimentacionData);
    return response.data; // Devuelve el registro recién creado
  } catch (error) {
    console.error("Error creating alimentación:", error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al crear alimentación.' };
  }
};

/**
 * Actualiza un registro de alimentación existente.
 * @param {number|string} id El ID del registro a actualizar.
 * @param {object} alimentacionData Datos a actualizar.
 */
export const updateAlimentacion = async (id, alimentacionData) => {
  try {
    const response = await apiClient.put(`/alimentaciones/${id}`, alimentacionData);
    return response.data; // Devuelve el registro actualizado
  } catch (error) {
    console.error(`Error updating alimentación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al actualizar alimentación.' };
  }
};

/**
 * Elimina un registro de alimentación por su ID.
 * @param {number|string} id El ID del registro a eliminar.
 */
export const deleteAlimentacion = async (id) => {
  try {
    const response = await apiClient.delete(`/alimentaciones/${id}`);
    // Si la API devuelve 204, no hay 'data'. Devolvemos un objeto de éxito.
    return response.status === 204 ? { success: true } : response.data;
  } catch (error) {
    console.error(`Error deleting alimentación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al eliminar alimentación.' };
  }
};

/**
 * Actualiza solo el estado de un registro de alimentación.
 * @param {number|string} id - ID del registro.
 * @param {string} estado - Nuevo estado ('Programado', 'Administrado', 'Cancelado').
 * @returns {Promise<object>} La respuesta de la API (probablemente el registro actualizado).
 */
export const updateAlimentacionEstado = async (id, estado) => {
  try {
    // La ruta debe coincidir con la definida en el backend: PATCH /api/alimentaciones/:id/estado
    const response = await apiClient.patch(`/alimentaciones/${id}/estado`, { estado }); // Enviar { estado: 'nuevoValor' }
    return response.data; // Devuelve el cuerpo de la respuesta
  } catch (error) {
    console.error(`API Error updating alimentacion ${id} state:`, error.response || error);
    // Lanza el error para el componente
    throw error.response?.data || { message: error.message || 'Error desconocido al actualizar estado.' };
  }
};

// --- >>> ¡¡FUNCIÓN AÑADIDA!! <<< ---
/**
 * Obtiene todos los registros de alimentación para un espécimen específico.
 * @param {number|string} specimenId - ID del espécimen.
 * @returns {Promise<Array>} Lista de registros de alimentación para ese espécimen.
 */
export const getAlimentacionBySpecimenId = async (specimenId) => {
  try {
    // Llama a la ruta GET /api/alimentaciones/by-specimen/:specimenId que creaste en el backend
    const response = await apiClient.get(`/alimentaciones/by-specimen/${specimenId}`);
    return Array.isArray(response.data) ? response.data : []; // Devuelve array o vacío
  } catch (error) {
    console.error(`API Error fetching alimentacion for specimen ${specimenId}:`, error.response || error);
    // Lanza un error informativo
    throw error.response?.data || { message: error.message || `Error obteniendo alimentación para espécimen ${specimenId}.` };
  }
};