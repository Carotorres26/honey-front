// src/components/PagoTable.jsx
import React from 'react';
import { Table, Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEye } from '@fortawesome/free-solid-svg-icons';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
    } catch (e) {
        console.error("Error formateando fecha:", dateString, e);
        return '-';
    }
};

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '-';
    return number.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getMonthName = (monthNumber) => {
    if (!monthNumber || monthNumber < 1 || monthNumber > 12) return '-';
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('es-ES', { month: 'long' });
};

const PagoTable = ({
    pagos = [],
    onEdit,
    onView,
}) => {

    if (!Array.isArray(pagos) || pagos.length === 0) {
        return null;
    }

    return (
        <div className="table-responsive">
            <Table className="table table-bordered table-hover align-middle" responsive size="sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID Pago</th>
                        <th>Contrato</th>
                        <th>Mes Pagado</th>
                        <th>Fecha Pago</th>
                        <th>Valor</th>
                        <th>Método</th>
                        <th className="text-center" style={{ width: '100px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pagos.map((pago) => {
                        if (!pago || !pago.id_pago) return null;

                        const pagoId = pago.id_pago;
                        const contractInfo = pago.contract
                            ? `#${pago.contract.id}${pago.contract.client ? ` (${pago.contract.client.nombre || 'N/A'})` : ''}`
                            : (pago.contractId ? `#${pago.contractId}` : 'N/A');

                        return (
                            <tr key={pagoId}>
                                <td>{pagoId}</td>
                                <td>{contractInfo}</td>
                                <td>{pago.mesPago || '-'}</td>
                                <td>{formatDate(pago.fechaPago)}</td>
                                <td>{formatCurrency(pago.valor)}</td>
                                <td>{pago.metodoPago ? pago.metodoPago.charAt(0).toUpperCase() + pago.metodoPago.slice(1) : '-'}</td>
                                <td className="text-center">
                                    <ButtonGroup size="sm">
                                        {typeof onView === 'function' && (
                                            <Button
                                                outline color="info"
                                                onClick={() => onView(pago)}
                                                title="Ver Detalles"
                                                style={{ border: 'none', padding: '0.25rem 0.5rem' }}
                                                className="me-1"
                                            >
                                                <FontAwesomeIcon icon={faEye} style={{ color: '#17a2b8' }}/>
                                            </Button>
                                        )}
                                        {typeof onEdit === 'function' && (
                                            <Button
                                                color="dark"
                                                onClick={() => onEdit(pago)}
                                                title="Editar Pago"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
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

export default PagoTable;