// src/components/Dashboard/TotalEjemplaresCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaHorse } from 'react-icons/fa';

const styles = {
    card: {
        backgroundColor: '#FFFFFF',
        padding: '1.25rem', // Reducido para ser más compacta
        borderRadius: '20px',
        boxShadow: '0 8px 20px rgba(200, 180, 140, 0.1)',
        color: '#4A4A4A',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '1.25rem',
        minHeight: 'auto', // Altura se ajusta al contenido
        fontFamily: "'Inter', 'Poppins', sans-serif",
        borderLeft: `5px solid #D4AF37`, // Borde dorado
        transition: 'box-shadow 0.3s ease-in-out',
    },
    iconWrapper: {
        backgroundColor: 'rgba(233, 196, 106, 0.15)',
        borderRadius: '12px',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    icon: {
        fontSize: '2rem',
        color: '#A37E2C',
    },
    contentWrapper: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexGrow: 1,
    },
    cardTitle: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#796B4B',
        marginBottom: '0.2rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    kpiValue: {
        fontSize: '2.2rem', // Más pequeño
        fontWeight: 'bold',
        color: '#A37E2C',
        lineHeight: '1',
        margin: '0 0 0.1rem 0',
    },
    kpiSeparatorLine: {
        height: '2px',
        width: '30px',
        backgroundColor: '#E9C46A',
        margin: '0.2rem 0 0.4rem 0',
        borderRadius: '1px',
    },
    subtitle: {
        fontSize: '0.75rem',
        color: '#594F45',
    },
    statusContainer: {},
    loadingText: { fontSize: '1rem', fontWeight: '500', color: '#A37E2C', textAlign: 'center', width: '100%' },
    errorStatusTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#A37E2C', marginBottom: '0.4rem', textAlign: 'center', width: '100%' },
    errorText: { fontSize: '0.85rem', color: '#D32F2F', fontWeight: '500', textAlign: 'center', width: '100%', marginTop: '0.5rem' }
};

styles.statusContainer = {
    ...styles.card,
    minHeight: '130px', // Altura mínima para estados
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    flexDirection: 'column',
    borderLeft: 'none',
    padding: '1.5rem',
};

const TotalEjemplaresCard = ({
    data = { totalEjemplares: 0 },
    loading,
    error = null,
    customCardStyle = {}
}) => {
    if (loading) {
        return <div style={{...styles.statusContainer, ...customCardStyle}}><p style={styles.loadingText}>Cargando...</p></div>;
    }
    if (error) {
        return (
            <div style={{ ...styles.statusContainer, ...customCardStyle, backgroundColor: 'rgba(233, 196, 106, 0.02)' }}>
                <h3 style={styles.errorStatusTitle}>Total de Ejemplares</h3>
                <p style={styles.errorText}>{error}</p>
            </div>
        );
    }
    return (
        <div style={{...styles.card, ...customCardStyle}}>
            <div style={styles.iconWrapper}>
                <FaHorse style={styles.icon} />
            </div>
            <div style={styles.contentWrapper}>
                <h3 style={styles.cardTitle}>Total de Ejemplares</h3>
                <p style={styles.kpiValue}>{data?.totalEjemplares ?? '0'}</p>
                <div style={styles.kpiSeparatorLine}></div>
                <p style={styles.subtitle}>Registrados</p>
            </div>
        </div>
    );
};

TotalEjemplaresCard.propTypes = {
    data: PropTypes.shape({ totalEjemplares: PropTypes.number }),
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    customCardStyle: PropTypes.object,
};

export default TotalEjemplaresCard;