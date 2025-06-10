// src/components/Dashboard/ContratosMensualesChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
// import { FiPlus } from 'react-icons/fi'; // Ejemplo para icono "+"
// import ChartDataLabels from 'chartjs-plugin-datalabels'; // Opcional

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler /*, ChartDataLabels*/);

const styles = {
    card: {
        backgroundColor: '#FFFFFF',
        padding: '0',
        borderRadius: '24px',
        boxShadow: '0 12px 35px rgba(200, 180, 140, 0.1)', // Sombra más suave
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', 'Poppins', sans-serif",
        overflow: 'hidden',
        position: 'relative',
    },
    chartBackground: {
        backgroundColor: '#FFFDF5', // Un beige/amarillo extremadamente pálido, casi blanco
        // O un gradiente muy sutil si se prefiere:
        // background: 'linear-gradient(180deg, rgba(233, 196, 106, 0.05) 0%, rgba(253, 252, 248, 0) 70%)',
        padding: '1.75rem 2rem 1rem 2rem',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem', // Más espacio antes del gráfico
    },
    titleContainer: {},
    cardTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#4A3F35', // Marrón oscuro más profundo
        margin: 0,
    },
    dateRange: {
        fontSize: '0.8rem',
        color: '#B0A08C',
        marginTop: '0.2rem',
    },
    actionIcon: { // Para el icono "+" o "..."
        color: '#A37E2C',
        fontSize: '1.1rem',
        cursor: 'pointer',
        backgroundColor: 'rgba(233, 196, 106, 0.2)',
        padding: '0.5rem', // Un poco más de padding
        borderRadius: '10px', // Más redondeado
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
        // ':hover': { backgroundColor: 'rgba(233, 196, 106, 0.3)' }
    },
    chartContainer: {
        flexGrow: 1,
        position: 'relative',
        minHeight: '220px', // Ajustado para dar espacio al sumario
    },
    summaryBelowChart: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F5F2ED',
    },
    summaryItem: { textAlign: 'center', flex: 1 },
    summaryLabel: { fontSize: '0.75rem', textTransform: 'capitalize', color: '#B0A08C', marginBottom: '0.3rem', display: 'block' },
    summaryValue: { fontSize: '1.05rem', fontWeight: '600', color: '#A37E2C' },
    statusContainer: {},
    loadingText: { fontSize: '1rem', fontWeight: '500', color: '#A37E2C', textAlign: 'center', width: '100%', paddingTop: '3rem' },
    errorText: { fontSize: '0.9rem', color: '#D32F2F', fontWeight: '500', textAlign: 'center', marginTop: '1rem' }
};
styles.statusContainer = { ...styles.card, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem', backgroundColor: '#FFFFFF' };

const ContratosMensualesChart = ({
    data = [], loading, error = null, anioSeleccionado, customCardStyle = {}
}) => {
    if (loading) return <div style={{...styles.statusContainer, ...customCardStyle}}><p style={styles.loadingText}>Cargando contratos...</p></div>;
    if (error) return <div style={{ ...styles.statusContainer, ...customCardStyle}}><h3 style={{...styles.cardTitle, marginBottom: '0.5rem', color: '#A37E2C'}}>Contratos Mensuales</h3><p style={styles.errorText}>{error}</p></div>;
    
    const noDataAvailable = !data || data.length === 0;
    const chartLabels = !noDataAvailable ? data.map(item => item.nombreMes.substring(0, 3)) : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const chartDataValues = !noDataAvailable ? data.map(item => item.cantidadNuevos) : Array(12).fill(null);

    let peakValue = 0; let peakMonthLabel = '-'; let totalContractsYear = 0; let averageContracts = '0.0';
    if (!noDataAvailable) {
        peakValue = Math.max(...chartDataValues.map(v => v || 0), 0);
        const peakMonthIndex = chartDataValues.indexOf(peakValue);
        peakMonthLabel = data[peakMonthIndex]?.nombreMes || (peakValue > 0 ? chartLabels[peakMonthIndex] : '-');
        totalContractsYear = chartDataValues.reduce((sum, val) => sum + (val || 0), 0);
        const activeMonthsWithData = chartDataValues.filter(v => v !== null && v > 0).length || 1;
        averageContracts = (totalContractsYear / activeMonthsWithData).toFixed(1);
    }

    const chartConfig = {
        labels: chartLabels,
        datasets: [ {
            label: 'Contratos',
            data: chartDataValues,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Barras blancas con ligera transparencia
            borderColor: '#E9C46A', // Borde amarillo/dorado claro
            borderWidth: 1.5,
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 }, // Solo redondear arriba
            hoverBackgroundColor: '#E9C46A', // <<--- HOVER MÁS FUERTE (Tu amarillo principal)
            hoverBorderColor: '#A37E2C',     // <<--- Borde dorado oscuro en hover
            barPercentage: 0.5,
            categoryPercentage: 0.65,
        } ],
    };
    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, // Ocultar leyenda para este estilo
            title: { display: false },
            tooltip: {
                enabled: true, mode: 'index', intersect: false,
                backgroundColor: '#4A3F35', // Marrón oscuro para tooltip
                titleFont: { family: "'Inter', sans-serif", weight: '600', size: 12 },
                titleColor: '#FFFDF5', // Blanco cálido
                bodyFont: { family: "'Inter', sans-serif", size: 11 },
                bodyColor: '#FFFDF5',
                borderColor: '#D4AF37',
                borderWidth: 1,
                padding: { top: 8, bottom: 8, left: 12, right: 12 },
                cornerRadius: 8,
                displayColors: false,
                yAlign: 'bottom',
                callbacks: {
                    title: (tooltipItems) => data[tooltipItems[0].dataIndex]?.nombreMes || chartLabels[tooltipItems[0].dataIndex],
                    label: (context) => context.parsed.y !== null ? ` ${context.parsed.y} ${context.dataset.label}` : 'Sin datos'
                }
            },
            // datalabels: { // Configuración para etiquetas sobre las barras (si se usa el plugin)
            //     anchor: 'end',
            //     align: 'top',
            //     offset: 4,
            //     color: '#8C6D1F',
            //     font: { weight: '600', size: 10 },
            //     formatter: (value) => value > 0 ? value : '',
            //     display: (context) => context.dataset.data[context.dataIndex] > 0 // Mostrar solo si hay valor
            // }
        },
        scales: {
            y: {
                beginAtZero: true, border: { display: false },
                ticks: { display: false }, // Ocultar ticks del eje Y
                grid: {
                    drawTicks: false,
                    color: 'rgba(212, 175, 55, 0.1)', // Líneas de cuadrícula doradas aún más sutiles
                    lineWidth: 1, // Líneas finas
                    drawBorder: false,
                },
            },
            x: {
                border: { display: false },
                ticks: {
                    color: '#BEB092', // Beige/marrón para etiquetas de mes
                    font: { size: 10, family: "'Inter', sans-serif" },
                    padding: 10
                },
                grid: { display: false },
            },
        },
    };
    
    if (noDataAvailable && !loading && !error) {
        return (
            <div style={{...styles.card, ...customCardStyle}}>
                <div style={styles.chartBackground}>
                    <div style={styles.cardHeader}>
                        <div style={styles.titleContainer}><h3 style={styles.cardTitle}>Nuevos Contratos por Mes</h3><p style={styles.dateRange}>Año {anioSeleccionado}</p></div>
                        <div>{/* <FiPlus style={styles.actionIcon} /> */}</div>
                    </div>
                    <div style={{...styles.chartContainer, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <p style={{...styles.loadingText, paddingTop: 0, color: '#BEB092'}}>No hay datos para mostrar.</p>
                    </div>
                </div>
                <div style={styles.summaryBelowChart}>
                    <div style={styles.summaryItem}><p style={styles.summaryLabel}>Pico Mes</p><p style={styles.summaryValue}>-</p></div>
                    <div style={styles.summaryItem}><p style={styles.summaryLabel}>Total Año</p><p style={styles.summaryValue}>0</p></div>
                    <div style={styles.summaryItem}><p style={styles.summaryLabel}>Prom./Mes</p><p style={styles.summaryValue}>0.0</p></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{...styles.card, ...customCardStyle}}>
            <div style={styles.chartBackground}>
                <div style={styles.cardHeader}>
                    <div style={styles.titleContainer}><h3 style={styles.cardTitle}>Nuevos Contratos por Mes</h3><p style={styles.dateRange}>Resumen del Año {anioSeleccionado}</p></div>
                    <div>{/* <FiPlus style={styles.actionIcon} /> Puedes añadir un icono aquí */}</div>
                </div>
                <div style={styles.chartContainer}><Bar options={chartOptions} data={chartConfig} /></div>
            </div>
            <div style={styles.summaryBelowChart}>
                <div style={styles.summaryItem}><p style={styles.summaryLabel}>Pico ({peakMonthLabel})</p><p style={styles.summaryValue}>{peakValue}</p></div>
                <div style={styles.summaryItem}><p style={styles.summaryLabel}>Total Anual</p><p style={styles.summaryValue}>{totalContractsYear}</p></div>
                <div style={styles.summaryItem}><p style={styles.summaryLabel}>Prom./Mes</p><p style={styles.summaryValue}>{averageContracts}</p></div>
            </div>
        </div>
    );
};
ContratosMensualesChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({ mes: PropTypes.number.isRequired, nombreMes: PropTypes.string.isRequired, cantidadNuevos: PropTypes.number.isRequired })),
    loading: PropTypes.bool.isRequired, error: PropTypes.string, anioSeleccionado: PropTypes.number.isRequired, customCardStyle: PropTypes.object,
};
export default ContratosMensualesChart;