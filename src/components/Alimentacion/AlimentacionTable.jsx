// src/components/ControlEjemplar/AlimentacionTable.jsx
import React from 'react';
import { Table, Badge } from 'reactstrap';

// Helper simple para formato de fecha (puedes moverlo a utils)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return '-'; }
};

// Helper para color del badge (puedes moverlo a utils)
const getEstadoColor = (estado) => {
     switch (estado) {
        case 'Administrado': return 'success';
        case 'Cancelado': return 'danger';
        case 'Programado': default: return 'info';
     }
};

const AlimentacionTable = ({ data = [] }) => { // Default a array vacío
  if (!data || data.length === 0) {
    return <p className="text-muted fst-italic">No hay registros.</p>;
  }

  return (
    <Table striped bordered hover responsive size="sm" className="small"> {/* Tabla más pequeña */}
      <thead className='table-light'> {/* Cabecera clara */}
        <tr>
          <th>Fecha</th>
          <th>Alimento</th>
          <th>Cantidad</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={`alim-${item.id}`}> {/* Key única */}
            <td style={{whiteSpace: 'nowrap'}}>{formatDate(item.createdAt)}</td> {/* Evitar wrap */}
            <td>{item.nombreAlimento || '-'}</td>
            <td>{item.cantidad ?? '-'}</td>
            <td>
              <Badge color={getEstadoColor(item.estado)} pill className="text-dark">
                {item.estado || 'Programado'}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default AlimentacionTable;