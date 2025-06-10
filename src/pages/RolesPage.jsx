// src/pages/RolesPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Button, Input, Spinner, Alert,
  Modal, ModalHeader, ModalBody, Row, Col, InputGroup, InputGroupText,
  Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import Swal from 'sweetalert2';
import RolesTable from "../components/Roles/RolesTable";
import RolesForm from "../components/Roles/RolesForm";
import ViewRoleModal from "../components/Roles/ViewRoleModal";
import { getRoles, createRole, updateRole, deleteRole, toggleRoleStatus } from "../api/rolesApi";
import { ITEMS_PER_PAGE } from "../components/Roles/rolesConstants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faSearch, faUsersCog, // Icono para Roles
    faChevronLeft, faChevronRight
} from "@fortawesome/free-solid-svg-icons";

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

const ALERT_DURATION = 4000;

const RolesPage = () => {
  const [allRoles, setAllRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToView, setRoleToView] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false, will be true during fetch
  const [isSaving, setIsSaving] = useState(false);
  const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
  const [formApiError, setFormApiError] = useState(null);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [statusLoadingStates, setStatusLoadingStates] = useState({});

  const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
    setGeneralAlert({ visible: true, message, type });
    const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearFormErrors = useCallback(() => {
      setFormApiError(null);
      setFormFieldErrors({});
  }, []);

  const getFriendlyErrorMessageAndSetFormErrors = useCallback((err) => {
    clearFormErrors();
    const defaultMessage = "Ocurrió un error inesperado.";
    if (!err) {
        setFormApiError(defaultMessage);
        return defaultMessage;
    }
    const responseData = err.response?.data;
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
        const modalErrorMessage = generalMessages.length > 0 ? generalMessages.join('; ') : "Por favor, corrija los errores indicados.";
        setFormApiError(modalErrorMessage);
        return modalErrorMessage;
    }
    let message = responseData?.message || err.message || defaultMessage;
    if (message.includes("Network Error")) message = "Error de conexión.";
    if (message.includes("timeout")) message = "La solicitud tardó demasiado.";
    setFormApiError(message);
    return message;
  }, [clearFormErrors]);


  const fetchRoles = useCallback(async (showInactive = true) => {
    setIsLoading(true);
    setGeneralAlert({ visible: false, message: "", type: "" }); 
    setStatusLoadingStates({});
    try {
      const rolesData = await getRoles(showInactive);
      if (Array.isArray(rolesData)) {
        setAllRoles(rolesData);
      } else {
        setAllRoles([]);
        console.error("API response for roles is not an array:", rolesData);
        showAlert("danger", "Error interno al procesar la lista de roles.");
      }
      setCurrentPage(1); 
    } catch (err) {
      console.error("Error fetching roles:", err);
      showAlert("danger", err.response?.data?.message || err.message || "Error al cargar los roles.");
      setAllRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchRoles(true);
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
        return allRoles;
    }
    return allRoles.filter(role =>
      role.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      (role.status ? 'activo' : 'inactivo').includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, allRoles]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentTableData = useMemo(() => {
    return filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, filteredRoles, indexOfFirstItem, indexOfLastItem]); // Added currentPage as dependency

  const totalPages = useMemo(() => {
    return ITEMS_PER_PAGE > 0 ? Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE)) : 1;
  }, [filteredRoles.length]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0,0);
  };

  useEffect(() => {
    const newTotalPages = ITEMS_PER_PAGE > 0 ? Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE)) : 1;
    if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
    } else if (currentPage < 1 && newTotalPages > 0) { // Corrected condition from currentPage === 0
        setCurrentPage(1);
    }
  }, [searchTerm, filteredRoles.length, currentPage]);


  const toggleFormModal = useCallback(() => {
    if (isFormModalOpen) {
        setSelectedRole(null);
        clearFormErrors();
    }
    setIsFormModalOpen(prevState => !prevState);
  }, [isFormModalOpen, clearFormErrors]);

  const handleAddNew = () => {
    setSelectedRole(null);
    clearFormErrors();
    setIsFormModalOpen(true);
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    clearFormErrors();
    setIsFormModalOpen(true);
  };

  const handleSave = async (roleDataFromForm) => {
    setIsSaving(true);
    clearFormErrors();
    const roleId = selectedRole?.id || selectedRole?._id;
    try {
      const dataToSend = {
        name: roleDataFromForm.name,
        permissions: Array.isArray(roleDataFromForm.permissions) ? roleDataFromForm.permissions : [],
      };
      let responseMessage = "";
      if (roleId) {
        await updateRole(roleId, dataToSend);
        responseMessage = "Rol actualizado correctamente.";
      } else {
        await createRole(dataToSend);
        responseMessage = "Rol creado correctamente.";
      }
      toggleFormModal();
      await fetchRoles(true);
      showAlert("success", responseMessage);
    } catch (err) {
      console.error(`Error saving role (ID: ${roleId || 'new'}):`, err);
      getFriendlyErrorMessageAndSetFormErrors(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const roleToDelete = allRoles.find(r => (r.id || r._id) === id);
    if (!roleToDelete) {
        showAlert("danger", 'Rol no encontrado para eliminar.');
        return;
    }
    const confirmMessage = `¿Está seguro de eliminar el rol "${roleToDelete.name}"? Esta acción no se puede deshacer.`;

    const result = await Swal.fire({
        title: 'Confirmar Eliminación', text: confirmMessage, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true); // Use general isLoading for delete
      try {
        await deleteRole(id);
        await fetchRoles(true); // Refetch roles
        if ((selectedRole?.id || selectedRole?._id) === id) setSelectedRole(null);
        if ((roleToView?.id || roleToView?._id) === id) setRoleToView(null);
        showAlert("info", 'El rol ha sido eliminado.');
      } catch (err) {
        console.error(`Error deleting role ID ${id}:`, err);
        showAlert("danger", err.response?.data?.message || err.message || "Error al eliminar el rol.");
      } finally {
         setIsLoading(false);
      }
    }
  };

  const handleToggleStatus = async (roleId) => { 
      const roleToToggle = allRoles.find(r => (r.id || r._id) === roleId);
      if (!roleToToggle) {
        showAlert("warning", "Rol no encontrado para cambiar estado.");
        return;
      }

      const currentStatus = roleToToggle.status;
      const newStatus = !currentStatus;
      const roleName = roleToToggle.name || `ID ${roleId}`;
      const actionText = newStatus ? "activar" : "desactivar";
      const confirmationText = `¿Seguro que deseas ${actionText} el rol "${roleName}"?`;

      const result = await Swal.fire({
          title: `Confirmar ${newStatus ? 'Activación' : 'Desactivación'}`,
          text: confirmationText, icon: 'warning', showCancelButton: true,
          confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
          cancelButtonColor: '#6c757d',
          confirmButtonText: `Sí, ${actionText}`, cancelButtonText: 'Cancelar'
      });
      if (!result.isConfirmed) return;

      setStatusLoadingStates(prev => ({ ...prev, [roleId]: true }));
      setGeneralAlert({ visible: false, message: "", type: "" }); 
      try {
          const updatedRoleData = await toggleRoleStatus(roleId, newStatus); 
          setAllRoles(prevRoles =>
              prevRoles.map(role =>
                  (role.id || role._id) === roleId ? { ...role, ...updatedRoleData } : role
              )
          );
          showAlert("success", `El rol "${updatedRoleData.name}" ha sido ${newStatus ? 'activado' : 'desactivado'}.`);
      } catch (err) {
           console.error(`Error toggling status for role ID ${roleId}:`, err);
           showAlert("danger", err.response?.data?.message || err.message || `Error al cambiar estado del rol.`);
      } finally {
         setStatusLoadingStates(prev => ({ ...prev, [roleId]: false }));
      }
  };

  const toggleViewModal = (role = null) => {
    setRoleToView(role);
  };

  const renderPagination = () => {
    // if (totalPages <= 1) return null; // Do not render if only one page or less
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
      <Pagination aria-label="Roles pagination" size="sm" listClassName="justify-content-center" className="justify-content-center mt-4 custom-pagination">
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
    <Container fluid className="roles-page-container mt-4 mb-4">
        <style>{paginationCustomCss}</style>

        {/* START: New Dashboard-like Header for Roles */}
        <Row className="mb-2">
            <Col className="text-center">
                <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                    <FontAwesomeIcon icon={faUsersCog} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                    Roles
                </h2>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col>
                <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
            </Col>
        </Row>

        {!isLoading && ( // Conditionally render controls section
             <Row className="mb-3 align-items-center">
                <Col md="6" className="d-none d-md-block"> {/* Empty spacer for layout */}
                </Col>
                <Col xs="12" md="6">
                    <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                        <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                            <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                            <Input
                                type="text"
                                placeholder="Buscar por nombre o estado..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                bsSize="sm"
                                aria-label="Buscar roles"
                            />
                        </InputGroup>
                        <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0">
                            <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Rol
                        </Button>
                    </div>
                </Col>
            </Row>
        )}
        {/* END: New Dashboard-like Header for Roles */}

      {/* Removed old header Row from here */}
      
      {generalAlert.visible && (
        <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mt-3">
          {generalAlert.message}
        </Alert>
      )}


      {isLoading && !isSaving ? (
        <div className="text-center p-5">
          <Spinner style={{ width: '3rem', height: '3rem' }} color="primary" />
          <p className="mt-2">Cargando roles...</p>
        </div>
      ) : (
        <>
          {currentTableData.length > 0 ? (
            <RolesTable
              roles={currentTableData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={toggleViewModal}
              onToggleStatus={handleToggleStatus}
              loadingStatusStates={statusLoadingStates}
            />
          ) : null }
          
          {(!isLoading && (allRoles.length > 0 || searchTerm)) && renderPagination()}

          {!isLoading && filteredRoles.length === 0 && (
             <Alert color="info" className="text-center mt-3" fade={false}>
                {searchTerm
                  ? "No se encontraron roles que coincidan."
                  : (allRoles.length === 0 ? "Aún no hay roles registrados." : "No hay roles para mostrar con el filtro actual.")
                }
             </Alert>
          )}
        </>
      )}

      {isFormModalOpen && (
          <Modal
            isOpen={isFormModalOpen}
            toggle={!isSaving ? toggleFormModal : undefined}
            backdrop="static"
            size="lg"
            centered
            onClosed={() => {
                setSelectedRole(null);
                clearFormErrors();
            }}
          >
            <ModalHeader toggle={!isSaving ? toggleFormModal : undefined} closeAriaLabel="Cerrar">
              {selectedRole ? `Editar Rol: ${selectedRole.name}` : "Nuevo Rol"}
            </ModalHeader>
            <ModalBody>
              <RolesForm
                onSubmit={handleSave}
                initialData={selectedRole}
                onCancel={toggleFormModal}
                apiError={formApiError}
                isSaving={isSaving}
                fieldErrors={formFieldErrors}
                key={selectedRole?.id || selectedRole?._id || 'new-role-form'}
              />
            </ModalBody>
          </Modal>
      )}

      {roleToView && (
          <ViewRoleModal
            isOpen={!!roleToView}
            toggle={() => toggleViewModal(null)}
            role={roleToView}
          />
      )}
    </Container>
  );
};

export default RolesPage;