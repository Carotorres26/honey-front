// src/api/authApiService.js (Asumiendo que este es el nombre y ruta correctos)
import apiClient from '../utils/apiClient'; // Tu cliente Axios configurado

const API_URL = '/auth'; // Ruta base para los endpoints de autenticación de este servicio,
                         // relativa a la baseURL de apiClient.

/**
 * Solicita un correo de restablecimiento de contraseña.
 * @param {object} credentials - Un objeto que contiene username y email. Ejemplo: { username: "...", email: "..." }
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const requestPasswordResetAPI = (credentials) => {
    return apiClient.post(`${API_URL}/forgot-password`, credentials); // <--- CORREGIDO a API_URL
};

/**
 * Verifica la validez de un token de restablecimiento.
 * @param {string} token - El token de restablecimiento.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const verifyResetTokenAPI = (token) => {
    return apiClient.get(`${API_URL}/verify-reset-token/${token}`);
};

/**
 * Restablece la contraseña del usuario utilizando el token y la nueva contraseña.
 * @param {string} token - El token de restablecimiento.
 * @param {string} newPassword - La nueva contraseña.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const resetPasswordAPI = (token, newPassword) => {
    return apiClient.post(`${API_URL}/reset-password/${token}`, { newPassword });
};