import React from 'react';
import { Table, Badge } from 'reactstrap';

// Helpers (puedes moverlos a utils)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return '-'; }
};
const formatTime = (timeString) => {
    if (!timeString) return '-';
    return String(timeString).substring(0, 5); // HH:MM
};
const getEstadoColor = (estado) => {
     switch (estado) {
        case 'Administrado': return 'success';
        case 'Cancelado': return 'danger';
        case 'Programado': default: return 'info';
     }
};

const MedicineTable = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <p className="text-muted fst-italic">No hay registros.</p>;
  }

  return (
    <Table striped bordered hover responsive size="sm" className="small">
      <thead className='table-light'>
        <tr>
          <th>Fecha</th>
          <th>Medicina</th>
          <th>Dosis</th>
          <th>Hora</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={`med-${item.id}`}>
            <td style={{whiteSpace: 'nowrap'}}>{formatDate(item.createdAt)}</td>
            <td>{item.nombre || '-'}</td>
            <td>{item.dosis || '-'}</td>
            <td>{formatTime(item.horaAdministracion)}</td>
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

export default MedicineTable;