import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Swal from 'sweetalert2'; // Importación de SweetAlert2
import {
  FaBars, FaTimes, FaHome, FaUser, FaCog, FaHorse, FaMoneyBill,
  FaFileContract, FaClinicMedical, FaBuilding, FaUsers,
  FaUserCircle, FaSignOutAlt, FaNotesMedical, FaChevronDown,
  FaSyringe, FaAppleAlt
} from "react-icons/fa";
import "./Navbar.css"; 
import logo from "../assets/logo.png";

const Sidebar = ({ isOpen, toggleMenu, handleLogout }) => {
  const location = useLocation();
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  // Función para mostrar la alerta de confirmación de cierre de sesión
  const handleLogoutClick = () => {
    Swal.fire({
      title: 'Confirmar Cierre de Sesión',
      text: "¿Está seguro de que quiere cerrar la sesión?",
      icon: 'warning', // Este es el icono de exclamación naranja
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      // Si el usuario hace clic en "Sí, cerrar sesión", se ejecuta el logout
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const toggleHistorialMenu = () => {
    if (isOpen) {
      setIsHistorialOpen(!isHistorialOpen);
    }
  };

  const isHistorialActive = [
    '/medicines',
    '/vacunacion',
    '/alimentacion',
    '/control-ejemplar'
  ].includes(location.pathname);

  useEffect(() => {
    if (!isOpen) {
      setIsHistorialOpen(false);
    }
  }, [isOpen]);

  return (
    <>
      <nav className={`sidebar ${isOpen ? "active" : "collapsed"}`}>
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>

        <div className="sidebar-menu-wrapper scrollable-menu">
          <ul className="sidebar-menu">
            <li className={location.pathname === "/perfil" ? "active-link" : ""}>
              <Link to="/perfil"><FaUserCircle className="icon" /> {isOpen && "Perfil"}</Link>
            </li>
            <li className={location.pathname === "/dashboard" ? "active-link" : ""}>
              <Link to="/dashboard"><FaHome className="icon" /> {isOpen && "Dashboard"}</Link>
            </li>
            <li className={location.pathname === "/services" ? "active-link" : ""}>
              <Link to="/services"><FaCog className="icon" /> {isOpen && "Servicios"}</Link>
            </li>
            <li className={location.pathname === "/roles" ? "active-link" : ""}>
              <Link to="/roles"><FaUser className="icon" /> {isOpen && "Roles"}</Link>
            </li>
            <li className={location.pathname === "/users" ? "active-link" : ""}>
              <Link to="/users"><FaUsers className="icon" /> {isOpen && "Usuarios"}</Link>
            </li>
            <li className={location.pathname === "/sedes" ? "active-link" : ""}>
              <Link to="/sedes"><FaBuilding className="icon" /> {isOpen && "Sedes"}</Link>
            </li>
            <li className={location.pathname === "/specimens" ? "active-link" : ""}>
              <Link to="/specimens"><FaHorse className="icon" /> {isOpen && "Ejemplares"}</Link>
            </li>
            <li className={location.pathname === "/clients" ? "active-link" : ""}>
              <Link to="/clients"><FaUser className="icon" /> {isOpen && "Clientes"}</Link>
            </li>
            <li className={location.pathname === "/contracts" ? "active-link" : ""}>
              <Link to="/contracts"><FaFileContract className="icon" /> {isOpen && "Contratos"}</Link>
            </li>
            <li className={location.pathname === "/payments" ? "active-link" : ""}>
              <Link to="/payments"><FaMoneyBill className="icon" /> {isOpen && "Pagos"}</Link>
            </li>
            <li className={`dropdown-item ${isHistorialOpen ? 'open' : ''} ${isHistorialActive && !isHistorialOpen ? 'active-parent' : ''}`}>
              <Link to="/control-ejemplar" onClick={toggleHistorialMenu} className={`dropdown-toggle ${isHistorialActive ? 'active-parent-button' : ''}`} aria-expanded={isHistorialOpen}>
                <FaNotesMedical className="icon" />
                {isOpen && <span className="menu-text">Historial Seguimiento</span>}
                {isOpen && <FaChevronDown className={`arrow-icon ${isHistorialOpen ? 'open' : ''}`} />}
              </Link>
              <ul className={`submenu ${isHistorialOpen ? 'open' : ''}`}>
                <li className={location.pathname === "/medicines" ? "active-link" : ""}><Link to="/medicines"><FaClinicMedical className="icon submenu-icon" /> {isOpen && "Medicinas"}</Link></li>
                <li className={location.pathname === "/alimentacion" ? "active-link" : ""}><Link to="/alimentacion"><FaAppleAlt className="icon submenu-icon" /> {isOpen && "Alimentación"}</Link></li>
                <li className={location.pathname === "/vacunacion" ? "active-link" : ""}><Link to="/vacunacion"><FaSyringe className="icon submenu-icon" /> {isOpen && "Vacunación"}</Link></li>
              </ul>
            </li>
          </ul>

          <ul className="sidebar-menu sidebar-bottom-menu">
            <li>
              <button onClick={handleLogoutClick} className="logout-button">
                <FaSignOutAlt className="icon" /> {isOpen && "Cerrar Sesión"}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <button className="menu-btn" onClick={toggleMenu}>
        {isOpen ? <FaTimes className="menu-icon" /> : <FaBars className="menu-icon" />}
      </button>
    </>
  );
};

export default Sidebar;