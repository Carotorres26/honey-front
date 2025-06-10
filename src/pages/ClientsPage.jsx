// src/pages/ClientsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button, Modal, ModalHeader, ModalBody, Input, Spinner, Alert, Container,
  Row, Col, InputGroup, InputGroupText,
  Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import Swal from 'sweetalert2';
import ClientList from '../components/Clientes/ClientList.jsx';
import ClientForm from "../components/Clientes/ClientForm.jsx";
import { getAllClients, createClient, updateClient, deleteClient } from '../api/clientApi.js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faSearch, faAddressCard, // Icono para Clientes
    faChevronLeft, faChevronRight
} from "@fortawesome/free-solid-svg-icons";

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

const ITEMS_PER_PAGE = 10;
const ALERT_DURATION = 4000;

const ClientsPage = () => {
  const [allClients, setAllClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
  const [formApiError, setFormApiError] = useState(null);
  const [formFieldErrors, setFormFieldErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
    setGeneralAlert({ visible: true, message, type });
    const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearFormErrors = useCallback(() => {
    setFormApiError(null);
    setFormFieldErrors({});
  }, []);

  const processApiErrorForClientForm = useCallback((err) => {
    clearFormErrors();
    const defaultMessage = "Ocurrió un error inesperado.";
    if (!err) {
        setFormApiError(defaultMessage);
        return;
    }
    const responseData = err.response?.data;
    let messageToSet = defaultMessage;

    if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
        const fieldErrorsObj = {};
        let generalMessages = [];
        responseData.errors.forEach(e => {
            if (e.path) { 
                fieldErrorsObj[e.path] = e.msg;
            } else {
                generalMessages.push(e.msg);
            }
        });
        setFormFieldErrors(fieldErrorsObj);
        messageToSet = generalMessages.length > 0 ? generalMessages.join('; ') : "Por favor, corrija los errores indicados.";
    } else if (responseData?.message) {
        messageToSet = responseData.message;
    } else if (err.message) {
        messageToSet = err.message;
    }
    
    if (messageToSet.includes("Network Error")) messageToSet = "Error de conexión con el servidor.";
    if (messageToSet.includes("timeout")) messageToSet = "La solicitud tardó demasiado.";
    
    setFormApiError(messageToSet);
  }, [clearFormErrors]);

  const fetchClients = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setGeneralAlert({ visible: false, message: "", type: "" });
    try {
      const clientsData = await getAllClients();
      if (Array.isArray(clientsData)) {
        setAllClients(clientsData);
      } else {
        setAllClients([]);
      }
      setCurrentPage(1);
    } catch (err) {
      console.error("Error en fetchClients:", err);
      showAlert("danger", `Error al cargar clientes: ${err.response?.data?.message || err.message || "Error desconocido."}`);
      setAllClients([]);
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
      return allClients;
    }
    return allClients.filter(client =>
        client.nombre?.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.documento?.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.celular?.includes(lowerCaseSearchTerm)
      ).sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [searchTerm, allClients]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentTableData = useMemo(() => {
    return filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredClients, indexOfFirstItem, indexOfLastItem]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  }, [filteredClients.length]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0,0);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages >= 1) {
        setCurrentPage(1);
    }
  }, [filteredClients.length, currentPage]);

  const toggleEditModal = useCallback(() => {
    setEditModalOpen(prevState => {
        if (prevState) {
            setSelectedClient(null);
            clearFormErrors();
        }
        return !prevState
    });
    if(editModalOpen) setIsSaving(false);
  }, [editModalOpen, clearFormErrors]);

  const handleAddNew = () => {
    setSelectedClient(null);
    clearFormErrors();
    setEditModalOpen(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    clearFormErrors();
    setEditModalOpen(true);
  };

  const handleView = (client) => { // Mantener este o crear un ViewClientModal si se necesita más detalle
    Swal.fire({
        title: `<strong>Detalles de ${client.nombre}</strong>`,
        icon: 'info',
        html: `
            <b>ID:</b> ${client.id || client._id}<br>
            <b>Documento:</b> ${client.documento || 'N/A'}<br>
            <b>Email:</b> ${client.email || 'N/A'}<br>
            <b>Celular:</b> ${client.celular || 'N/A'}
        `,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonText: 'Cerrar'
    });
  };

  const handleSave = async (clientDataFromForm) => {
    setIsSaving(true);
    clearFormErrors();
    const clientId = selectedClient?.id || selectedClient?._id;
    const clientName = clientDataFromForm.nombre || (selectedClient?.nombre || "El cliente");

    try {
      let responseMessage = "";
      if (clientId) {
        await updateClient(clientId, clientDataFromForm);
        responseMessage = `Cliente '${clientName}' actualizado correctamente.`;
      } else {
        await createClient(clientDataFromForm);
        responseMessage = `Cliente '${clientName}' creado correctamente.`;
      }
      
      toggleEditModal();
      await fetchClients(false);
      showAlert("success", responseMessage);

    } catch (err) {
      console.error(`Error guardando cliente (ID: ${clientId || 'nuevo'}):`, err);
      processApiErrorForClientForm(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nombreCliente = "El cliente") => {
    if (!id) return;
    
    const result = await Swal.fire({
        title: 'Confirmar Eliminación',
        html: `¿Está seguro de eliminar al cliente "<b>${nombreCliente}</b>"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsProcessing(true);
      try {
        await deleteClient(id);
        await fetchClients(false);
        showAlert("info", `El cliente "${nombreCliente}" ha sido eliminado.`);
      } catch (err) {
        console.error(`Error eliminando cliente ID ${id}:`, err);
        showAlert("danger", `Error al eliminar: ${err.response?.data?.message || err.message || "Error desconocido."}`);
      } finally {
         setIsProcessing(false);
      }
    }
  };

  const renderPagination = () => {
    const actualTotalPages = totalPages;
    const currentPageNum = currentPage;
    // if (actualTotalPages <= 1) return null; // No renderizar si solo hay una página

    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage, endPage;

    if (actualTotalPages <= maxPageButtons) {
        startPage = 1;
        endPage = actualTotalPages;
    } else {
        let maxPagesBeforeCurrent = Math.floor(maxPageButtons / 2);
        let maxPagesAfterCurrent = Math.ceil(maxPageButtons / 2) - 1;
        if (currentPageNum <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPageButtons;
        } else if (currentPageNum + maxPagesAfterCurrent >= actualTotalPages) {
            startPage = actualTotalPages - maxPageButtons + 1;
            endPage = actualTotalPages;
        } else {
            startPage = currentPageNum - maxPagesBeforeCurrent;
            endPage = currentPageNum + maxPagesAfterCurrent;
        }
    }
    for (let i = startPage; i <= endPage; i++) { 
        if (i >=1 && i <= actualTotalPages) {
             pageNumbers.push(i);
        }
    }
    // No debería ser necesario este if si totalPages ya es Math.max(1,...)
    // if (pageNumbers.length === 0 && actualTotalPages === 1){ 
    //     pageNumbers.push(1);
    // }


    return (
      <Pagination 
        aria-label="Client pagination" 
        size="sm" 
        className="mt-4 custom-pagination"
        listClassName="justify-content-center"
      >
        <PaginationItem disabled={currentPageNum <= 1}>
          <PaginationLink onClick={() => handlePageChange(currentPageNum - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink>
        </PaginationItem>
        {startPage > 1 && (<><PaginationItem onClick={() => handlePageChange(1)}><PaginationLink>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}</>)}
        {pageNumbers.map(number => (<PaginationItem active={number === currentPageNum} key={`client-page-${number}`}><PaginationLink onClick={() => handlePageChange(number)}>{number}</PaginationLink></PaginationItem>))}
        {endPage < actualTotalPages && (<>{endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}<PaginationItem onClick={() => handlePageChange(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem></>)}
        <PaginationItem disabled={currentPageNum >= actualTotalPages}><PaginationLink onClick={() => handlePageChange(currentPageNum + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
      </Pagination>
    );
  };

  return (
    <Container fluid className="clients-page-container mt-4 mb-4">
      <style>{paginationCustomCss}</style>

        {/* START: New Dashboard-like Header for Clientes */}
        <Row className="mb-2">
            <Col className="text-center">
                <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                    <FontAwesomeIcon icon={faAddressCard} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                    Clientes
                </h2>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col>
                <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
            </Col>
        </Row>

        {!(isLoading || isProcessing) && ( // Conditionally render controls section
             <Row className="mb-3 align-items-center">
                <Col md="6" className="d-none d-md-block"> {/* Empty spacer for layout */}
                </Col>
                <Col xs="12" md="6">
                    <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                        <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                            <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                            <Input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                bsSize="sm"
                                aria-label="Buscar clientes"
                            />
                        </InputGroup>
                        <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0">
                            <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Cliente
                        </Button>
                    </div>
                </Col>
            </Row>
        )}
        {/* END: New Dashboard-like Header for Clientes */}
      
      {generalAlert.visible && (
        <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mb-3">
          {generalAlert.message}
        </Alert>
      )}

      {/* Removed old header row */}

      {(isLoading || isProcessing) && !isSaving && (
        <div className="text-center p-5">
          <Spinner style={{ width: '3rem', height: '3rem' }} color="primary" />
           <p className="mt-2 text-muted">{isProcessing ? 'Procesando...' : 'Cargando clientes...'}</p>
        </div>
      )}

      {!isLoading && !isProcessing && (
        <>
          {currentTableData.length > 0 ? (
            <ClientList
                clients={currentTableData}
                onEdit={handleEdit}
                onDelete={(id, name) => handleDelete(id, name)}
                onView={handleView}
            />
          ) : (
             <Alert color="info" className="text-center mt-3" fade={false}>
                {searchTerm
                  ? "No se encontraron clientes que coincidan con la búsqueda."
                  : (allClients.length === 0 ? "Aún no hay clientes registrados." : "No hay clientes para mostrar.")
                }
             </Alert>
          )}
          
          {renderPagination()}
        </>
      )}

      {editModalOpen && (
          <Modal
            isOpen={editModalOpen}
            toggle={!isSaving ? toggleEditModal : undefined}
            backdrop="static"
            size="lg"
            centered
            onClosed={() => {
                setSelectedClient(null);
                clearFormErrors();
            }}
          >
            <ModalHeader toggle={!isSaving ? toggleEditModal : undefined} closeAriaLabel="Cerrar">
              {selectedClient ? `Editar Cliente: ${selectedClient.nombre}` : "Agregar Nuevo Cliente"}
            </ModalHeader>
            <ModalBody>
              {formApiError && (
                <Alert color="danger" isOpen={!!formApiError} toggle={() => setFormApiError(null)} className="mb-3">
                    {formApiError}
                </Alert>
              )}
              <ClientForm
                onSubmit={handleSave}
                initialData={selectedClient}
                onCancel={toggleEditModal}
                fieldErrors={formFieldErrors}
                isSaving={isSaving}
                key={selectedClient?.id || selectedClient?._id || 'new-client-form'}
              />
            </ModalBody>
          </Modal>
      )}
    </Container>
  );
};

export default ClientsPage;