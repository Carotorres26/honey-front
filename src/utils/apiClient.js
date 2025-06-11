// src/utils/apiClient.js
import axios from "axios";

const SERVER_BASE_URL = "https://backhoney.onrender.com";

const apiClient = axios.create({
  baseURL: `${SERVER_BASE_URL}/api`,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    // No es necesario loguear aquí en producción, pero útil para debug
    // console.log(`[apiClient Request] Path: ${config.url}, Token found: ${token ? 'Yes' : 'No'}`);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
     console.error("[apiClient Request] Error:", error);
     return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const configUrl = error.config?.url;
    const responseData = error.response?.data;
    
    let finalErrorMessage = error.message || "Error desconocido";
    let validationErrorsArray = null;

    if (responseData) {
      if (responseData.errors && Array.isArray(responseData.errors)) {
        // Tenemos un array de errores de express-validator
        validationErrorsArray = responseData.errors;
        // Podríamos construir un mensaje general, o dejar que el componente lo haga
        finalErrorMessage = "Se encontraron errores de validación. Por favor, revise los campos.";
      } else if (responseData.message) {
        finalErrorMessage = responseData.message;
      } else if (typeof responseData === 'string' && responseData.startsWith('[')) {
        // Intento de parsear si el mensaje es un string JSON de un array de errores
        try {
            validationErrorsArray = JSON.parse(responseData);
            finalErrorMessage = "Se encontraron errores de validación. Por favor, revise los campos.";
        } catch (e) {
            // No era JSON válido, usar responseData como mensaje si es string
            if (typeof responseData === 'string') finalErrorMessage = responseData;
        }
      }
    }

    console.error(`[apiClient Response Interceptor] Path: ${configUrl}, Status: ${status || 'Network'}, Message: ${finalErrorMessage}`);
    if (responseData) console.error("[apiClient Response Interceptor] Full Response Data:", responseData);

    // Lógica de redirección para 401/403 (descomentar si es necesario)
    if ((status === 401 || status === 403) && !configUrl?.includes('/auth/login')) {
       console.warn("[apiClient] Unauthorized/Forbidden. Potentially redirecting to login.");
       localStorage.removeItem('authToken');
       if (window.location.pathname !== '/login') {
        // Descomentar para redirección real:
        // window.location.href = '/login?sessionExpired=true';
       }
    }

    const customError = new Error(finalErrorMessage);
    if (validationErrorsArray) {
      customError.validationErrors = validationErrorsArray; // Adjuntar errores estructurados
    }
    if (status) {
      customError.statusCode = status; // Adjuntar statusCode si está disponible
    }
    
    return Promise.reject(customError);
  }
);

export default apiClient;