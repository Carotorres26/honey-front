// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../layouts/NavbarComp"; // <<< Asegúrate que importe TU Sidebar/Navbar
import { logoutApi } from "../api/userApi";
import "./MainLayout.css"; // <<< Usa el MainLayout.css corregido abajo

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  return (
    <div className="main-layout">
      {/* Pasa estado y función al Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleMenu={toggleSidebar} handleLogout={handleLogout} />

      {/* Área de contenido que se ajusta */}
      <div className={`content-area ${isSidebarOpen ? "sidebar-active" : "sidebar-collapsed"}`}>
        <Outlet /> {/* Aquí se renderizan RolesPage, ServicesPage, etc. */}
      </div>
    </div>
  );
};
export default MainLayout;
