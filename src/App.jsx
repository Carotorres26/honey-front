// src/App.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Layouts y Componentes ---
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
// --- IMPORTA LOS NUEVOS COMPONENTES ---
import RecoveryPassword from './pages/RecoveryPassword';
import ResetPasswordPage from './pages/ResetPasswordPage';
// --- FIN IMPORTACIONES NUEVAS ---
import ProtectedRoute from './routes/ProtectedRoute';
import Perfil from './pages/Perfil';
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import UsersPage from './pages/Users';
import ServicesPage from './pages/Services';
import SedesPage from './pages/VenuesPage';
import SpecimenPage from './pages/SpecimenPage';
import ClientsPage from './pages/ClientsPage';
import ContractsPage from './pages/ContractsPage';
import MedicinesPage from './pages/Medicine';
import PaymentsPage from './pages/Pagos';
import AlimentacionPage from './pages/AlimentacionPage';
import VacunacionPage from './pages/VacunacionPage';
import ControlEjemplarPage from './pages/ControlEjemplarPage';
import 'sweetalert2/dist/sweetalert2.min.css';

const App = () => {
  // const token = localStorage.getItem('authToken'); // No es necesario aquí para la lógica de rutas

  return (
    <Routes>

      {/*      RUTAS PÚBLICAS        */}

      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<RecoveryPassword />} /> {/* <--- AÑADIDA */}
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> {/* <--- AÑADIDA */}


      {/*      RUTAS PROTEGIDAS      */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Si el usuario está autenticado y va a "/", será redirigido a "/dashboard" */}
        <Route index element={<Navigate to="/dashboard" replace />} /> {/* Corregido: no depende de 'token' aquí porque ProtectedRoute ya lo valida */}
        
        {/* Las rutas hijas deben ser relativas si la ruta padre es "/" */}
        <Route path="dashboard" element={<DashboardPage />} /> 
        <Route path="perfil" element={<Perfil />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="sedes" element={<SedesPage />} />
        <Route path="specimens" element={<SpecimenPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="alimentacion" element={<AlimentacionPage />} />
        <Route path="vacunacion" element={<VacunacionPage />} />
        <Route path="control-ejemplar" element={<ControlEjemplarPage />} />

        <Route path="*" element={<div>404 - Página no encontrada dentro de la aplicación</div>} />
      </Route>

      {/* Ruta catch-all GLOBAL */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;