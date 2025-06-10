// src/api/categoryApi.js
import apiClient from '../utils/apiClient'; // Verifica ruta

const internalGetCategories = async (includeInactive = false) => {
  try {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await apiClient.get('/specimen-categories', { params });
    // Asume que la API devuelve las categorías con el campo 'estado'
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error (getAllCategories):", error);
    throw error; // Re-lanza para manejo en página
   }
};

const internalGetCategoryById = async (id) => {
   try {
      const response = await apiClient.get(`/specimen-categories/${id}`);
      return response.data;
   } catch (error) {
      console.error(`API Error (getCategoryById ${id}):`, error);
      throw error;
   }
};

const internalCreateCategory = async (categoryData) => { // Recibe { name: "..." }
   try {
      const dataToSend = { name: categoryData.name?.trim() };
      if (!dataToSend.name || dataToSend.name.length < 3) throw new Error("Nombre inválido.");
      const response = await apiClient.post('/specimen-categories', dataToSend);
      return response.data;
   } catch (error) {
      console.error("API Error (createCategory):", error);
      throw error;
   }
};

// --- CORREGIDO para 'estado' ENUM y usar PUT ---
const internalUpdateCategory = async (id, categoryData) => {
   const operation = `updateCategory ${id}`;
   if (!id || !categoryData || Object.keys(categoryData).length === 0) {
       throw new Error("ID y datos requeridos.");
   }

   const dataToSend = {};
   let isValid = false;

   if (categoryData.hasOwnProperty('name')) {
       const name = categoryData.name?.trim();
       if (typeof name === 'string' && name.length >= 3) {
           dataToSend.name = name;
           isValid = true;
       } else {
           throw new Error("Nombre inválido (mín 3 caracteres).");
       }
   }
   if (categoryData.hasOwnProperty('estado')) { // Busca clave 'estado'
       const estado = categoryData.estado;
       if (estado === 'activo' || estado === 'inactivo') {
           dataToSend.estado = estado; // Envía 'estado' ENUM
           isValid = true;
       } else {
           throw new Error("Estado inválido (activo/inactivo).");
       }
   }

   if (!isValid) throw new Error("Datos inválidos para actualizar.");

   console.log(`[${operation}] Sending PUT data:`, dataToSend);
   try {
       // --- USA PUT ---
       const response = await apiClient.put(`/specimen-categories/${id}`, dataToSend);
       return response.data;
   } catch (error) {
       console.error(`API Error (${operation}):`, error);
       throw error; // Re-lanza para manejo en página
   }
};
// --- FIN CORRECCIÓN ---

const internalDeleteCategory = async (id) => {
    try {
        await apiClient.delete(`/specimen-categories/${id}`);
        return { success: true };
    } catch (error) {
        console.error(`API Error (deleteCategory ${id}):`, error);
        throw error;
    }
};

export const getAllCategories = internalGetCategories;
export const getCategoryById = internalGetCategoryById;
export const createCategory = internalCreateCategory;
export const updateCategory = internalUpdateCategory; // Corregida
export const deleteCategory = internalDeleteCategory;