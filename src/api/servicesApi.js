import apiClient from '../utils/apiClient';

export const getAllServices = async (includeInactive = false) => {
  try {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await apiClient.get('/services', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

export const getServiceById = async (id) => {
  try {
    const response = await apiClient.get(`/services/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createService = async (formData) => {
  try {
    const response = await apiClient.post('/services', formData);
    return response.data;
  } catch (error) {
    console.error("Catch final en createService:", error.message);
    throw error;
  }
};

export const updateService = async (id, formData) => {
  try {
    const response = await apiClient.put(`/services/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Catch final en updateService:", error.message);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    await apiClient.delete(`/services/${id}`);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const toggleServiceStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/services/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};