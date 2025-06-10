// src/components/Dashboard/DistribucionSedesChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// Si quisieras iconos de opciones, por ejemplo:
// import { FiMoreHorizontal } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend);

// Tu paleta de colores para la dona, manteniendo la consistencia
const YOUR_DONUT_COLORS_FUSION = [
    '#E9C46A', // Tu amarillo principal
    '#A37E2C', // Tu dorado oscuro
    '#F4D89A', // Amarillo pálido
    '#C08B3C', // Dorado medio
    '#D9B97A', // Beige dorado
    '#B08D57', // Marrón claro
    // Puedes añadir más si esperas más de 6 categorías
];

const styles = {
    card: {
        backgroundColor: '#FFFFFF',
        padding: '1.75rem',
        borderRadius: '24px', // Consistente con las otras tarjetas modernas
        boxShadow: '0 10px 25px rgba(200, 180, 140, 0.12)', // Sombra dorada suave
        minHeight: 'auto', // Se ajustará al contenido y al espacio del grid
        height: '100%', // Para que intente llenar la celda del grid si está en rightColumnCards
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', 'Poppins', sans-serif",
        position: 'relative', // Para el icono de opciones
        transition: 'box-shadow 0.3s ease-in-out',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Alinear al inicio para el subtítulo
        marginBottom: '1rem',
    },
    titleContainer: {
        // Ocupa el espacio disponible para el texto
    },
    cardTitle: { // Título principal de la tarjeta
        fontSize: '1.1rem', // Elegante y legible
        fontWeight: '600',
        color: '#3D3935',   // Tu marrón oscuro
        margin: '0 0 0.1rem 0',
    },
    cardSubtitle: { // Subtítulo descriptivo
        fontSize: '0.8rem',
        color: '#B0A08C',   // Beige/marrón claro
    },
    actionIconPlaceholder: { // Para el icono "..." o "+"
        width: '24px',
        height: '24px',
        // Ejemplo si usaras un icono:
        // color: '#B0A08C',
        // cursor: 'pointer',
        // fontSize: '1.25rem',
        // display: 'flex',
        // alignItems: 'center',
        // justifyContent: 'center',
    },
    loadingText: {
        fontSize: '1rem',
        fontWeight: '500',
        color: '#A37E2C', // Tu dorado oscuro
        textAlign: 'center',
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '150px', // Altura mínima durante la carga
    },
    errorText: {
        fontSize: '0.9rem',
        color: '#D32F2F', // Rojo para error
        fontWeight: '500',
        textAlign: 'center',
        marginTop: '0.5rem',
    },
    chartContainer: {
        flexGrow: 1, // Permite que el gráfico ocupe el espacio restante
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '0.5rem', // Pequeño espacio sobre el gráfico
        minHeight: '220px', // Altura mínima para la dona
    },
    chartCanvasWrapper: { // Controla el tamaño del canvas de la dona
        maxWidth: '230px', // Ajusta para equilibrio con la leyenda si es lateral
        maxHeight: '230px',
        width: '100%',
        height: '100%',
    },
    statusContainer: { // Para los estados de carga y error
        // Se definirá abajo usando spread de styles.card
    },
};
// Definir statusContainer después de styles.card para poder usar spread
styles.statusContainer = {
    ...styles.card,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2rem', // Padding para el mensaje
};

const DistribucionSedesChart = ({
    data = [],
    loading,
    error = null,
    customCardStyle = {} // Para estilos de grid pasados desde el padre
}) => {
    if (loading) {
        return (
            <div style={{...styles.statusContainer, ...customCardStyle}}>
                <p style={styles.loadingText}>Cargando distribución...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ ...styles.statusContainer, ...customCardStyle, backgroundColor: 'rgba(233, 196, 106, 0.02)' }}>
                <div style={styles.cardHeader}>
                    <div style={styles.titleContainer}>
                        <h3 style={styles.cardTitle}>Ejemplares por Sede</h3>
                    </div>
                    <div style={styles.actionIconPlaceholder}></div>
                </div>
                <p style={styles.errorText}>{error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div style={{...styles.card, ...customCardStyle}}>
                <div style={styles.cardHeader}>
                    <div style={styles.titleContainer}>
                        <h3 style={styles.cardTitle}>Ejemplares por Sede</h3>
                        <p style={styles.cardSubtitle}>Distribución porcentual</p>
                    </div>
                    <div style={styles.actionIconPlaceholder}></div>
                </div>
                <div style={{...styles.chartContainer, alignItems: 'center', justifyContent: 'center'}}>
                     <p style={{...styles.loadingText, minHeight: 'auto', color: '#B0A08C'}}>No hay datos de distribución.</p>
                </div>
            </div>
        );
    }

    const chartLabels = data.map(item => item.nombreSede);
    const chartDataValues = data.map(item => item.cantidadEjemplares);
    const backgroundColors = data.map((_, index) => YOUR_DONUT_COLORS_FUSION[index % YOUR_DONUT_COLORS_FUSION.length]);

    const chartConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Ejemplares',
                data: chartDataValues,
                backgroundColor: backgroundColors,
                borderColor: '#FFFFFF', // Borde blanco entre segmentos
                borderWidth: 2.5,       // Grosor del borde
                hoverBorderColor: '#FAF9F7', // Borde casi blanco al pasar el mouse
                hoverBorderWidth: 3,
                hoverOffset: 8,         // Cuánto se expande al pasar el mouse
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Importante para que el canvas se ajuste al wrapper
        cutout: '65%', // Tamaño del agujero de la dona
        plugins: {
            legend: {
                position: 'right', // Leyenda a la derecha
                align: 'center',    // Centrar verticalmente la leyenda
                labels: {
                    color: '#70655B', // Marrón medio para el texto
                    font: { weight: '500', family: "'Inter', sans-serif", size: 10 },
                    boxWidth: 10,       // Cajas de color más pequeñas
                    padding: 12,        // Espaciado de la leyenda
                    usePointStyle: true,
                    pointStyle: 'circle', // Puntos para la leyenda
                }
            },
            title: { display: false }, // Usamos el título de la tarjeta
            tooltip: {
                enabled: true,
                backgroundColor: '#3D3935', // Marrón oscuro
                titleFont: { family: "'Inter', sans-serif", weight: '600', size: 12 },
                titleColor: '#FDFCFB',    // Blanco cálido
                bodyFont: { family: "'Inter', sans-serif", size: 11 },
                bodyColor: '#FDFCFB',
                borderColor: '#D4AF37',   // Dorado brillante
                borderWidth: 1,
                padding: 10,
                cornerRadius: 10,
                displayColors: true,     // Mostrar el cuadrito de color en el tooltip
                boxPadding: 3,           // Padding para el cuadrito de color
                callbacks: {
                    // Mostrar nombre de la sede como título del tooltip
                    title: function(tooltipItems) {
                        return tooltipItems[0].label;
                    },
                    // Mostrar valor y porcentaje en el cuerpo
                    label: function(context) {
                        const value = context.raw || 0;
                        const total = context.chart.getDatasetMeta(0).total;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return ` ${value} (${percentage}%)`; // Quitar etiqueta "Ejemplares:"
                    },
                }
            }
        },
    };

    return (
        <div style={{...styles.card, ...customCardStyle}}>
            <div style={styles.cardHeader}>
                <div style={styles.titleContainer}>
                    <h3 style={styles.cardTitle}>Distribución por Sede</h3>
                    <p style={styles.cardSubtitle}>Porcentaje de ejemplares</p>
                </div>
                <div style={styles.actionIconPlaceholder}>
                    {/* <FiMoreHorizontal style={styles.actionIconPlaceholder} /> */}
                </div>
            </div>
            <div style={styles.chartContainer}>
                <div style={styles.chartCanvasWrapper}>
                    <Doughnut options={chartOptions} data={chartConfig} />
                </div>
            </div>
        </div>
    );
};

DistribucionSedesChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        nombreSede: PropTypes.string.isRequired,
        cantidadEjemplares: PropTypes.number.isRequired,
    })),
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    customCardStyle: PropTypes.object,
};

export default DistribucionSedesChart;