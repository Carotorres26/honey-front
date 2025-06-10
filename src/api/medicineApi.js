// src/api/medicineApi.js

import apiClient from '../utils/apiClient'; // Verifica que esta ruta sea correcta

/**
 * Obtiene todos los registros de medicinas administradas/programadas.
 * Incluye los datos del espécimen asociado.
 */
export const getAllMedicines = async () => {
  try {
    const response = await apiClient.get('/medicines'); // Endpoint del backend
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching medicines:", error.response || error);
    // Lanza un error más informativo si es posible
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener medicinas.' };
  }
};

/**
 * Obtiene un registro de medicina por su ID.
 * Incluye los datos del espécimen asociado.
 * @param {number|string} id El ID del registro de medicina.
 */
export const getMedicineById = async (id) => {
  try {
    const response = await apiClient.get(`/medicines/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching medicine con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al obtener medicina por ID.' };
  }
};

/**
 * Crea un nuevo registro de medicina.
 * @param {object} medicineData Datos del registro ({ nombre, cantidad, dosis, horaAdministracion, estado?, specimenId }).
 */
export const createMedicine = async (medicineData) => {
  try {
    const response = await apiClient.post('/medicines', medicineData);
    return response.data;
  } catch (error) {
    console.error("Error creating medicine:", error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al crear medicina.' };
  }
};

/**
 * Actualiza un registro de medicina existente.
 * @param {number|string} id El ID del registro a actualizar.
 * @param {object} medicineData Datos a actualizar.
 */
export const updateMedicine = async (id, medicineData) => {
  try {
    const response = await apiClient.put(`/medicines/${id}`, medicineData);
    return response.data;
  } catch (error) {
    console.error(`Error updating medicine con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al actualizar medicina.' };
  }
};

/**
 * Elimina un registro de medicina por su ID.
 * @param {number|string} id El ID del registro a eliminar.
 */
export const deleteMedicine = async (id) => {
  try {
    const response = await apiClient.delete(`/medicines/${id}`);
    // Si la API devuelve 204, no hay 'data'. Devolvemos un objeto de éxito.
    return response.status === 204 ? { success: true } : response.data;
  } catch (error) {
    console.error(`Error deleting medicine con ID ${id}:`, error.response || error);
    throw error.response?.data || { message: error.message || 'Error desconocido al eliminar medicina.' };
  }
};

/**
 * Actualiza solo el estado de una medicina.
 * @param {number|string} id - ID de la medicina.
 * @param {string} estado - Nuevo estado ('Programado', 'Administrado', 'Cancelado').
 * @returns {Promise<object>} La respuesta de la API (probablemente la medicina actualizada).
 */
export const updateMedicineEstado = async (id, estado) => {
  try {
    // La ruta debe coincidir con la definida en el backend: PATCH /api/medicines/:id/estado
    const response = await apiClient.patch(`/medicines/${id}/estado`, { estado }); // Enviar { estado: 'nuevoValor' } en el body
    return response.data; // Devuelve el cuerpo de la respuesta (ej: medicina actualizada)
  } catch (error) {
    console.error(`API Error updating medicine ${id} state:`, error.response || error);
    // Lanza el error para que el componente lo maneje (y muestre la alerta)
    throw error.response?.data || { message: error.message || 'Error desconocido al actualizar estado.' };
  }
};

// --- >>> ¡¡FUNCIÓN AÑADIDA!! <<< ---
/**
 * Obtiene todos los registros de medicinas para un espécimen específico.
 * @param {number|string} specimenId - ID del espécimen.
 * @returns {Promise<Array>} Lista de registros de medicinas para ese espécimen.
 */
export const getMedicineBySpecimenId = async (specimenId) => {
  try {
    // Llama a la ruta GET /api/medicines/by-specimen/:specimenId que creaste en el backend
    const response = await apiClient.get(`/medicines/by-specimen/${specimenId}`);
    return Array.isArray(response.data) ? response.data : []; // Devuelve array o vacío
  } catch (error) {
    console.error(`API Error fetching medicine for specimen ${specimenId}:`, error.response || error);
    // Lanza un error informativo
    throw error.response?.data || { message: error.message || `Error obteniendo medicinas para espécimen ${specimenId}.` };
  }
};