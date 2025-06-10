// src/context/AuthContext.js
import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
    useMemo
} from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { loginUserApi, logoutApi } from '../api/userApi'; // Asumo que getCurrentUserApi se llama desde apiClient.get('/auth/currentuser')

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const checkAuthStatus = useCallback(async () => {
        const tokenInStorage = localStorage.getItem('authToken');
        if (!tokenInStorage) {
            setUser(null);
            setAuthToken(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        // Si hay token, apiClient debería usarlo automáticamente.
        // Si no, debes configurar apiClient para que use tokenInStorage aquí.
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenInStorage}`; // Ejemplo con Axios

        try {
            const currentUserData = await apiClient.get('/auth/currentuser'); // Llama a tu endpoint de usuario actual
            setUser(currentUserData.data);
            setAuthToken(tokenInStorage); // Asegura que el token del estado sea el de storage
            setIsAuthenticated(true);
            setError(null);
        } catch (err) {
            localStorage.removeItem('authToken');
            setUser(null);
            setAuthToken(null);
            setIsAuthenticated(false);
            setError("Tu sesión ha expirado o el token es inválido.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = useCallback(async (credentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await loginUserApi(credentials);
            if (response.token) {
                const token = response.token;
                localStorage.setItem('authToken', token);
                setAuthToken(token);
                setIsAuthenticated(true);
                // Inmediatamente después de setear el token, apiClient debería poder usarlo
                // para la siguiente petición si está configurado con interceptores.

                const currentUserData = await apiClient.get('/auth/currentuser');
                setUser(currentUserData.data);
                setError(null);
                navigate('/');
            } else {
                 throw new Error("Respuesta de login inválida: no se recibió token.");
            }
        } catch (err) {
            localStorage.removeItem('authToken');
            setUser(null);
            setAuthToken(null);
            setIsAuthenticated(false);
            setError(err.response?.data?.message || err.message || "Error durante el inicio de sesión.");
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const logout = useCallback(async () => {
        setError(null);
        try {
             await logoutApi();
        } catch (logoutErr) {
             console.warn("AuthContext: Logout API call failed (likely okay).", logoutErr);
        } finally {
             localStorage.removeItem('authToken');
             setUser(null);
             setAuthToken(null);
             setIsAuthenticated(false);
             // Limpia también cualquier configuración global de apiClient si la tienes
             // delete apiClient.defaults.headers.common['Authorization']; // Ejemplo con Axios
             navigate('/login');
        }
    }, [navigate]);

    const contextValue = useMemo(() => ({
        isAuthenticated,
        user,
        authToken, // Podrías omitir exponer authToken si no se usa directamente
        isLoading,
        error,
        login,
        logout,
        checkAuthStatus // Exponer si se necesita re-validar manualmente
    }), [isAuthenticated, user, authToken, isLoading, error, login, logout, checkAuthStatus]);

    return (
        <AuthContext.Provider value={contextValue}>
            {isLoading ? null : children}
        </AuthContext.Provider>
    );
};