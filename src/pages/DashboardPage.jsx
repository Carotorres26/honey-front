// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import {
    getTotalEjemplaresApi,
    getContratosNuevosPorMesApi,
    getDistribucionEjemplaresPorSedeApi
} from '../api/dashboardApi'; // <-- VERIFICA ESTA RUTA

// --- ICONO MEJORADO ---
// Usaremos LuLayoutDashboard de Lucide Icons (parte de react-icons)
// Asegúrate de tener react-icons actualizado: npm install react-icons
import { LuLayoutDashboard } from 'react-icons/lu'; // Icono específico para Dashboard

import TotalEjemplaresCard from '../components/Dashboard/TotalEjemplaresCard';
import ContratosMensualesChart from '../components/Dashboard/ContratosMensualesChart';
import DistribucionSedesChart from '../components/Dashboard/DistribucionSedesChart';

// --- ESTILOS: OPCIÓN 1 REFINADA - HEADER INTEGRADO CON ICONO ---
const styles = {
    dashboardContainer: {
        padding: '2.5rem 3rem',
        backgroundColor: '#F8F9FA',
        minHeight: '100vh',
        fontFamily: "'Inter', 'Poppins', sans-serif", // Fuente general para el dashboard
    },
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #E0E5EB',
    },
    dashboardTitleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem', // Ligero ajuste de espacio si es necesario con el nuevo icono
    },
    dashboardIcon: {
        fontSize: '1.85rem', // Ligeramente más grande para que coincida con la presencia de Montserrat Bold
        color: '#A37E2C',
        lineHeight: 1,
    },
    dashboardTitleText: {
        fontSize: '1.75rem', // Mantenemos el tamaño de letra solicitado
        // --- TIPOGRAFÍA MEJORADA ---
        fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
        fontWeight: '700',   // Bold para Montserrat, da más impacto
        color: '#2E2B26',
        margin: 0,
        letterSpacing: '-0.3px', // Ajuste para Montserrat
    },
    controlsSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    yearSelectLabel: {
        fontSize: '0.875rem',
        color: '#6B5D4D',
        fontWeight: '500',
    },
    yearSelect: {
        padding: '0.5rem 0.8rem',
        fontSize: '0.875rem',
        borderRadius: '8px',
        border: `1.5px solid #DCCEB8`,
        color: '#A37E2C',
        backgroundColor: '#FFFFFF',
        fontWeight: '500',
        minWidth: '100px',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23A37E2C' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.6rem center',
        paddingRight: '2.3rem',
        boxShadow: '0 2px 6px rgba(190, 170, 130, 0.08)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1fr)',
        gridAutoRows: 'auto',
        gap: '2.25rem',
        alignItems: 'start',
    },
    rightColumnCards: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2.25rem',
        height: '100%',
    }
};

const DashboardPage = () => {
    // Estados para los datos
    const [totalEjemplaresData, setTotalEjemplaresData] = useState(null);
    const [contratosMensualesData, setContratosMensualesData] = useState(null);
    const [distribucionSedesData, setDistribucionSedesData] = useState(null);

    // Estados de carga
    const [loadingEjemplares, setLoadingEjemplares] = useState(true);
    const [loadingContratos, setLoadingContratos] = useState(true);
    const [loadingSedes, setLoadingSedes] = useState(true);

    // Estados de error
    const [errorEjemplares, setErrorEjemplares] = useState(null);
    const [errorContratos, setErrorContratos] = useState(null);
    const [errorSedes, setErrorSedes] = useState(null);

    // Estado para el año seleccionado
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const aniosDisponibles = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const fetchTotalEjemplares = async () => {
            try {
                setLoadingEjemplares(true); setErrorEjemplares(null);
                const data = await getTotalEjemplaresApi();
                setTotalEjemplaresData(data);
            } catch (err) {
                console.error("Error fetching total ejemplares:", err);
                setErrorEjemplares(err.response?.data?.message || err.message || 'Error al cargar total de ejemplares.');
            } finally { setLoadingEjemplares(false); }
        };

        const fetchDistribucionSedes = async () => {
            try {
                setLoadingSedes(true); setErrorSedes(null);
                const data = await getDistribucionEjemplaresPorSedeApi();
                setDistribucionSedesData(data);
            } catch (err) {
                console.error("Error fetching distribucion sedes:", err);
                setErrorSedes(err.response?.data?.message || err.message || 'Error al cargar distribución por sedes.');
            } finally { setLoadingSedes(false); }
        };

        fetchTotalEjemplares();
        fetchDistribucionSedes();
    }, []);

    useEffect(() => {
        const fetchContratosMensuales = async () => {
            if (!anioSeleccionado) {
                setLoadingContratos(false); setContratosMensualesData([]); return;
            }
            try {
                setLoadingContratos(true); setErrorContratos(null);
                const data = await getContratosNuevosPorMesApi(anioSeleccionado);
                setContratosMensualesData(data);
            } catch (err) {
                console.error("Error fetching contratos mensuales:", err);
                setErrorContratos(err.response?.data?.message || err.message || `Error al cargar contratos para ${anioSeleccionado}.`);
            } finally { setLoadingContratos(false); }
        };
        fetchContratosMensuales();
    }, [anioSeleccionado]);

    const handleAnioChange = (event) => {
        setAnioSeleccionado(parseInt(event.target.value, 10));
    };

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.pageHeader}>
                <div style={styles.dashboardTitleContainer}>
                    {/* Icono cambiado */}
                    <LuLayoutDashboard style={styles.dashboardIcon} />
                    {/* Texto del título con la nueva tipografía Montserrat Bold */}
                    <h1 style={styles.dashboardTitleText}>Dashboard General</h1>
                </div>
                <div style={styles.controlsSection}>
                    <label htmlFor="year-select" style={styles.yearSelectLabel}>Año Contratos:</label>
                    <select
                        id="year-select"
                        value={anioSeleccionado}
                        onChange={handleAnioChange}
                        style={styles.yearSelect}
                        disabled={loadingContratos}
                    >
                        {aniosDisponibles.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={styles.gridContainer}>
                <ContratosMensualesChart
                    data={contratosMensualesData}
                    loading={loadingContratos}
                    error={errorContratos}
                    anioSeleccionado={anioSeleccionado}
                    customCardStyle={{ height: '100%' }}
                />
                <div style={styles.rightColumnCards}>
                    <TotalEjemplaresCard
                        data={totalEjemplaresData}
                        loading={loadingEjemplares}
                        error={errorEjemplares}
                    />
                    <DistribucionSedesChart
                        data={distribucionSedesData}
                        loading={loadingSedes}
                        error={errorSedes}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;