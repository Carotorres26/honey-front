// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ContractProvider } from './context/ContractContext';
import { AuthProvider } from './context/AuthContext'; // Descomentado

// Importa tu CSS global u otros si los tienes
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // O como se llame tu CSS global

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // Puedes descomentar StrictMode más tarde si lo necesitas
    <BrowserRouter>
       <AuthProvider>  {/* Descomentado y envolviendo */}
         <ContractProvider>
          <App />
        </ContractProvider>
       </AuthProvider> {/* Descomentado y cerrando */}
    </BrowserRouter>
  // </React.StrictMode>
);