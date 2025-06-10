// src/components/Specimens/SpecimenCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, Badge, Button, ButtonGroup, Col } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye, faExchangeAlt, faEdit, faTrash,
    faHorseHead, faUser, faMapMarkerAlt, faTag
} from '@fortawesome/free-solid-svg-icons';
import './SpecimenCard.css';

const SpecimenCard = ({
    specimen,
    categories,
    // AQUÍ ES DONDE APLICAS LOS VALORES POR DEFECTO
    onEdit = () => {},        // Valor por defecto para onEdit
    onDelete = () => {},      // Valor por defecto para onDelete
    onMove = () => {},        // Valor por defecto para onMove
    onView = () => {},        // Valor por defecto para onView
    isReadOnlyView = false,   // Valor por defecto para isReadOnlyView
}) => {
    if (!specimen) return null;

    const specimenId = specimen.id || specimen._id;
    const clientName = specimen.propietario?.nombreCompleto || specimen.propietario?.nombre || 'N/A';
    const sedeName = specimen.sede?.NombreSede || 'N/A';

    const categoryIdStr = specimen.specimenCategoryId?.toString() || specimen.category?.id?.toString();
    const categoryObject = categories.find(cat => (cat.id || cat._id)?.toString() === categoryIdStr);
    const categoryName = categoryObject?.name || 'Sin Categoría';

    const handleActionClick = (e, action, ...args) => {
        e.stopPropagation();
        if (action) action(...args);
    };

    const handleCardClick = (e) => {
        if (isReadOnlyView) return;

        if (e.target.closest('button') || e.target.closest('.btn-group')) {
            return;
        }
        if (onView) onView(specimen);
    };

    return (
        <Col xs={12} className="mb-3 d-flex">
            <Card
                className="spec-card-final flex-fill"
                onClick={!isReadOnlyView ? handleCardClick : undefined}
                title={!isReadOnlyView ? `Ver detalles de ${specimen.name}` : `${specimen.name || 'Ejemplar'}`}
                style={isReadOnlyView ? { cursor: 'default' } : { cursor: 'pointer' }}
            >
                <CardBody className="spec-card-body">
                    <div className="spec-card-top-section">
                        <div className="spec-title-badge-group">
                            <h5 className="spec-card-title">{specimen.name || specimen.NombreEjemplar || 'Sin Nombre'}</h5>
                            <Badge className="spec-card-badge" pill>
                                ID: {specimenId} <FontAwesomeIcon icon={faHorseHead} size="xs" />
                            </Badge>
                        </div>
                        
                        {!isReadOnlyView && (
                            <ButtonGroup size="sm" className="spec-action-buttons ms-auto">
                                <Button
                                    color="link"
                                    className="action-btn-link specimen-view-btn"
                                    onClick={(e) => handleActionClick(e, onView, specimen)}
                                    title="Ver Detalles"
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                </Button>
                                {onMove && ( // Asegúrate de que onMove exista antes de intentar usarlo
                                    <Button
                                        color="link"
                                        className="action-btn-link specimen-move-btn"
                                        onClick={(e) => handleActionClick(e, onMove, specimen)}
                                        title="Mover Ejemplar"
                                    >
                                        <FontAwesomeIcon icon={faExchangeAlt} />
                                    </Button>
                                )}
                                <Button
                                    color="dark"
                                    onClick={(e) => handleActionClick(e, onEdit, specimen)}
                                    title="Editar Ejemplar"
                                    className="action-btn-filled"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                    color="danger"
                                    onClick={(e) => handleActionClick(e, onDelete, specimenId)}
                                    title="Eliminar Ejemplar"
                                    className="action-btn-filled"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </ButtonGroup>
                        )}
                    </div>

                    <div className="spec-details-info">
                        <p><FontAwesomeIcon icon={faTag} className="me-2" /><strong>Categoría:</strong> {categoryName}</p>
                        <p><FontAwesomeIcon icon={faUser} className="me-2" /><strong>Propietario:</strong> {clientName}</p>
                        {!isReadOnlyView && (
                            <p><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" /><strong>Sede:</strong> {sedeName}</p>
                        )}
                    </div>
                </CardBody>
            </Card>
        </Col>
    );
};

SpecimenCard.propTypes = {
    specimen: PropTypes.object.isRequired,
    categories: PropTypes.array.isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onMove: PropTypes.func,
    onView: PropTypes.func,
    isReadOnlyView: PropTypes.bool,
};


export default SpecimenCard;