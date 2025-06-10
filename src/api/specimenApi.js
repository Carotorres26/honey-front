// src/api/specimenApi.js
import apiClient from '../utils/apiClient';

export const getAllSpecimens = async (params = {}) => {
  try {
    const response = await apiClient.get('/specimens', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error en specimenApi.getAllSpecimens con params:", params, error.response?.data?.message || error.message);
    throw error;
  }
};

export const getSpecimenById = async (id) => {
  try {
    const response = await apiClient.get(`/specimens/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error en specimenApi.getSpecimenById (ID: ${id}):`, error.response?.data?.message || error.message);
    throw error;
  }
};

export const addSpecimen = async (specimenData) => {
  try {
    const response = await apiClient.post('/specimens', specimenData);
    return response.data;
  } catch (error) {
    console.error("Error en specimenApi.addSpecimen:", error.response?.data?.message || error.message, error.response);
    throw error;
  }
};

export const updateSpecimen = async (id, specimenData) => {
  try {
    const response = await apiClient.put(`/specimens/${id}`, specimenData);
    return response.data;
  } catch (error) {
    console.error(`Error en specimenApi.updateSpecimen (ID: ${id}):`, error.response?.data?.message || error.message, error.response);
    throw error;
  }
};

export const deleteSpecimen = async (id) => {
  try {
    await apiClient.delete(`/specimens/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error en specimenApi.deleteSpecimen (ID: ${id}):`, error.response?.data?.message || error.message);
    throw error;
  }
};

export const moveSpecimen = async (specimenId, dataToMove) => {
  try {
    const response = await apiClient.patch(`/specimens/${specimenId}/move`, dataToMove);
    return response.data;
  } catch (error) {
    console.error(`[specimenApi MOVE] Error (ID: ${specimenId}):`, error.response?.data?.message || error.message, error.response);
    throw error;
  }
};

export const searchSpecimensByName = async (nameQuery) => {
  if (!nameQuery || String(nameQuery).trim() === '') {
    return [];
  }
  try {
    // Asume que getAllSpecimens y tu backend pueden manejar el parámetro 'name' para filtrar
    const specimens = await getAllSpecimens({ name: nameQuery });
    return specimens;
  } catch (error) {
    console.error(`Error en specimenApi.searchSpecimensByName (query: ${nameQuery}):`, error.response?.data?.message || error.message);
    throw error;
  }
};

// Ajusta esta exportación según los alias que realmente uses en tu proyecto.
// Si solo usas `addSpecimen` con el alias `createSpecimenApi`, esto está bien.
// Si usas otros alias, añádelos aquí o considera no usar alias si no es necesario.
export { addSpecimen as createSpecimenApi };