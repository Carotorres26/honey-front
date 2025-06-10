// src/api/clientApi.js
import apiClient from '../utils/apiClient'; // Asegúrate que la ruta a apiClient sea correcta

// GET /api/clients (Obtener todos)
export const getAllClients = async () => {
  try {
    const response = await apiClient.get('/clients');
    // Asegura devolver siempre un array, como en el ejemplo de services
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    // Solo relanza el error, el interceptor o el llamador se encargarán
    throw error;
  }
};

// GET /api/clients/:id (Obtener uno por ID - Añadido para seguir el patrón)
export const getClientById = async (id) => {
  try {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data; // Devuelve el objeto cliente encontrado
  } catch (error) {
    throw error;
  }
};

// POST /api/clients (Crear)
export const createClient = async (clientData) => {
  try {
    const response = await apiClient.post('/clients', clientData);
    return response.data; // Devuelve el cliente creado (asumiendo que la API lo hace)
  } catch (error) {
    // Quitado console.error específico de aquí
    throw error;
  }
};

// PUT /api/clients/:id (Actualizar)
export const updateClient = async (id, clientData) => {
  try {
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data; // Devuelve el cliente actualizado (asumiendo que la API lo hace)
  } catch (error) {
    // Quitado console.error específico de aquí
    throw error;
  }
};

// DELETE /api/clients/:id (Eliminar)
export const deleteClient = async (id) => {
  try {
    // DELETE no suele devolver contenido, solo confirma éxito/error
    await apiClient.delete(`/clients/${id}`);
    // Devuelve un objeto indicando éxito, igual que en el ejemplo de services
    return { success: true };
  } catch (error) {
    // Quitado console.error específico de aquí
    throw error;
  }
};

// No es necesario exportar alias si los nombres son claros
// export { getAllClients, getClientById, createClient, updateClient, deleteClient };