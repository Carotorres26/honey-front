// src/components/Contracts/ContractTable.jsx
import React from 'react';
import { Table, Button, ButtonGroup, Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';

// Helper para formatear fecha (asume UTC para evitar cambios de día)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
    } catch (e) {
        console.error("Error formateando fecha:", dateString, e);
        return '-';
    }
};

// Helper para formatear moneda (COP sin decimales)
const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '-';
    return number.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Componente funcional ContractTable
const ContractTable = ({
    contracts = [], // Array de contratos
    onEdit,         // Función para manejar clic en editar
    onDelete,       // Función para manejar clic en eliminar
    onView          // Función para manejar clic en ver (ojo)
}) => {

    // Si no hay contratos filtrados, no renderiza nada (la página mostrará el mensaje)
    if (!Array.isArray(contracts) || contracts.length === 0) {
        return null;
    }

    // Renderiza la tabla
    return (
        <div className="table-responsive">
            <Table className="table table-bordered table-hover align-middle" responsive size="sm">
                <thead className="table-dark">
                    {/* CORRECCIÓN: No dejar saltos de línea ni espacios entre <tr> y <th> */}
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha Inicio</th>
                        <th>Precio Mensual</th>
                        <th>Estado</th>
                        <th className="text-center" style={{width: '120px'}}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {contracts.map((contract) => {
                        // Validar cada objeto contrato
                        if (!contract) return null;

                        const contractId = contract.id || contract._id;
                        const estado = contract.estado || 'desconocido';
                        const isActive = estado === 'activo';

                        return (
                            // CORRECCIÓN: No dejar saltos de línea ni espacios entre <tr> y <td>
                            <tr key={contractId}>
                                <td>{contractId || '-'}</td>
                                <td>{contract.client?.nombre || 'N/A'}</td>
                                <td>{formatDate(contract.fechaInicio)}</td>
                                <td>{formatCurrency(contract.precioMensual)}</td>
                                <td>
                                    <Badge color={isActive ? "success" : "secondary"} pill>
                                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <ButtonGroup size="sm">
                                        {typeof onView === 'function' && (
                                            <Button
                                                outline color="info"
                                                onClick={() => onView(contract)}
                                                title="Ver Detalles"
                                                style={{ border:'none', padding: '0.25rem 0.5rem' }}
                                                className="me-1"
                                            >
                                                <FontAwesomeIcon icon={faEye} style={{ color: '#17a2b8' }}/>
                                            </Button>
                                        )}
                                        {typeof onEdit === 'function' && (
                                            <Button
                                                color="dark"
                                                onClick={() => onEdit(contract)}
                                                title="Editar"
                                                className="me-1"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </Button>
                                        )}
                                        {typeof onDelete === 'function' && (
                                            <Button
                                                color="danger"
                                                onClick={() => onDelete(contractId)}
                                                title="Eliminar"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        )}
                                    </ButtonGroup>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default ContractTable;