import axios from "axios";

// Asegúrate que estas variables de entorno estén definidas en tu .env
// const API_AUTH_URL = import.meta.env.VITE_API_AUTH_URL || "http://localhost:3000/api/auth";
// const API_USERS_URL = import.meta.env.VITE_API_USERS_URL || "http://localhost:3000/api/users";
const API_AUTH_URL = import.meta.env.VITE_API_AUTH_URL || "https://backhoney.onrender.com/api/auth";
const API_USERS_URL = import.meta.env.VITE_API_USERS_URL || "https://backhoney.onrender.com/api/users";

const apiClient = axios.create({
  // Podrías configurar baseURL aquí si todas tus rutas empiezan igual,
  // pero ya lo manejas bien con las constantes.
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // No añadir token a login/register
      const isLoginOrRegister = config.url?.startsWith(API_AUTH_URL) && 
                                (config.url?.includes('/login') || config.url?.includes('/register'));
      if (!isLoginOrRegister) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // Intenta obtener el mensaje del backend, específicamente del campo `msg` si es un error de validación
    // o del campo `message` para errores más generales.
    const backendErrorData = error.response?.data;
    let apiMessage = "";

    if (backendErrorData) {
      if (backendErrorData.errors && Array.isArray(backendErrorData.errors) && backendErrorData.errors.length > 0) {
        // Para errores de validación (como el de contraseña)
        apiMessage = backendErrorData.errors.map(err => err.msg).join(' ');
      } else if (backendErrorData.message) {
        // Para errores generales con un campo "message"
        apiMessage = backendErrorData.message;
      }
    }
    
    const genericMessage = error.message || "Error desconocido";
    // Usar el mensaje específico de la API si existe, sino el genérico de Axios.
    const finalErrorMessage = apiMessage || genericMessage;

    console.error(
        `API Error (${status || 'Network'} on ${error.config?.method?.toUpperCase()} ${error.config?.url}):`,
        finalErrorMessage,
        error.response?.data // Loguea toda la data de la respuesta para debug
    );

    if ((status === 401 || status === 403) && !error.config?.url?.includes('/login')) {
       console.warn("Unauthorized/Forbidden access. Clearing token and redirecting to login.");
       localStorage.removeItem('authToken');
       // Evita bucles de redirección si ya está en login/register
       if (!['/login', '/register'].includes(window.location.pathname)) {
          window.location.href = '/login?sessionExpired=true';
       }
    }
    // Rechazar con un nuevo Error que contenga el mensaje procesado,
    // para que los componentes puedan usar err.message directamente.
    return Promise.reject(new Error(finalErrorMessage));
  }
);

export const loginUserApi = async (credentials) => {
  try {
    const response = await apiClient.post(`${API_AUTH_URL}/login`, credentials);
    if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error; // Ya es un Error con el mensaje procesado por el interceptor
  }
};

export const registerUserApi = async (userData) => {
  try {
    const response = await apiClient.post(`${API_AUTH_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUserApi = async () => {
  try {
    const response = await apiClient.get(`${API_AUTH_URL}/currentuser`);
    return response.data; // Asume que esto devuelve el objeto usuario directamente o { user: ... }
  } catch (error) {
    throw error;
  }
};

export const updateCurrentUserApi = async (userData) => {
  try {
    // El backend debería devolver el usuario actualizado, idealmente en un campo "user"
    const response = await apiClient.put(`${API_AUTH_URL}/updateUser`, userData);
    return response.data; // { message: "...", user: { ... } }
  } catch (error) {
    throw error;
  }
};

export const logoutApi = async () => {
  try {
    const response = await apiClient.post(`${API_AUTH_URL}/logout`); // Endpoint opcional
    localStorage.removeItem('authToken');
    return response.data;
  } catch (error) {
    localStorage.removeItem('authToken'); // Asegurar limpieza incluso si la API falla
    console.error("Logout API call failed, but token cleared locally.", error);
    // No relanzar el error necesariamente, el logout local es lo más importante
    // throw error; 
    return { message: "Sesión cerrada localmente." }; // O un objeto de éxito genérico
  }
};

export const changePasswordApi = async (passwordData) => {
  try {
    // passwordData debe ser { currentPassword, newPassword, confirmPassword }
    const response = await apiClient.post(`${API_AUTH_URL}/change-password`, passwordData);
    return response.data; // { message: "Contraseña actualizada" }
  } catch (error) {
    throw error;
  }
};

// Funciones para /api/users (administración, si aplica)
export const getAllUsersApi = async () => {
  try {
    const response = await apiClient.get(API_USERS_URL);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

export const getUserByIdApi = async (id) => {
    try {
      const response = await apiClient.get(`${API_USERS_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
};

export const updateUserApi = async (id, userData) => {
  try {
    const response = await apiClient.put(`${API_USERS_URL}/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUserApi = async (id) => {
  try {
    await apiClient.delete(`${API_USERS_URL}/${id}`);
    return { success: true, message: 'Usuario eliminado exitosamente.' };
  } catch (error) {
    throw error;
  }
};

export const toggleUserStatusApi = async (userId) => {
  try {
    const response = await apiClient.patch(`${API_USERS_URL}/${userId}/status`);
    // Preferiblemente el backend devuelve el usuario actualizado
    return response.data.user || response.data;
  } catch (error) {
    throw error;
  }
};

// Exportaciones alias (ya las tenías, están bien)
export const obtenerUsuarios = getAllUsersApi;
export const crearUsuario = registerUserApi; // Nota: registerUserApi es para auto-registro, no creación por admin usualmente
export const actualizarUsuario = updateUserApi; // Para actualizar CUALQUIER usuario por ID (admin)
export const eliminarUsuario = deleteUserApi;
export const loginUsuario = loginUserApi;
export const obtenerUsuarioPorId = getUserByIdApi;
export const obtenerUsuarioActual = getCurrentUserApi;
export const actualizarUsuarioActual = updateCurrentUserApi; // Para que el usuario actualice SU PROPIO perfil
export const cerrarSesion = logoutApi;
export const cambiarContraseñaActual = changePasswordApi; // Para que el usuario actual cambie SU PROPIA contraseña