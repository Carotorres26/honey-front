// src/components/Categories/CategoryCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, Badge, Button, ButtonGroup, Spinner as StrapSpinner } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Iconos de Font Awesome - Solid Set
import {
    faHorseHead,
    faEdit,
    faToggleOn,
    faToggleOff,
    faTrash,         // <<<--- CAMBIADO A faTrash (igual que RolesTable)
    faSpinner,
    faFolder
} from '@fortawesome/free-solid-svg-icons';
import './CategoryCard.css';

const CategoryCard = ({
    category,
    specimenCount,
    onViewSpecimens,
    onEditCategory,
    onDeleteCategory,
    onToggleStatus,
    isLoadingStatus,
    className,
}) => {
    if (!category) return null;

    const categoryId = category.id || category._id;
    const isActive = category.estado === 'activo';

    const handleCardClick = (e) => {
        if (e.target.closest('button, .btn-group')) {
            return;
        }
        if (onViewSpecimens) {
            onViewSpecimens(categoryId);
        }
    };

    const stopPropagation = (e) => e.stopPropagation();

    return (
        <Card
            className={`category-card-final ${isActive ? 'active' : 'inactive'} ${className || ''}`}
            onClick={handleCardClick}
            title={isActive ? `Categoría activa: ${category.name}` : `Categoría inactiva: ${category.name}. Click para ver ejemplares.`}
        >
            <CardBody className="category-card-body">
                <div className="card-top-section">
                    <div>
                        <h5 className="category-card-title category-title-bright-yellow">{category.name || 'Sin Nombre'}</h5>
                        {/* Badge con nuevos estilos definidos en CSS */}
                        <Badge className="category-card-count-badge" pill>
                            {specimenCount} <FontAwesomeIcon icon={faHorseHead} size="xs" />
                        </Badge>
                    </div>
                </div>

                <div className="card-bottom-section">
                    <ButtonGroup size="sm" className="category-action-buttons">
                        <Button
                            color={isActive ? "success" : "danger"}
                            onClick={(e) => { stopPropagation(e); onToggleStatus(category); }}
                            title={isActive ? "Desactivar Categoría" : "Activar Categoría"}
                            className="me-1 btn-action btn-toggle"
                            disabled={isLoadingStatus}
                        >
                            {isLoadingStatus ? (
                                <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                                <FontAwesomeIcon icon={isActive ? faToggleOff : faToggleOn} />
                            )}
                        </Button>

                        <Button
                            color="dark"
                            onClick={(e) => { stopPropagation(e); onEditCategory(category); }}
                            title="Editar Nombre"
                            className="me-1 btn-action btn-edit"
                            disabled={isLoadingStatus}
                        >
                            <FontAwesomeIcon icon={faEdit} />
                        </Button>

                        <Button
                            color="danger"
                            onClick={(e) => { stopPropagation(e); onDeleteCategory(categoryId); }}
                            title="Eliminar Categoría"
                            className="btn-action btn-delete" // Sin me-1 al ser el último
                            disabled={isLoadingStatus}
                        >
                            {/* Usando faTrash ahora */}
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    </ButtonGroup>
                </div>
            </CardBody>
        </Card>
    );
};

// PropTypes se mantienen igual
CategoryCard.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        estado: PropTypes.string, // 'activo' o 'inactivo'
    }).isRequired,
    specimenCount: PropTypes.number.isRequired,
    onViewSpecimens: PropTypes.func.isRequired,
    onEditCategory: PropTypes.func.isRequired,
    onDeleteCategory: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func.isRequired,
    isLoadingStatus: PropTypes.bool,
    className: PropTypes.string,
};

export default CategoryCard;