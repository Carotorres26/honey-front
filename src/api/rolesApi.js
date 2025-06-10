import apiClient from '../utils/apiClient';

export const getRoles = async (includeInactive = false) => {
  try {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await apiClient.get('/roles', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await apiClient.post('/roles', roleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    await apiClient.delete(`/roles/${id}`);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const toggleRoleStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/roles/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};