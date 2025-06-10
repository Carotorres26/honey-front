// src/pages/ServicesPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Button, Input, Spinner, Alert,
  Modal, ModalHeader, ModalBody, InputGroup, InputGroupText,
  Pagination, PaginationItem, PaginationLink
} from 'reactstrap';
import Swal from 'sweetalert2';
import {
  getAllServices, deleteService, updateService, createService, toggleServiceStatus
} from '../api/servicesApi'; // Ajusta la ruta si es necesario
import ServiceCard from '../components/Servicios/ServiceCard'; // Ajusta la ruta si es necesario
import ServiceForm from '../components/Servicios/ServiceForm'; // Ajusta la ruta si es necesario
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, faSearch, faCogs,
    faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// Estilo para el paginador amarillo
const paginationCustomCss = `
  .custom-pagination .page-item .page-link {
    border-radius: 50% !important; width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    padding: 0; margin: 0 3px; font-size: 0.9rem;
    color: #495057; background-color: #e9ecef; border: 1px solid #ced4da;
    transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out;
  }
  .custom-pagination .page-item .page-link:hover {
    background-color: #dee2e6; border-color: #adb5bd; color: #212529; text-decoration: none;
  }
  .custom-pagination .page-item.active .page-link {
    background-color:rgb(245, 213, 117) !important; border-color: #e0a800 !important;
    color: #212529 !important; font-weight: bold; z-index: 2;
  }
  .custom-pagination .page-item.active .page-link:hover,
  .custom-pagination .page-item.active .page-link:focus {
    background-color:rgb(236, 211, 134) !important; border-color: #c69500 !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.5);
  }
  .custom-pagination .page-item.disabled .page-link {
    color: #6c757d; background-color: #f8f9fa; border-color: #dee2e6; pointer-events: none;
  }
  .custom-pagination .page-item.disabled .page-link:not([aria-label="Anterior"]):not([aria-label="Siguiente"]) {
    background-color: transparent !important;
    border-color: transparent !important;
    color: #6c757d;
  }
`;

const ITEMS_PER_PAGE = 3; 
const ALERT_DURATION = 4000;

const ServicesPage = () => {
  const [servicesData, setServicesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
  
  const [modalApiError, setModalApiError] = useState(null); 
  const [modalFieldErrors, setModalFieldErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [statusLoadingStates, setStatusLoadingStates] = useState({});

  const [currentPage, setCurrentPage] = useState(1);

  const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
    setGeneralAlert({ visible: true, message, type });
    const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearModalErrors = useCallback(() => {
    setModalApiError(null);
    setModalFieldErrors({});
  }, []);

  const processApiErrorForModal = useCallback((err) => {
    clearModalErrors();
    const responseData = err.response?.data;
    if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
        const fieldErrorsObj = {};
        let generalMessages = [];
        responseData.errors.forEach(valErr => {
            if (valErr.path) { 
                fieldErrorsObj[valErr.path] = valErr.msg;
            } else {
                generalMessages.push(valErr.msg);
            }
        });
        setModalFieldErrors(fieldErrorsObj);
        setModalApiError(generalMessages.length > 0 ? generalMessages.join('; ') : "Por favor, corrija los errores en el formulario.");
    } else {
        setModalApiError(responseData?.message || err.message || "Ocurrió un error inesperado al guardar el servicio.");
    }
  }, [clearModalErrors]);

  const fetchServices = useCallback(async (showInactive = true) => {
    setIsLoading(true);
    setGeneralAlert({ visible: false, message: "", type: "" });
    setStatusLoadingStates({});
    try {
      const data = await getAllServices(showInactive);
      if(Array.isArray(data)) {
          setServicesData(data);
      } else {
          setServicesData([]);
          showAlert("danger", "La respuesta de la API de servicios no es válida.");
      }
      setCurrentPage(1);
    } catch (err) {
      console.error("fetchServices error:", err);
      showAlert("danger", err.response?.data?.message || err.message || "Error al cargar servicios.");
      setServicesData([]);
    } finally {
        setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchServices(true);
  }, [fetchServices]);

  const toggleModal = useCallback(() => {
      if (modalOpen) {
          setSelectedService(null);
          clearModalErrors();
      }
      setModalOpen(prev => !prev);
  }, [modalOpen, clearModalErrors]);

  const handleAddNew = () => {
      setSelectedService(null);
      clearModalErrors();
      setModalOpen(true);
  };

  const handleEdit = (service) => {
      setSelectedService(service);
      clearModalErrors();
      setModalOpen(true);
  };

   const handleDelete = async (id) => {
       const serviceToDelete = servicesData.find(s => (s.id || s._id) === id);
       const result = await Swal.fire({
            title: '¿Eliminar Servicio?',
            text: `¿Seguro que quieres eliminar el servicio "${serviceToDelete?.nombre || id}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
          setIsLoading(true); 
          try {
              await deleteService(id);
              await fetchServices(true); 
              showAlert('info', 'El servicio ha sido eliminado.');
          } catch (err) {
              console.error('Error deleting service:', err);
              showAlert('danger', err.response?.data?.message || err.message || "No se pudo eliminar el servicio.");
          } finally {
              setIsLoading(false);
          }
      }
  };

   const handleSaveService = async (formDataFromForm) => {
       setIsSaving(true);
       clearModalErrors();
       const serviceIdToUpdate = selectedService?.id || selectedService?._id;

       try {
           let responseMessage = "";
           if (serviceIdToUpdate) {
               await updateService(serviceIdToUpdate, formDataFromForm);
               responseMessage = 'Servicio actualizado exitosamente.';
           } else {
               await createService(formDataFromForm);
               responseMessage = 'Servicio creado exitosamente.';
           }
           toggleModal();
           await fetchServices(true); 
           showAlert('success', responseMessage);
       } catch (err) {
           console.error('Error saving service:', err);
           processApiErrorForModal(err);
       } finally {
           setIsSaving(false);
       }
   };

  const handleToggleStatus = async (serviceId) => {
      const service = servicesData.find(s => (s.id || s._id) === serviceId);
      if(!service) {
          showAlert("warning", 'Servicio no encontrado.');
          return;
      }
      const serviceName = service.nombre || `ID ${serviceId}`;
      const currentStatus = service.status;
      const actionText = currentStatus ? "desactivar" : "activar";
      const newStatusValue = !currentStatus;

      const result = await Swal.fire({
          title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          text: `¿Seguro que deseas ${actionText} el servicio "${serviceName}"?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: newStatusValue ? '#28a745' : '#ffc107',
          cancelButtonColor: '#6c757d',
          confirmButtonText: `Sí, ${actionText}`,
          cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      setStatusLoadingStates(prev => ({ ...prev, [serviceId]: true }));
      setGeneralAlert({ visible: false, message: "", type: "" });

      try {
          const updatedService = await toggleServiceStatus(serviceId, newStatusValue); 
          setServicesData(prevServices =>
              prevServices.map(s =>
                  (s.id || s._id) === serviceId ? { ...s, status: updatedService.status } : s
              )
          );
          showAlert("success", `El servicio "${updatedService.nombre}" ha sido ${updatedService.status ? 'activado' : 'desactivado'}.`);
      } catch (err) {
           console.error(`Error toggling status for service ID ${serviceId}:`, err);
           showAlert("danger", err.response?.data?.message || err.message || "No se pudo cambiar el estado.");
      } finally {
         setStatusLoadingStates(prev => ({ ...prev, [serviceId]: false }));
      }
  };

  const filteredServices = useMemo(() => servicesData.filter(service =>
      service.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (service.status ? 'activo' : 'inactivo').includes(searchTerm.toLowerCase())
  ), [servicesData, searchTerm]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentServiceCards = useMemo(() => 
    filteredServices.slice(indexOfFirstItem, indexOfLastItem),
    [filteredServices, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE)),
    [filteredServices.length]
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0,0);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages > 0) { 
        setCurrentPage(1);
    }
  }, [searchTerm, filteredServices.length, currentPage]);


  const renderPagination = () => {
    const actualTotalPages = totalPages; 
    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage, endPage;

    if (actualTotalPages <= maxPageButtons) {
        startPage = 1;
        endPage = actualTotalPages;
    } else {
        let maxPagesBeforeCurrent = Math.floor(maxPageButtons / 2);
        let maxPagesAfterCurrent = Math.ceil(maxPageButtons / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPageButtons;
        } else if (currentPage + maxPagesAfterCurrent >= actualTotalPages) {
            startPage = actualTotalPages - maxPageButtons + 1;
            endPage = actualTotalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }

    return (
      <Pagination aria-label="Services pagination" size="sm" listClassName="justify-content-center" className="justify-content-center mt-4 custom-pagination">
        <PaginationItem disabled={currentPage <= 1}>
          <PaginationLink onClick={() => handlePageChange(currentPage - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink>
        </PaginationItem>
        {startPage > 1 && (<><PaginationItem onClick={() => handlePageChange(1)}><PaginationLink>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}</>)}
        {pageNumbers.map(number => (<PaginationItem active={number === currentPage} key={number}><PaginationLink onClick={() => handlePageChange(number)}>{number}</PaginationLink></PaginationItem>))}
        {endPage < actualTotalPages && (<>{endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}<PaginationItem onClick={() => handlePageChange(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem></>)}
        <PaginationItem disabled={currentPage >= actualTotalPages}><PaginationLink onClick={() => handlePageChange(currentPage + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
      </Pagination>
    );
  };

  return (
    <Container fluid className="mt-4 mb-4">
        <style>{paginationCustomCss}</style>

        <Row className="mb-2">
            <Col className="text-center">
                <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                    <FontAwesomeIcon icon={faCogs} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                    Servicios
                </h2>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col>
                <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
            </Col>
        </Row>

        {!isLoading && (
             <Row className="mb-3 align-items-center">
                <Col md="6" className="d-none d-md-block">
                </Col>
                <Col xs="12" md="6">
                    <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                        <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                            <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                           <Input
                              type="text"
                              placeholder="Buscar servicio..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              bsSize="sm"
                              aria-label="Buscar servicios"
                           />
                        </InputGroup>
                        <Button color="success" size="sm" onClick={handleAddNew}>
                           <FontAwesomeIcon icon={faPlus} className="me-1"/> Añadir Servicio
                        </Button>
                    </div>
                </Col>
            </Row>
        )}

       {generalAlert.visible && (
            <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mt-3">
                {generalAlert.message}
            </Alert>
       )}

        {isLoading && servicesData.length === 0 && (
          <div className="text-center p-4">
            <Spinner style={{ width: '3rem', height: '3rem' }}>Cargando...</Spinner>
            <p className="mt-2">Cargando servicios...</p>
          </div>
        )}

        {!isLoading && (
            <Row className="g-3 justify-content-center"> {/* ALINEACIÓN A LA IZQUIERDA */}
                {currentServiceCards.length > 0 ? (
                    currentServiceCards.map(service => (
                        <Col xs="12" sm="6" md="4" lg="3" xl="3" key={service.id || service._id} className="d-flex align-items-stretch">
                            <ServiceCard
                                service={service}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onToggleStatus={() => handleToggleStatus(service.id || service._id)}
                                isLoadingStatus={statusLoadingStates[service.id || service._id]}
                            />
                        </Col>
                    ))
                ) : null }
            </Row>
        )}
        
        {!isLoading && renderPagination()} {/* PAGINADOR SIEMPRE VISIBLE */}

        {!isLoading && filteredServices.length === 0 && (
             <Alert color="info" className="text-center mt-4" fade={false}>
                {searchTerm
                  ? "No se encontraron servicios que coincidan con su búsqueda."
                  : (servicesData.length === 0 ? "Aún no hay servicios registrados." : "No hay servicios para mostrar.")
                }
             </Alert>
        )}


         <Modal 
            isOpen={modalOpen} 
            toggle={!isSaving ? toggleModal : undefined}
            size="lg"
            backdrop="static" 
            centered
            onClosed={() => {
                setSelectedService(null);
                clearModalErrors();
            }}
          >
             <ModalHeader toggle={!isSaving ? toggleModal : undefined}>
                 {selectedService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}
             </ModalHeader>
             <ModalBody>
                 <ServiceForm
                     initialData={selectedService}
                     onSubmit={handleSaveService}
                     onCancel={toggleModal}
                     apiError={modalApiError}
                     isSaving={isSaving}
                     fieldErrors={modalFieldErrors}
                     key={selectedService?.id || selectedService?._id || 'new-service-form'}
                 />
             </ModalBody>
         </Modal>
    </Container>
  );
};

export default ServicesPage;