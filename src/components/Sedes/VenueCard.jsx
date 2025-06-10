// src/components/Sedes/VenueCard.jsx
import React from 'react';
import { Card, CardBody, CardTitle, Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './VenueCard.css'; // Importamos el CSS que definiremos a continuación

const VenueCard = ({ venue, onViewEjemplares, onEdit, onDelete }) => {
  if (!venue) {
    return null; // O algún placeholder de carga/error si es preferible
  }

  const handleEditClick = (e) => {
    e.stopPropagation(); // Evita que el click en el botón también active el click de la tarjeta
    onEdit(venue);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Evita que el click en el botón también active el click de la tarjeta
    onDelete(venue.id);
  };

  const handleCardClick = () => {
    onViewEjemplares(venue.id);
  };

  return (
    <Card
      className="venue-card-styled h-100" // h-100 para ayudar a igualar alturas si están en una fila
      onClick={handleCardClick}
      title={`Ver ejemplares de ${venue.NombreSede || 'Sede Desconocida'}`}
    >
      <CardBody> {/* El CSS se encargará del flex-grow y min-height implícito */}
        <div className="venue-content-wrapper"> {/* El CSS se encargará del flex-grow y alineación */}
          <div className="venue-info">
            <CardTitle tag="h5" className="venue-title">
              {venue.NombreSede || 'Nombre no disponible'}
            </CardTitle>
            {/* Aquí podrías añadir más información de la sede si fuera necesario, ej:
            {venue.Direccion && <p className="text-muted small mt-1 mb-0">{venue.Direccion}</p>}
            */}
          </div>

          <div className="venue-actions d-flex flex-column justify-content-end">
            {/* Este div anidado ayuda a mantener los botones en línea (row)
                mientras todo el bloque de venue-actions se alinea al final (bottom) */}
            <div>
              <Button
                size="sm"
                className="me-1 action-button btn-edit"
                onClick={handleEditClick}
                title="Editar Sede"
                aria-label={`Editar ${venue.NombreSede || 'Sede Desconocida'}`}
              >
                <FontAwesomeIcon icon={faEdit} />
              </Button>
              <Button
                size="sm"
                className="action-button btn-delete"
                onClick={handleDeleteClick}
                title="Eliminar Sede"
                aria-label={`Eliminar ${venue.NombreSede || 'Sede Desconocida'}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default VenueCard;