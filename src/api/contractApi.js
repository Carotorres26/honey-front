// src/api/contractApi.js

import apiClient from '../utils/apiClient'; // Asegúrate que la ruta a apiClient sea correcta

/**
 * Obtiene todos los contratos.
 * @returns {Promise<Array>} Array de objetos de contrato.
 */
export const getAllContracts = async () => {
  try {
    // Usa directamente la ruta relativa en apiClient.get
    const response = await apiClient.get('/contracts');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene un contrato específico por su ID.
 * @param {number|string} id ID del contrato.
 * @returns {Promise<object|null>} Objeto del contrato o podría lanzar error 404.
 */
export const getContractById = async (id) => {
  try {
    // Usa directamente la ruta relativa con el ID
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crea un nuevo contrato.
 * @param {object} contractData Datos del nuevo contrato.
 * @returns {Promise<object>} El contrato creado.
 */
export const createContract = async (contractData) => {
  try {
    // Usa directamente la ruta relativa
    const response = await apiClient.post('/contracts', contractData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza un contrato existente.
 * @param {number|string} id ID del contrato a actualizar.
 * @param {object} contractData Datos actualizados del contrato.
 * @returns {Promise<object>} El contrato actualizado.
 */
export const updateContract = async (id, contractData) => {
  try {
    // Usa directamente la ruta relativa con el ID
    const response = await apiClient.put(`/contracts/${id}`, contractData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Elimina un contrato por su ID.
 * @param {number|string} id ID del contrato a eliminar.
 * @returns {Promise<{success: boolean}>} Objeto indicando éxito.
 */
export const deleteContract = async (id) => {
  try {
    // Usa directamente la ruta relativa con el ID
    await apiClient.delete(`/contracts/${id}`);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// No se necesita exportación por defecto.