// src/components/Servicios/ServiceCard.jsx
import React, { useMemo } from 'react';
import { Card, CardImg, CardBody, CardTitle, CardText, Button, ButtonGroup, Badge } from 'reactstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faToggleOn,
    faToggleOff,
    faSpinner
} from "@fortawesome/free-solid-svg-icons";
import './ServiceCard.css'; // Asegúrate que la ruta a tu CSS sea correcta

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ERROR_IMAGE_PLACEHOLDER = 'https://via.placeholder.com/500x350.png?text=Error+al+cargar';

const HARMONIOUS_PASTEL_COLORS = [
  // Amarillos Pastel '#FFF9C4', '#FFF59D', '#FFFACD', 
  '#FFECB3',
  // Azules Pastel
  '#E3F2FD', '#D1E6FA', '#BBDEFB', '#C5CAE9',
  // Verdes Pastel
  '#E8F5E9', '#DCEDC8', '#C8E6C9', '#A5D6A7',
  // Lilas/Púrpuras Pastel
  '#EDE7F6', '#D1C4E9', '#F3E5F5', '#E1BEE7',
  // Tonos neutros pastel adicionales
  '#F5F5F5', '#ECEFF1', '#FFE0B2', '#D7CCC8',
];

const getConsistentRandomColor = (seedString) => {
  if (!seedString) {
    return HARMONIOUS_PASTEL_COLORS[Math.floor(Math.random() * HARMONIOUS_PASTEL_COLORS.length)];
  }
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  const index = Math.abs(hash) % HARMONIOUS_PASTEL_COLORS.length;
  return HARMONIOUS_PASTEL_COLORS[index];
};


const ServiceCard = ({ service, onDelete, onEdit, onToggleStatus, isLoadingStatus = false }) => {
  if (!service) return null;

  const serviceId = service.id || service._id;
  const hasServiceImage = service.imagen && service.imagen.trim() !== '';
  
  let imageUrlToDisplay = null;
  if (hasServiceImage) {
     const imagePath = service.imagen.startsWith('/') ? service.imagen.substring(1) : service.imagen;
     imageUrlToDisplay = `${BACKEND_BASE_URL}/${imagePath}`;
  }

  const placeholderBackgroundColor = useMemo(() => {
    if (hasServiceImage) {
      return undefined; 
    }
    const seed = serviceId?.toString() || service.nombre || Math.random().toString();
    return getConsistentRandomColor(seed);
  }, [serviceId, service.nombre, hasServiceImage]);


  const isActive = service.status;

  return (
    <Card className={`shadow-sm service-card h-100 ${!isActive ? 'inactive-card' : ''}`}>
      <div className="service-card-img-container"> 
         <Badge
           color={isActive ? "success" : "danger"}
           pill
           className={`position-absolute top-0 ${isActive ? 'end-0' : 'start-0'} m-2`}
           style={{ zIndex: 2 }}
         >
           {isActive ? "Activo" : "Inactivo"}
         </Badge>

         {hasServiceImage && imageUrlToDisplay ? (
           <CardImg
               src={imageUrlToDisplay}
               alt={`Imagen de ${service.nombre || 'servicio'}`}
               className="service-card-img"
               onError={(e) => {
                   if (e.target.src !== ERROR_IMAGE_PLACEHOLDER) {
                       e.target.onerror = null; 
                       e.target.src = ERROR_IMAGE_PLACEHOLDER;
                   }
               }}
           />
         ) : (
           <div className="service-card-no-image-frame">
             <div 
                className="service-card-no-image-content"
                style={{ backgroundColor: placeholderBackgroundColor }}
             >
             </div>
           </div>
         )}
         
         <div className="service-card-img-overlay"></div>
      </div>

      <CardBody className="d-flex flex-column flex-grow-1 p-3">
        <CardTitle tag="h5" className="mb-2 service-card-title text-truncate" title={service.nombre || 'Servicio sin nombre'}>
            {service.nombre || 'Servicio sin nombre'}
        </CardTitle>

        <div className="service-card-description-wrapper mb-auto">
           <CardText tag="div" className="service-card-description text-truncate-multiline">
              {service.descripcion || 'Este servicio no cuenta con una descripción detallada.'}
           </CardText>
        </div>

        <div className="d-flex justify-content-end align-items-center mt-3 pt-2 border-top">
          <ButtonGroup size="sm">
             <Button
                color="dark"
                onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                title="Editar"
                disabled={isLoadingStatus}
             >
                <FontAwesomeIcon icon={faEdit} />
              </Button>

              <Button
                color={isActive ? "success" : "danger"}
                onClick={(e) => { e.stopPropagation(); onToggleStatus(serviceId); }}
                title={isActive ? "Desactivar" : "Activar"}
                className="ms-1"
                disabled={isLoadingStatus}
              >
                {isLoadingStatus ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={isActive ? faToggleOff : faToggleOn } />
                )}
              </Button>

              <Button
                color="danger"
                onClick={(e) => { e.stopPropagation(); onDelete(serviceId); }}
                title="Eliminar"
                className="ms-1"
                disabled={isLoadingStatus}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
          </ButtonGroup>
        </div>
      </CardBody>
    </Card>
  );
};

export default ServiceCard;