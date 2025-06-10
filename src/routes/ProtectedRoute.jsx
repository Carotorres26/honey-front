// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Verifica si existe el token en localStorage (o donde lo guardes)
  const token = localStorage.getItem('authToken'); // Asegúrate que la clave 'authToken' sea correcta

  // 2. Obtiene la ubicación actual (opcional, para redirigir de vuelta después del login)
  const location = useLocation();

  // 3. Si NO hay token...
  if (!token) {
    // Redirige al usuario a la página de login.
    // state={{ from: location }} guarda la página de la que vino
    // para poder volver después de iniciar sesión (opcional).
    console.log("ProtectedRoute: No token found, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Si hay token, renderiza los componentes hijos
  // (en tu caso, MainLayout que a su vez contiene el <Outlet>)
  return children;
};

export default ProtectedRoute;
