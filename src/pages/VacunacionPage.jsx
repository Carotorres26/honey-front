// src/pages/VacunacionPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container, Row, Col, Button, Input, Alert, Modal, ModalHeader, ModalBody,
  InputGroup, InputGroupText, Spinner, Table, ButtonGroup,
  Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faTrash, faPlus, faSearch,
  faChevronLeft, faChevronRight,
  faSyringe // Added faSyringe for the header
} from "@fortawesome/free-solid-svg-icons";
import VacunacionForm from "../components/Vacunacion/VacunacionForm";
import {
  getAllVacunaciones, createVacunacion, updateVacunacion, deleteVacunacion
} from "../api/vacunacionApi";
import { getAllSpecimens } from "../api/specimenApi";

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
const INITIAL_FORM_DATA = {
  id: null, nombreVacuna: "", fechaAdministracion: "", specimenId: '',
};

const VacunacionPage = () => {
  const [vacunaciones, setVacunaciones] = useState([]);
  const [selectedVacunacion, setSelectedVacunacion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specimens, setSpecimens] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
  const [modalApiError, setModalApiError] = useState(null);
  const [modalFieldErrors, setModalFieldErrors] = useState({});
  
  const [modalIsOpen, setModalIsOpen] = useState(false);
  
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

  const processApiErrorForModals = useCallback((err, entityType = 'registro') => {
    clearModalErrors();
    const responseData = err.response?.data;
    let generalMessageForModal = `Ocurrió un error al procesar el ${entityType}.`;

    if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
        const fieldErrorsObj = {};
        let errorMessagesForAlert = [];
        responseData.errors.forEach(e => {
            if (e.path) fieldErrorsObj[e.path] = e.msg;
            else errorMessagesForAlert.push(e.msg);
        });
        setModalFieldErrors(fieldErrorsObj);
        if (errorMessagesForAlert.length > 0) {
            generalMessageForModal = errorMessagesForAlert.join('; ');
        } else if (Object.keys(fieldErrorsObj).length > 0) {
            generalMessageForModal = "Por favor, corrija los errores marcados en el formulario.";
        }
    } else if (responseData?.message) {
        generalMessageForModal = responseData.message;
    } else if (responseData?.error) {
        generalMessageForModal = responseData.error;
    } else if (err.message) {
        generalMessageForModal = err.message;
    }
    
    if (generalMessageForModal.includes("Network Error")) generalMessageForModal = "Error de conexión. Verifique su red.";
    if (generalMessageForModal.includes("timeout")) generalMessageForModal = "La solicitud tardó demasiado.";
    
    setModalApiError(generalMessageForModal);
  }, [clearModalErrors]);


  const fetchAllData = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setGeneralAlert({ visible: false, message: "", type: "" });
    let combinedErrorMessages = "";

    try {
      const [vacRes, specRes] = await Promise.allSettled([
        getAllVacunaciones(),
        getAllSpecimens()
      ]);

      if (vacRes.status === 'fulfilled' && Array.isArray(vacRes.value)) {
        setVacunaciones(vacRes.value);
      } else {
        const reason = vacRes.status === 'rejected' ? (vacRes.reason?.response?.data?.message || vacRes.reason?.message || "Error desconocido") : "Formato de datos incorrecto.";
        console.error("Error cargando vacunaciones:", vacRes.reason || reason);
        combinedErrorMessages += `Error vacunaciones: ${reason}. `;
        setVacunaciones([]);
      }

      if (specRes.status === 'fulfilled' && Array.isArray(specRes.value)) {
        setSpecimens(specRes.value);
      } else {
        const reason = specRes.status === 'rejected' ? (specRes.reason?.response?.data?.message || specRes.reason?.message || "Error desconocido") : "Formato de datos incorrecto.";
        console.error("Error cargando especímenes:", specRes.reason || reason);
        combinedErrorMessages += `Error especímenes: ${reason}. `;
        setSpecimens([]);
      }
      setCurrentPage(1);

    } catch (err) {
      combinedErrorMessages += `Error General al cargar datos: ${err.message}.`;
      setVacunaciones([]);
      setSpecimens([]);
    } finally {
      if (combinedErrorMessages) {
        showAlert("danger", combinedErrorMessages.trim());
      }
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  const toggleModal = useCallback(() => {
    setModalIsOpen(prev => {
        if (prev) {
            setSelectedVacunacion(null);
            clearModalErrors();
        }
        return !prev;
    });
    if (modalIsOpen) setIsSaving(false);
  }, [modalIsOpen, clearModalErrors]);


  const handleFormSubmit = async (formDataFromForm) => {
    setIsSaving(true);
    clearModalErrors();
    const isEditing = !!selectedVacunacion?.id;

    if (!formDataFromForm.nombreVacuna || !formDataFromForm.fechaAdministracion || !formDataFromForm.specimenId) {
      processApiErrorForModals({ response: { data: { message: "Complete los campos requeridos (*)." }}}, 'registro');
      setIsSaving(false); return;
    }
    const specimenIdNum = parseInt(formDataFromForm.specimenId, 10);
    if (isNaN(specimenIdNum)) {
      processApiErrorForModals({ response: { data: { message: "Espécimen inválido." }}}, 'registro');
      setIsSaving(false); return;
    }
    if (!formDataFromForm.fechaAdministracion.match(/^\d{4}-\d{2}-\d{2}$/)) {
      processApiErrorForModals({ response: { data: { message: "Formato de fecha inválido (YYYY-MM-DD)." }}}, 'registro');
      setIsSaving(false); return;
    }
     try { new Date(formDataFromForm.fechaAdministracion).toISOString(); } 
     catch (e) {
      processApiErrorForModals({ response: { data: { message: "Fecha de administración inválida." }}}, 'registro');
      setIsSaving(false); return;
     }

    const dataToSend = {
      nombreVacuna: formDataFromForm.nombreVacuna.trim(),
      fechaAdministracion: formDataFromForm.fechaAdministracion,
      specimenId: specimenIdNum,
    };

    try {
      let successMessage = "";
      if (isEditing) {
        const { specimenId, ...dataWithoutSpecimen } = dataToSend;
        await updateVacunacion(selectedVacunacion.id, dataWithoutSpecimen);
        successMessage = "Registro de vacunación actualizado exitosamente.";
      } else {
        await createVacunacion(dataToSend);
        successMessage = "Registro de vacunación creado exitosamente.";
      }
      toggleModal();
      await fetchAllData(false);
      showAlert("success", successMessage);
    } catch (error) {
      console.error("Error guardando vacunación:", error);
      processApiErrorForModals(error, 'registro de vacunación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = useCallback(() => {
    setSelectedVacunacion(null);
    clearModalErrors();
    setModalIsOpen(true);
  }, [clearModalErrors]);

  const handleEdit = useCallback((vacunacion) => {
    let fechaFormateada = "";
    if (vacunacion.fechaAdministracion) {
      try {
        const dateObj = new Date(vacunacion.fechaAdministracion);
        // Asegurar que se usa la fecha local para el input date
        const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
        const localDate = new Date(dateObj.getTime() + userTimezoneOffset);
        fechaFormateada = localDate.toISOString().split('T')[0];
      } catch (e) { console.error("Error formateando fecha para edición:", e); }
    }
    setSelectedVacunacion({
      ...vacunacion,
      fechaAdministracion: fechaFormateada,
      specimenId: vacunacion.specimen?.id?.toString() || vacunacion.specimenId?.toString() || '',
    });
    clearModalErrors();
    setModalIsOpen(true);
  }, [clearModalErrors]);

  const handleDelete = async (id, nombreVacuna = "El registro") => {
    const result = await Swal.fire({
        title: '¿Eliminar Registro?',
        html: `¿Está seguro de eliminar el registro de vacunación para "<b>${nombreVacuna}</b>"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsProcessing(true);
      try {
        await deleteVacunacion(id);
        await fetchAllData(false);
        showAlert("info", `Registro de vacunación "${nombreVacuna}" eliminado.`);
      } catch (error) {
        console.error("Error eliminando vacunación:", error);
        showAlert("danger", `Error al eliminar: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const filteredVacunaciones = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (!lowerSearch) return vacunaciones;
    return vacunaciones.filter((item) =>
        item.nombreVacuna?.toLowerCase().includes(lowerSearch) ||
        item.specimen?.name?.toLowerCase().includes(lowerSearch) ||
        item.specimen?.identifier?.toLowerCase().includes(lowerSearch) ||
        formatDateForDisplay(item.fechaAdministracion).includes(lowerSearch)
    );
  }, [searchTerm, vacunaciones]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = useMemo(() =>
    filteredVacunaciones.slice(indexOfFirstItem, indexOfLastItem),
    [filteredVacunaciones, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.max(1, Math.ceil(filteredVacunaciones.length / ITEMS_PER_PAGE));

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredVacunaciones.length / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages && newTotalPages > 0) { // Asegurar que newTotalPages es positivo
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages > 0) { // Asegurar que newTotalPages es positivo
        setCurrentPage(1);
    }
  }, [searchTerm, filteredVacunaciones.length, currentPage]);


  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";
    try {
      const dateObj = new Date(dateString);
      // Ajustar por la zona horaria del usuario para mostrar la fecha correcta
      const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
      const localDate = new Date(dateObj.getTime() + userTimezoneOffset); // Sumar el offset para corregir
      if (!isNaN(localDate.getTime())) return localDate.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return "-";
    } catch (e) { console.error("Error formateando fecha para display:", e); return "-"; }
  };

  const renderPagination = () => {
    if (vacunaciones.length === 0 && !searchTerm && !isLoading) return null;
    // if (totalPages <= 1) return null;
    
    const actualTotalPages = totalPages;
    const currentPageNum = currentPage;
        
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
        if (i >= 1 && i <= actualTotalPages) {
            pageNumbers.push(i); 
        }
    }
    
    if (pageNumbers.length === 0 && actualTotalPages === 1) {
        pageNumbers.push(1);
    }

    return (
      <Pagination aria-label="Vacunacion pagination" size="sm" className="mt-4 custom-pagination" listClassName="justify-content-center">
        <PaginationItem disabled={currentPageNum <= 1}>
            <PaginationLink onClick={() => handlePageChange(currentPageNum - 1)} aria-label="Anterior">
                <FontAwesomeIcon icon={faChevronLeft} />
            </PaginationLink>
        </PaginationItem>
        {startPage > 1 && (
            <>
                <PaginationItem onClick={() => handlePageChange(1)}>
                    <PaginationLink>1</PaginationLink>
                </PaginationItem>
                {startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}
            </>
        )}
        {pageNumbers.map(number => (
            <PaginationItem active={number === currentPageNum} key={`vac-page-${number}`}>
                <PaginationLink onClick={() => handlePageChange(number)}>{number}</PaginationLink>
            </PaginationItem>
        ))}
        {endPage < actualTotalPages && (
            <>
                {endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}
                <PaginationItem onClick={() => handlePageChange(actualTotalPages)}>
                    <PaginationLink>{actualTotalPages}</PaginationLink>
                </PaginationItem>
            </>
        )}
        <PaginationItem disabled={currentPageNum >= actualTotalPages}>
            <PaginationLink onClick={() => handlePageChange(currentPageNum + 1)} aria-label="Siguiente">
                <FontAwesomeIcon icon={faChevronRight} />
            </PaginationLink>
        </PaginationItem>
      </Pagination>
    );
  };


  return (
    <Container fluid className="mt-4 mb-4">

      {/* START: New Dashboard-like Header for Vacunación */}
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
                      icon={faSyringe} 
                      size="lg" 
                      className="me-3" 
                      style={{ color: '#80B0AA' }} 
                  />
                  Vacunación
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
      {/* END: New Dashboard-like Header for Vacunación */}

      <style>{paginationCustomCss}</style>
      {generalAlert.visible && (
        <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ visible: false, message: "", type: "" })} fade={false} className="mb-3">
          {generalAlert.message}
        </Alert>
      )}

      <Row className="mb-3 align-items-center">
         <Col xs="12" md="6">
            {/* Espacio para título o breadcrumbs si es necesario */}
         </Col>
         <Col xs="12" md="6">
            <div className="d-flex flex-column flex-sm-row justify-content-md-end gap-2">
                <InputGroup size="sm" style={{ maxWidth: '350px' }}>
                     <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                     <Input 
                        type="text" 
                        placeholder="Buscar vacuna, espécimen, fecha..." 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }} 
                        bsSize="sm" 
                        aria-label="Buscar vacunaciones" 
                        disabled={isLoading || isProcessing}
                    />
                </InputGroup>
                <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0" disabled={isLoading || isProcessing}>
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Registro
                </Button>
            </div>
         </Col>
      </Row>

      <Modal isOpen={modalIsOpen} toggle={toggleModal} backdrop="static" centered size="lg" onClosed={() => {setSelectedVacunacion(null); clearModalErrors(); setIsSaving(false);}}>
        <ModalHeader toggle={!isSaving ? toggleModal : undefined}>
            {selectedVacunacion?.id ? 'Editar Registro de Vacunación' : 'Nuevo Registro de Vacunación'}
        </ModalHeader>
        <ModalBody>
            {modalApiError && (
              <Alert color="danger" className="mb-3" isOpen={!!modalApiError} toggle={() => setModalApiError(null)}>
                {modalApiError}
              </Alert>
            )}
            <VacunacionForm
                key={selectedVacunacion?.id || 'new-vacunacion'}
                formData={selectedVacunacion || INITIAL_FORM_DATA}
                editing={!!selectedVacunacion?.id}
                onFormSubmit={handleFormSubmit}
                onFormCancel={toggleModal}
                handleInputChange={(e) => {
                    const { name, value } = e.target;
                    setSelectedVacunacion(prev => ({
                        ...prev,
                        [name]: value
                    }));
                }}
                specimens={specimens}
                isSaving={isSaving}
                fieldErrors={modalFieldErrors}
             />
        </ModalBody>
      </Modal>

      {(isLoading && !isProcessing) && ( // Show loading only if not processing something else
        <div className="text-center p-5">
            <Spinner />
            <p className="mt-2 text-muted">Cargando datos...</p>
        </div>
      )}
       {isProcessing && ( // Show processing spinner separately
        <div className="text-center p-5">
            <Spinner />
            <p className="mt-2 text-muted">Procesando...</p>
        </div>
      )}


      {!isLoading && !isProcessing && (
        <>
          <div className="table-responsive">
            <Table className="table table-bordered table-hover align-middle" responsive size="sm">
              <thead className="table-dark">
                <tr>
                    <th>Vacuna</th>
                    <th>Fecha Adm.</th>
                    <th>Espécimen (ID)</th>
                    <th>Fecha Registro</th>
                    <th style={{width: '100px'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombreVacuna || "-"}</td>
                    <td>{formatDateForDisplay(item.fechaAdministracion)}</td>
                    <td>{item.specimen?.name || "-"} ({item.specimen?.identifier || item.specimenId || 'N/A'})</td>
                    <td>{formatDateForDisplay(item.createdAt)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button color="dark" onClick={() => handleEdit(item)} title="Editar" className="me-1">
                            <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button color="danger" onClick={() => handleDelete(item.id, item.nombreVacuna)} title="Eliminar">
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center fst-italic py-3">
                    {vacunaciones.length === 0 ? "No hay registros de vacunación." : "No se encontraron coincidencias para su búsqueda."}
                  </td>
                </tr>
              )}
              </tbody>
            </Table>
          </div>
          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default VacunacionPage;