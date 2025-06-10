// src/api/vacunacionApi.js

import apiClient from '../utils/apiClient'; // Verifica que la ruta sea correcta

/**
 * Obtiene todos los registros de vacunación.
 * Incluye los datos del espécimen asociado.
 */
export const getAllVacunaciones = async () => {
  try {
    const response = await apiClient.get('/vacunaciones');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching vacunaciones:", error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener vacunaciones.' };
  }
};

/**
 * Obtiene un registro de vacunación por su ID.
 * Incluye los datos del espécimen asociado.
 * @param {number|string} id El ID del registro de vacunación.
 */
export const getVacunacionById = async (id) => {
  try {
    const response = await apiClient.get(`/vacunaciones/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vacunación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener vacunación por ID.' };
  }
};

/**
 * Crea un nuevo registro de vacunación.
 * @param {object} vacunacionData Datos del registro ({ nombreVacuna, fechaAdministracion, specimenId }).
 */
export const createVacunacion = async (vacunacionData) => {
  try {
    const response = await apiClient.post('/vacunaciones', vacunacionData);
    return response.data;
  } catch (error) {
    console.error("Error creating vacunación:", error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al crear vacunación.' };
  }
};

/**
 * Actualiza un registro de vacunación existente.
 * @param {number|string} id El ID del registro a actualizar.
 * @param {object} vacunacionData Datos a actualizar.
 */
export const updateVacunacion = async (id, vacunacionData) => {
  try {
    const response = await apiClient.put(`/vacunaciones/${id}`, vacunacionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating vacunación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al actualizar vacunación.' };
  }
};

/**
 * Elimina un registro de vacunación por su ID.
 * @param {number|string} id El ID del registro a eliminar.
 */
export const deleteVacunacion = async (id) => {
  try {
    const response = await apiClient.delete(`/vacunaciones/${id}`);
    return response.status === 204 ? { success: true } : response.data;
  } catch (error) {
    console.error(`Error deleting vacunación con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al eliminar vacunación.' };
  }
};

// --- >>> ¡¡FUNCIÓN AÑADIDA!! <<< ---
/**
 * Obtiene todos los registros de vacunación para un espécimen específico.
 * @param {number|string} specimenId - ID del espécimen.
 * @returns {Promise<Array>} Lista de registros de vacunación para ese espécimen.
 */
export const getVacunacionBySpecimenId = async (specimenId) => {
  try {
    // Llama a la ruta GET /api/vacunaciones/by-specimen/:specimenId que deberás crear en el backend
    const response = await apiClient.get(`/vacunaciones/by-specimen/${specimenId}`);
    return Array.isArray(response.data) ? response.data : []; // Devuelve array o vacío
  } catch (error) {
    console.error(`API Error fetching vacunacion for specimen ${specimenId}:`, error.response || error);
    // Lanza un error informativo
    throw error.response?.data || { message: error.message || `Error obteniendo vacunaciones para espécimen ${specimenId}.` };
  }
};