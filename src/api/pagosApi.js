// src/api/pagosApi.js
import apiClient from '../utils/apiClient'; // Ajusta la ruta si es necesario

/**
 * Obtiene todos los pagos.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de pagos.
 */
export const obtenerPagos = async () => {
  const path = '/pagos';
  try {
    console.log(`[pagosApi] GET ${path}`);
    const response = await apiClient.get(path);
    // Es buena práctica asegurar que siempre devuelves un array.
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error específico en pagosApi.obtenerPagos (GET ${path}):`, error.message);
    // Considera si quieres loguear error.response?.data aquí también para más detalles.
    throw error; // Relanzar para que el componente lo maneje
  }
};

/**
 * Obtiene un pago específico por su ID.
 * @param {string|number} id - El ID del pago a obtener.
 * @returns {Promise<object>} Una promesa que resuelve al objeto del pago.
 */
export const obtenerPagoPorId = async (id) => {
    const path = `/pagos/${id}`;
    try {
        console.log(`[pagosApi] GET ${path}`);
        const response = await apiClient.get(path);
        return response.data; // El backend debe devolver el objeto pago completo
    } catch (error) {
        console.error(`Error específico en pagosApi.obtenerPagoPorId (GET ${path}):`, error.message);
        throw error;
    }
};

/**
 * Obtiene todos los pagos asociados a un ID de contrato.
 * @param {string|number} contractId - El ID del contrato.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de pagos para ese contrato.
 */
export const obtenerPagosPorContrato = async (contractId) => {
    const path = `/pagos/contract/${contractId}`;
    try {
        console.log(`[pagosApi] GET ${path}`);
        const response = await apiClient.get(path);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error(`Error específico en pagosApi.obtenerPagosPorContrato (GET ${path}):`, error.message);
        throw error;
    }
};

/**
 * Guarda un nuevo pago (POST) o actualiza uno existente (PUT).
 * El componente que llama (Pagos.jsx) es responsable de construir `pagoData` correctamente.
 * @param {object} pagoData - Los datos del pago.
 *   Para crear (POST /pagos): { contractId, mesPago, valor, metodoPago, ...otrosCampos }
 *   Para actualizar (PUT /pagos/:id_pago): { id_pago, mesPago, valor, metodoPago, ...otrosCamposModificables }
 */
export const guardarPago = async (pagoData) => {
  // Extrae id_pago si existe. El resto de las propiedades forman el cuerpo de la solicitud.
  const { id_pago, ...dataForBody } = pagoData;

  const isUpdating = !!id_pago; // True si id_pago tiene un valor truthy (indica actualización)
  const path = isUpdating ? `/pagos/${id_pago}` : '/pagos';
  const method = isUpdating ? 'put' : 'post';

  try {
    // Loguear la información de la solicitud para depuración. Usar JSON.stringify para ver el objeto claramente.
    console.log(`[pagosApi] ${method.toUpperCase()} ${path} con body:`, JSON.stringify(dataForBody, null, 2));
    
    const response = await apiClient[method](path, dataForBody);
    return response.data; // Usualmente, la API devuelve el objeto creado/actualizado o un mensaje de éxito.
  } catch (error) {
    // El interceptor de apiClient ya debería loguear detalles del error (status, etc.).
    // Aquí logueamos un mensaje específico de esta función y la respuesta si existe.
    console.error(`Error específico en pagosApi.guardarPago (${method.toUpperCase()} ${path}):`, error.message);
    if (error.response && error.response.data) {
        // Este log es muy útil para ver los errores de validación del backend.
        console.error('[pagosApi] Respuesta de error del servidor:', JSON.stringify(error.response.data, null, 2));
    }
    throw error; // Relanzar para que el componente que llamó pueda manejarlo (ej. mostrar UI de error)
  }
};

// Agrupar todas las funciones exportadas en un objeto para el export default.
// Esto es convencional si se importa con `import pagosApi from '...'`.
const pagosApiService = {
    obtenerPagos,
    obtenerPagosPorContrato,
    obtenerPagoPorId,
    guardarPago
};

export default pagosApiService;