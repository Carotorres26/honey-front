// src/pages/MedicinePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, Input, Alert, Modal, ModalHeader, ModalBody,
  InputGroup, ButtonGroup, Spinner, Badge, InputGroupText,
  Pagination, PaginationItem, PaginationLink, Container, Row, Col
} from "reactstrap";
import {
  faEdit, faTrash, faPlus, faSearch, faSyncAlt,
  faChevronLeft, faChevronRight, 
  faBriefcaseMedical // Changed to faBriefcaseMedical
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MedicineForm from "../components/Medicina/MedicineForm";
import MedicineEstadoModal from "../components/Medicina/MedicineEstadoModal";
import {
  getAllMedicines, createMedicine, updateMedicine,
  deleteMedicine, updateMedicineEstado
} from "../api/medicineApi";
import { getAllSpecimens } from "../api/specimenApi";
import Swal from 'sweetalert2';

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
  id: null, nombre: "", cantidad: 1, dosis: "", horaAdministracion: "", specimenId: '', estado: 'Programado'
};
const ITEMS_PER_PAGE = 10;

const MedicinePage = () => {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [generalAlert, setGeneralAlert] = useState({ type: "", message: "", visible: false });
  const [specimens, setSpecimens] = useState([]);
  const [loadingSpecimens, setLoadingSpecimens] = useState(false);
  
  const [formModalIsOpen, setFormModalIsOpen] = useState(false);
  const [formModalApiError, setFormModalApiError] = useState(null);
  const [formModalFieldErrors, setFormModalFieldErrors] = useState({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [estadoModalIsOpen, setEstadoModalIsOpen] = useState(false);
  const [selectedMedicineForEstado, setSelectedMedicineForEstado] = useState(null);
  const [estadoModalApiError, setEstadoModalApiError] = useState(null);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);

  const [loadingData, setLoadingData] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const showAlert = useCallback((type, message, duration = ALERT_FADE_TIMEOUT) => {
    setGeneralAlert({ type, message, visible: true });
    const timer = setTimeout(() => { setGeneralAlert({ type: "", message: "", visible: false }); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearFormModalErrors = useCallback(() => {
    setFormModalApiError(null);
    setFormModalFieldErrors({});
  }, []);

  const clearEstadoModalError = useCallback(() => {
    setEstadoModalApiError(null);
  }, []);

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

  const fetchMedicines = useCallback(async () => {
    setLoadingData(true);
    setGeneralAlert({ message: "", type: "", visible: false });
    try {
      const data = await getAllMedicines();
      setMedicines(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      showAlert("danger", error?.response?.data?.message || error?.message || "Error al cargar medicinas.");
      setMedicines([]);
    } finally {
      setLoadingData(false);
    }
  }, [showAlert]);

  const fetchSpecimens = useCallback(async () => {
    setLoadingSpecimens(true);
    try {
      const specimenData = await getAllSpecimens();
      setSpecimens(Array.isArray(specimenData) ? specimenData : []);
    } catch (error) {
      console.error("Error fetching specimens:", error);
      showAlert("warning", error?.response?.data?.message || error?.message || "No se pudieron cargar los especímenes.");
      setSpecimens([]);
    } finally {
      setLoadingSpecimens(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMedicines();
    fetchSpecimens();
  }, [fetchMedicines, fetchSpecimens]);

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
        setSelectedMedicineForEstado(null);
        clearEstadoModalError();
    }
    setEstadoModalIsOpen(prev => !prev);
  }, [estadoModalIsOpen, clearEstadoModalError]);

  const openEstadoModal = useCallback((medicineRecord) => {
    setSelectedMedicineForEstado(medicineRecord);
    clearEstadoModalError();
    setEstadoModalIsOpen(true);
  }, [clearEstadoModalError]);

  const handleEstadoSubmit = async (medicineId, nuevoEstado) => {
    if (!selectedMedicineForEstado || selectedMedicineForEstado.id !== medicineId) {
        console.error("Discrepancia de ID en handleEstadoSubmit de Medicina");
        return;
    }
    setIsUpdatingEstado(true);
    clearEstadoModalError();
    try {
        const updatedRecord = await updateMedicineEstado(medicineId, nuevoEstado);
        setMedicines(prev => prev.map(item =>
            item.id === medicineId ? { ...item, ...updatedRecord } : item
        ));
        showAlert("success", `Estado de "${updatedRecord.nombre || 'la medicina'}" actualizado a ${nuevoEstado}.`);
        toggleEstadoModal();
    } catch (error) {
        console.error(`Error updating state for medicine ${medicineId}:`, error);
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
      nombre: formData.nombre.trim(),
      cantidad: parseInt(formData.cantidad, 10),
      dosis: formData.dosis.trim(),
      horaAdministracion: formData.horaAdministracion.includes(':') && formData.horaAdministracion.length === 5 
                          ? `${formData.horaAdministracion}:00` 
                          : formData.horaAdministracion,
      estado: formData.estado,
    };
    if (!editing) {
        dataToSend.specimenId = parseInt(formData.specimenId, 10);
    }
    try {
      let successMessage = "";
      if (editing && formData.id) {
        await updateMedicine(formData.id, dataToSend);
        successMessage = "Medicina actualizada correctamente.";
      } else {
        await createMedicine(dataToSend);
        successMessage = "Medicina agregada correctamente.";
      }
      await fetchMedicines();
      showAlert("success", successMessage);
      toggleMainFormModal();
    } catch (error) {
      console.error("Error saving medicine:", error);
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

  const handleEdit = useCallback((medicine) => {
    resetMainFormAndModalAlert();
    let horaFormateada = "";
    if (medicine.horaAdministracion) {
        const parts = String(medicine.horaAdministracion).split(':');
        if (parts.length >= 2) {
            horaFormateada = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
    }
    setFormData({
        id: medicine.id,
        nombre: medicine.nombre || '',
        cantidad: medicine.cantidad ?? 1,
        dosis: medicine.dosis || '',
        horaAdministracion: horaFormateada,
        specimenId: medicine.specimen?.id?.toString() || medicine.specimenId?.toString() || '',
        estado: medicine.estado || INITIAL_FORM_DATA.estado,
    });
    setEditing(true);
    setFormModalIsOpen(true);
  }, [resetMainFormAndModalAlert]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar Medicina?',
        text: "¿Está seguro de que desea eliminar este registro de medicina?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await deleteMedicine(id);
        showAlert("info", "Registro de medicina eliminado.");
        setMedicines(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        console.error("Error deleting medicine:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "Error al eliminar.";
        showAlert("danger", errorMsg);
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

  const filteredMedicines = useMemo(() => {
      const searchTermLower = search.toLowerCase().trim();
      if (!searchTermLower) return medicines;
      return medicines.filter((item) => {
          const estadoActual = (item.estado || 'Programado').toLowerCase();
          return (
              item.nombre?.toLowerCase().includes(searchTermLower) ||
              item.specimen?.name?.toLowerCase().includes(searchTermLower) ||
              estadoActual.includes(searchTermLower) ||
              String(item.dosis || '').toLowerCase().includes(searchTermLower) ||
              String(item.cantidad).includes(searchTermLower)
          );
      });
  }, [search, medicines]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentMedicineItems = useMemo(() => 
    filteredMedicines.slice(indexOfFirstItem, indexOfLastItem), 
    [filteredMedicines, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0,0);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages > 0) { 
        setCurrentPage(1);
    }
  }, [search, filteredMedicines.length, currentPage]);

  const renderPagination = () => {
    if (medicines.length === 0 && !search && !loadingData) return null;
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
      <Pagination aria-label="Medicine pagination" size="sm" listClassName="justify-content-center" className="justify-content-center mt-4 custom-pagination">
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

      {/* START: New Dashboard-like Header for Medicina */}
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
                      icon={faBriefcaseMedical} // Using a vet's medical bag icon
                      size="lg" 
                      className="me-3" 
                      style={{ color: '#80B0AA' }} // Medical blue color
                  />
                  Medicina
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
      {/* END: New Dashboard-like Header for Medicina */}

      <style>{paginationCustomCss}</style>
      {generalAlert.visible && (
        <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mt-3">
          {generalAlert.message}
        </Alert>
      )}

      <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
          <InputGroup size="sm" style={{ minWidth: '220px', maxWidth: '300px'}}>
            <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
            <Input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} bsSize="sm" disabled={loadingData}/>
          </InputGroup>
          <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0" disabled={loadingData}>
            <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Medicina
          </Button>
      </div>

       <Modal isOpen={formModalIsOpen} toggle={!isSubmittingForm ? toggleMainFormModal : undefined} onClosed={resetMainFormAndModalAlert} backdrop="static" centered size="lg">
        <ModalHeader toggle={!isSubmittingForm ? toggleMainFormModal : undefined}>
            {editing ? 'Editar Medicina' : 'Agregar Nueva Medicina'}
        </ModalHeader>
        <ModalBody>
             <MedicineForm
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

      {selectedMedicineForEstado && (
        <MedicineEstadoModal
            isOpen={estadoModalIsOpen}
            toggle={toggleEstadoModal}
            medicineRecord={selectedMedicineForEstado}
            onEstadoSubmit={handleEstadoSubmit}
            isSaving={isUpdatingEstado}
            apiError={estadoModalApiError}
        />
      )}

       <div className="table-responsive mt-4">
        <Table className="table table-bordered table-hover align-middle" responsive size="sm">
          <thead className="table-dark">
            <tr><th>Nombre</th><th>Cant.</th><th>Dosis</th><th>Hora Adm.</th><th>Espécimen</th><th>Estado</th><th>Fecha Reg.</th><th style={{width: '130px'}}>Acciones</th></tr>
          </thead>
          <tbody>
            {loadingData ? (
                <tr><td colSpan="8" className="text-center"><Spinner>Cargando...</Spinner></td></tr>
            ) : currentMedicineItems.length > 0 ? (
              currentMedicineItems.map((medicine) => (
                <tr key={medicine.id}>
                  <td>{medicine.nombre || "-"}</td>
                  <td>{medicine.cantidad ?? "-"}</td>
                  <td>{medicine.dosis || "-"}</td>
                  <td>{String(medicine.horaAdministracion || "-").substring(0,5)}</td>
                  <td>{medicine.specimen?.name || (medicine.specimenId ? `ID: ${medicine.specimenId}` : "-")}</td>
                  <td>
                    <Badge color={getEstadoColor(medicine.estado)} pill className="text-dark fw-normal">
                      {medicine.estado || 'Programado'}
                    </Badge>
                  </td>
                  <td>{formatDateForDisplay(medicine.createdAt)}</td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button color="dark" onClick={() => handleEdit(medicine)} title="Editar" className="me-1" disabled={isUpdatingEstado}>
                          <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button color="danger" onClick={() => handleDelete(medicine.id)} title="Eliminar" className="me-1" disabled={isUpdatingEstado}>
                          <FontAwesomeIcon icon={faTrash} />
                      </Button>
                      {typeof updateMedicineEstado === 'function' && (
                        <Button
                            color="warning"
                            onClick={() => openEstadoModal(medicine)}
                            disabled={isUpdatingEstado && selectedMedicineForEstado?.id === medicine.id}
                            title={`Cambiar estado (Actual: ${medicine.estado || 'Programado'})`}
                            style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                            className="text-dark"
                        >
                           {(isUpdatingEstado && selectedMedicineForEstado?.id === medicine.id) ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faSyncAlt} />}
                        </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center fst-italic py-3">
                  {medicines.length === 0 && !search ? "No hay medicinas registradas." : "No se encontraron coincidencias."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      {!loadingData && (currentMedicineItems.length > 0 || search) && renderPagination()}
    </Container>
  );
};

export default MedicinePage;