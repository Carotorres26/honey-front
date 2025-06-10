// src/components/ControlEjemplar/VacunacionTable.jsx
import React from 'react';
import { Table } from 'reactstrap'; // Solo necesitamos Table aquí

// Helper simple para formato de fecha (puedes moverlo a utils si lo usas en varios sitios)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        // new Date() puede interpretar mal DATEONLY si no se maneja UTC
        // Una forma más segura es añadir tiempo neutro si solo viene YYYY-MM-DD
        const date = new Date(dateString + 'T00:00:00'); // Añadir tiempo para evitar problemas de zona horaria
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString(); // Formato local corto (ej: 19/4/2025)
        }
        return '-';
    }
    catch(e) {
        console.error("Error formateando fecha de vacunación:", e);
        return '-';
     }
};

const VacunacionTable = ({ data = [] }) => { // Default a array vacío
  if (!data || data.length === 0) {
    return <p className="text-muted fst-italic">No hay registros.</p>;
  }

  return (
    <Table striped bordered hover responsive size="sm" className="small">
      <thead className='table-light'>
        <tr>
          {/* --- ORDEN CORREGIDO DE COLUMNAS --- */}
          <th>Vacuna</th>
          <th>Fecha Adm.</th>
          {/* Añade más columnas si las necesitas y las tienes en tus datos */}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={`vac-${item.id}`}>
            {/* --- CELDAS EN ORDEN CORRECTO --- */}
            {/* Celda para el Nombre de la Vacuna */}
            <td>{item.nombreVacuna || '-'}</td>
            {/* Celda para la Fecha de Administración */}
            <td style={{whiteSpace: 'nowrap'}}>{formatDate(item.fechaAdministracion)}</td>
            {/* ... otras celdas si las añades ... */}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default VacunacionTable;