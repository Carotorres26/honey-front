// src/pages/AlimentacionPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, Input, Alert, Modal, ModalHeader, ModalBody,
  InputGroup, ButtonGroup, Spinner, Badge, InputGroupText,
  Pagination, PaginationItem, PaginationLink,
  Container, Row, Col
} from "reactstrap";
import Swal from 'sweetalert2';
import {
  faEdit, faTrash, faPlus, faSearch, faSyncAlt,
  faChevronLeft, faChevronRight,
  faCarrot // Changed to faCarrot
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AlimentacionForm from "../components/Alimentacion/AlimentacionForm";
import AlimentacionEstadoModal from "../components/Alimentacion/AlimentacionEstadoModal";
import {
  getAllAlimentaciones, createAlimentacion, updateAlimentacion,
  deleteAlimentacion, updateAlimentacionEstado
} from "../api/alimentacionApi";
import { getAllSpecimens } from "../api/specimenApi";

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

const ALERT_FADE_TIMEOUT = 4000;
const INITIAL_FORM_DATA = {
  id: null, nombreAlimento: "", cantidad: '', specimenId: '', estado: 'Programado'
};
const ITEMS_PER_PAGE = 10;

const AlimentacionPage = () => {
  const [alimentaciones, setAlimentaciones] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [pageAlertInfo, setPageAlertInfo] = useState({ type: "", message: "", visible: false });
  const [specimens, setSpecimens] = useState([]);
  const [loadingSpecimens, setLoadingSpecimens] = useState(false);

  const [formModalIsOpen, setFormModalIsOpen] = useState(false);
  const [formModalApiError, setFormModalApiError] = useState(null);
  const [formModalFieldErrors, setFormModalFieldErrors] = useState({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [estadoModalIsOpen, setEstadoModalIsOpen] = useState(false);
  const [selectedAlimentacionForEstado, setSelectedAlimentacionForEstado] = useState(null);
  const [estadoModalApiError, setEstadoModalApiError] = useState(null);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);

  const [loadingData, setLoadingData] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const showPageAlert = useCallback((type, message, duration = ALERT_FADE_TIMEOUT) => {
    setPageAlertInfo({ type, message, visible: true });
    const timer = setTimeout(() => { setPageAlertInfo({ type: "", message: "", visible: false }); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearFormModalErrors = useCallback(() => {
    setFormModalApiError(null);
    setFormModalFieldErrors({});
  }, []);
  const clearEstadoModalError = useCallback(() => setEstadoModalApiError(null), []);

  const processApiErrorForFormModal = useCallback((err) => {
    clearFormModalErrors();
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
        setFormModalFieldErrors(fieldErrorsObj);
        setFormModalApiError(generalMessages.length > 0 ? generalMessages.join('; ') : "Por favor, corrija los errores en el formulario.");
    } else {
        setFormModalApiError(responseData?.message || err.message || "Ocurrió un error inesperado.");
    }
  }, [clearFormModalErrors]);


  const fetchAlimentaciones = useCallback(async () => {
    setLoadingData(true);
    setPageAlertInfo({ message: "", type: "", visible: false });
    try {
      const data = await getAllAlimentaciones();
      setAlimentaciones(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching alimentaciones:", error);
      showPageAlert("danger", error?.response?.data?.message || error?.message || "Error al cargar registros de alimentación.");
      setAlimentaciones([]);
    } finally {
        setLoadingData(false);
    }
  }, [showPageAlert]);

  const fetchSpecimens = useCallback(async () => {
    setLoadingSpecimens(true);
    try {
      const specimenData = await getAllSpecimens();
      setSpecimens(Array.isArray(specimenData) ? specimenData : []);
    } catch (error) {
      console.error("Error fetching specimens:", error);
      showPageAlert("warning", error?.response?.data?.message || error?.message || "No se pudieron cargar especímenes.");
      setSpecimens([]);
    } finally {
      setLoadingSpecimens(false);
    }
  }, [showPageAlert]);

  useEffect(() => {
    fetchAlimentaciones();
    fetchSpecimens();
  }, [fetchAlimentaciones, fetchSpecimens]);

  const resetMainFormAndModalAlert = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setEditing(false);
    clearFormModalErrors();
  }, [clearFormModalErrors]);

  const toggleMainFormModal = useCallback(() => {
    if (formModalIsOpen) {
        resetMainFormAndModalAlert();
    }
    setFormModalIsOpen(current => !current);
  }, [formModalIsOpen, resetMainFormAndModalAlert]);

  const toggleEstadoModal = useCallback(() => {
    if (estadoModalIsOpen) {
        setSelectedAlimentacionForEstado(null);
        clearEstadoModalError();
    }
    setEstadoModalIsOpen(prev => !prev);
  }, [estadoModalIsOpen, clearEstadoModalError]);

  const openEstadoModal = useCallback((alimentacionRecord) => {
    setSelectedAlimentacionForEstado(alimentacionRecord);
    clearEstadoModalError();
    setEstadoModalIsOpen(true);
  }, [clearEstadoModalError]);

  const handleEstadoSubmit = async (id, nuevoEstado) => {
    if (!selectedAlimentacionForEstado || selectedAlimentacionForEstado.id !== id) return;

    setIsUpdatingEstado(true);
    clearEstadoModalError();
    try {
        const updatedRecord = await updateAlimentacionEstado(id, nuevoEstado);
        setAlimentaciones(prev => prev.map(item =>
            item.id === id ? { ...item, ...updatedRecord } : item
        ));
        showPageAlert("success", `Estado de "${updatedRecord.nombreAlimento || 'alimentación'}" actualizado a ${nuevoEstado}.`);
        toggleEstadoModal();
    } catch (error) {
        console.error(`Error updating state for alimentacion ${id}:`, error);
        const errorMsg = error?.response?.data?.message || error?.message || "Error al actualizar estado.";
        setEstadoModalApiError(errorMsg);
    } finally {
        setIsUpdatingEstado(false);
    }
  };

  const handleMainFormInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formModalApiError) setFormModalApiError(null);
    if (formModalFieldErrors[name]) {
        setFormModalFieldErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
  }, [formModalApiError, formModalFieldErrors]);

  const handleMainFormSubmit = async () => {
     setIsSubmittingForm(true);
     clearFormModalErrors();

    const dataToSend = {
      nombreAlimento: formData.nombreAlimento.trim(),
      cantidad: parseInt(formData.cantidad, 10),
      estado: formData.estado,
    };

    if (!editing) {
        dataToSend.specimenId = parseInt(formData.specimenId, 10);
    }

    if (!dataToSend.nombreAlimento || isNaN(dataToSend.cantidad) || dataToSend.cantidad <= 0) {
        processApiErrorForFormModal({ response: { data: { message: "Nombre del alimento y cantidad válida son requeridos." }}});
        setIsSubmittingForm(false);
        return;
    }
    if (!editing && (isNaN(dataToSend.specimenId) || !dataToSend.specimenId)) { // Check if specimenId is valid
        processApiErrorForFormModal({ response: { data: { message: "Debe seleccionar un espécimen." }}});
        setIsSubmittingForm(false);
        return;
    }


    try {
      let successMessage = "";
      if (editing && formData.id) {
        await updateAlimentacion(formData.id, dataToSend);
        successMessage = "Registro actualizado exitosamente.";
      } else {
        await createAlimentacion(dataToSend);
        successMessage = "Registro agregado exitosamente.";
      }
      await fetchAlimentaciones();
      showPageAlert("success", successMessage);
      toggleMainFormModal();
    } catch (error) {
      console.error("Error saving alimentacion:", error);
      processApiErrorForFormModal(error);
    } finally {
        setIsSubmittingForm(false);
    }
  };

  const handleMainFormCancel = () => { toggleMainFormModal(); };

  const handleAddNew = useCallback(() => {
    resetMainFormAndModalAlert();
    setEditing(false);
    setFormData(INITIAL_FORM_DATA);
    setFormModalIsOpen(true);
  }, [resetMainFormAndModalAlert]);

  const handleEdit = useCallback((alimentacion) => {
    resetMainFormAndModalAlert();
    setFormData({
      id: alimentacion.id,
      nombreAlimento: alimentacion.nombreAlimento || '',
      cantidad: alimentacion.cantidad?.toString() ?? '',
      specimenId: alimentacion.specimen?.id?.toString() || alimentacion.specimenId?.toString() || '',
      estado: alimentacion.estado || INITIAL_FORM_DATA.estado,
    });
    setEditing(true);
    setFormModalIsOpen(true);
  }, [resetMainFormAndModalAlert]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar Registro?',
        text: "¿Está seguro de que desea eliminar este registro de alimentación?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await deleteAlimentacion(id);
        showPageAlert("info", "Registro eliminado.");
        await fetchAlimentaciones();
      } catch (error) {
        console.error("Error deleting alimentacion:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "Error al eliminar.";
        showPageAlert("danger", errorMsg);
      }
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
        case 'Administrado': return 'success';
        case 'Cancelado': return 'danger';
        case 'Programado': default: return 'info';
    }
  };

  const filteredAlimentaciones = useMemo(() => {
      const searchTermLower = search.toLowerCase().trim();
      if (!searchTermLower) return alimentaciones;
      return alimentaciones.filter((item) => {
          const estadoActual = (item.estado || 'Programado').toLowerCase();
          return (
              item.nombreAlimento?.toLowerCase().includes(searchTermLower) ||
              item.specimen?.name?.toLowerCase().includes(searchTermLower) ||
              estadoActual.includes(searchTermLower) ||
              String(item.cantidad).includes(searchTermLower)
          );
      });
  }, [search, alimentaciones]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentAlimentacionItems = useMemo(() =>
    filteredAlimentaciones.slice(indexOfFirstItem, indexOfLastItem),
    [filteredAlimentaciones, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.max(1, Math.ceil(filteredAlimentaciones.length / ITEMS_PER_PAGE));

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0,0);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredAlimentaciones.length / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages > 0) {
        setCurrentPage(1);
    }
  }, [search, filteredAlimentaciones.length, ITEMS_PER_PAGE, currentPage]);

  const renderPagination = () => {
    if (alimentaciones.length === 0 && !search && !loadingData) return null;
    // if (totalPages <= 1) return null;

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
      <Pagination
        aria-label="Alimentacion pagination"
        size="sm"
        className="mt-4 custom-pagination"
        listClassName="justify-content-center"
      >
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

  const formatDateForDisplay = (dateString) => {
     if (!dateString) return "-";
      try {
         const dateObj = new Date(dateString);
         if (!isNaN(dateObj.getTime())) return dateObj.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
         return "-";
      } catch (e) { return "-"; }
  };

  return (
    <Container fluid className="mt-4">

      {/* START: New Dashboard-like Header for Alimentación */}
      <Row className="mb-2">
          <Col className="text-center">
              <h2 
                  className="mb-0 d-inline-flex align-items-center" 
                  style={{ 
                      fontWeight: 500, 
                      fontSize: '1.75rem', 
                      color: '#343a40' 
                  }}
              >
                  <FontAwesomeIcon 
                      icon={faCarrot} // Changed to faCarrot
                      size="lg" 
                      className="me-3" 
                      style={{ color: '#80B0AA' }} // Success green color
                  />
                  Alimentación
              </h2>
          </Col>
      </Row>
      <Row className="mb-4">
          <Col>
              <hr 
                  className="mt-0" 
                  style={{ 
                      borderTop: '1px solid #ced4da',
                      opacity: 0 
                  }}
              />
          </Col>
      </Row>
      {/* END: New Dashboard-like Header for Alimentación */}

      <style>{paginationCustomCss}</style>
      {pageAlertInfo.visible && (
        <Alert color={pageAlertInfo.type} isOpen={pageAlertInfo.visible} toggle={() => setPageAlertInfo({ ...pageAlertInfo, visible: false })} fade={false} className="mt-3">
          {pageAlertInfo.message}
        </Alert>
      )}

      <div className="d-flex justify-content-end mb-3">
          <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
              <InputGroup size="sm" className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '220px', maxWidth: '300px' }}>
                   <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                   <Input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} bsSize="sm" disabled={loadingData}/>
              </InputGroup>
              <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0" disabled={loadingData}>
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Registro
              </Button>
          </div>
      </div>

      <Modal isOpen={formModalIsOpen} toggle={!isSubmittingForm ? toggleMainFormModal : undefined} onClosed={resetMainFormAndModalAlert} backdrop="static" centered size="lg">
        <ModalHeader toggle={!isSubmittingForm ? toggleMainFormModal : undefined}>
            {editing ? 'Editar Registro de Alimentación' : 'Nuevo Registro de Alimentación'}
        </ModalHeader>
        <ModalBody>
            <AlimentacionForm
                formData={formData}
                handleInputChange={handleMainFormInputChange}
                onFormSubmit={handleMainFormSubmit}
                onFormCancel={handleMainFormCancel}
                editing={editing}
                specimens={specimens.filter(s => s.estado === true || String(s.estado).toLowerCase() === "activo")}
                loadingSpecimens={loadingSpecimens}
                isSubmitting={isSubmittingForm}
                apiError={formModalApiError}
                fieldErrors={formModalFieldErrors}
             />
        </ModalBody>
      </Modal>

      {selectedAlimentacionForEstado && (
        <AlimentacionEstadoModal
            isOpen={estadoModalIsOpen}
            toggle={toggleEstadoModal}
            alimentacionRecord={selectedAlimentacionForEstado}
            onEstadoSubmit={handleEstadoSubmit}
            isSaving={isUpdatingEstado}
            apiError={estadoModalApiError}
        />
      )}

      <div className="table-responsive mt-4">
        <Table className="table table-bordered table-hover align-middle" responsive size="sm">
          <thead className="table-dark">
            <tr><th>Alimento</th><th>Cantidad</th><th>Espécimen</th><th>Fecha Registro</th><th>Estado</th><th style={{width: '130px'}}>Acciones</th></tr>
          </thead>
          <tbody>
            {loadingData ? (
                <tr><td colSpan="6" className="text-center"><Spinner>Cargando...</Spinner></td></tr>
            ) : currentAlimentacionItems.length > 0 ? (
              currentAlimentacionItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombreAlimento || "-"}</td>
                  <td>{item.cantidad ?? "-"}</td>
                  <td>{item.specimen?.name || (item.specimenId ? `ID: ${item.specimenId}` : "-")}</td>
                  <td>{formatDateForDisplay(item.createdAt)}</td>
                  <td>
                    <Badge color={getEstadoColor(item.estado)} pill className="text-dark fw-normal">
                      {item.estado || 'Programado'}
                    </Badge>
                  </td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button color="dark" onClick={() => handleEdit(item)} title="Editar" className="me-1" disabled={isUpdatingEstado}>
                         <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button color="danger" onClick={() => handleDelete(item.id)} title="Eliminar" className="me-1" disabled={isUpdatingEstado}>
                         <FontAwesomeIcon icon={faTrash} />
                      </Button>
                      {typeof updateAlimentacionEstado === 'function' && (
                        <Button
                            color="warning"
                            onClick={() => openEstadoModal(item)}
                            disabled={isUpdatingEstado && selectedAlimentacionForEstado?.id === item.id}
                            title={`Cambiar estado (Actual: ${item.estado || 'Programado'})`}
                            style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                            className="text-dark"
                        >
                           {(isUpdatingEstado && selectedAlimentacionForEstado?.id === item.id) ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faSyncAlt} />}
                        </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center fst-italic py-3">
                  {alimentaciones.length === 0 && !search ? "No hay registros de alimentación." : "No se encontraron coincidencias."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      {!loadingData && (currentAlimentacionItems.length > 0 || search) && renderPagination()}
    </Container>
  );
};

export default AlimentacionPage;