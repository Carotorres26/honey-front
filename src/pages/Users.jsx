  // src/pages/UsersPage.jsx
  import React, { useState, useEffect, useCallback, useMemo } from "react";
  import {
    Container, Button, Input, Alert, Modal, ModalHeader, ModalBody,
    InputGroup, Spinner, Row, Col, InputGroupText,
    Pagination, PaginationItem, PaginationLink
  } from "reactstrap";
  import Swal from 'sweetalert2';
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import {
    faEdit, faTrash, faPlus, faSearch, faEye, faToggleOn, faToggleOff,
    faChevronLeft, faChevronRight, faUsers // <--- Icono para Usuarios
  } from "@fortawesome/free-solid-svg-icons";
  import UserForm from "../components/Usuarios/UserForm";
  import UserTable from "../components/Usuarios/UserTable";
  import ViewUserModal from "../components/Usuarios/ViewUserModal";
  import {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    toggleUserStatusApi
  } from "../api/userApi";

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

  const ALERT_DURATION = 4000; // Definido aquí para consistencia

  const UsersPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [modalApiError, setModalApiError] = useState(null);
    const [modalFieldErrors, setModalFieldErrors] = useState({});
    const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Puedes usar este para borrados o cambios de estado si isLoading es para carga inicial
    const [statusLoadingStates, setStatusLoadingStates] = useState({});

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Puedes ajustar esto o hacerlo configurable

    const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
      setGeneralAlert({ visible: true, message, type });
      const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
      return () => clearTimeout(timer);
    }, []);

    const getFriendlyErrorMessage = useCallback((error) => {
        const defaultMessage = "Ocurrió un error inesperado. Por favor, intente de nuevo.";
        if (!error) return defaultMessage;
        const responseData = error.response?.data;
        if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
            const fieldErrorsObj = {};
            const generalMessages = [];
            responseData.errors.forEach(err => {
                if (err.path) {
                    fieldErrorsObj[err.path] = err.msg;
                } else {
                    generalMessages.push(err.msg);
                }
            });
            setModalFieldErrors(fieldErrorsObj); // Establecer errores de campo para el modal
            return generalMessages.length > 0 ? generalMessages.join('; ') : "Por favor, corrija los errores en el formulario.";
        }
        // Errores más genéricos o de red
        if (error.message) {
          if (error.message.includes("401") || error.message.includes("403")) return "No tiene permiso para esta acción o su sesión ha expirado.";
          if (error.message.includes("Network Error")) return "Error de conexión con el servidor.";
          // Si el mensaje no es el típico de Axios, devolverlo directamente
          if (!error.message.toLowerCase().includes('request failed with status code')) return error.message;
        }
        return responseData?.message || responseData?.error || defaultMessage;
    }, []);

    const fetchUsers = useCallback(async () => {
      setIsLoading(true);
      setGeneralAlert({ visible: false, message: "", type: "" });
      try {
        const data = await obtenerUsuarios();
        setUsuarios(Array.isArray(data) ? data : []);
        setCurrentPage(1); // Resetear a la primera página después de cargar
      } catch (error) {
        console.error("Error fetching users:", error);
        showAlert("danger", `Error al cargar usuarios: ${getFriendlyErrorMessage(error)}`);
        setUsuarios([]);
      } finally {
        setIsLoading(false);
      }
    }, [showAlert, getFriendlyErrorMessage]);

    useEffect(() => {
      fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
      if (!lowerCaseSearchTerm) {
        return usuarios;
      }
      return usuarios.filter(user =>
          (user.nombreCompleto?.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.documento?.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.email?.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.username?.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.role?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
          ((user.status ? 'activo' : 'inactivo').includes(lowerCaseSearchTerm))
      );
    }, [searchTerm, usuarios]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = useMemo(() =>
      filteredUsers.slice(indexOfFirstItem, indexOfLastItem),
      [filteredUsers, indexOfFirstItem, indexOfLastItem]
    );
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

    const handlePageChange = (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0); // Scroll to top on page change
    };

    // Efecto para ajustar la página actual si cambia el total de páginas
    useEffect(() => {
      const newTotalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
      if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
      } else if (currentPage < 1 && newTotalPages > 0) { // Cambiado de currentPage === 0
          setCurrentPage(1);
      }
    }, [searchTerm, filteredUsers.length, itemsPerPage, currentPage]);


    const toggleFormModal = useCallback(() => {
      if (isFormModalOpen) {
        setSelectedUser(null); // Limpiar usuario seleccionado al cerrar
        setModalApiError(null);  // Limpiar errores del modal
        setModalFieldErrors({}); // Limpiar errores de campo
        setIsSaving(false); // Resetear estado de guardado
      }
      setIsFormModalOpen(prevState => !prevState);
    }, [isFormModalOpen]);

    const handleOpenViewModal = (user) => {
      setSelectedUser(user); // Usuario para ver
      setIsViewModalOpen(true);
    };
    const handleCloseViewModal = () => {
      setIsViewModalOpen(false);
      setSelectedUser(null); // Limpiar al cerrar
    };
    const handleAddNew = () => {
      setSelectedUser(null); // Asegurar que no hay datos iniciales para un nuevo usuario
      setModalApiError(null);
      setModalFieldErrors({});
      setIsFormModalOpen(true);
    };
    const handleEdit = (user) => {
      setSelectedUser(user);
      setModalApiError(null);
      setModalFieldErrors({});
      setIsFormModalOpen(true);
    };
    const handleSave = async (userDataFromForm) => {
      setIsSaving(true);
      setModalApiError(null); // Limpiar errores previos del modal
      setModalFieldErrors({});
      const userId = selectedUser?.id || selectedUser?._id; // Ojo con la estructura del ID
      try {
        let responseMessage = "";
        if (userId) {
          await actualizarUsuario(userId, userDataFromForm);
          responseMessage = "Usuario actualizado con éxito.";
        } else {
          await crearUsuario(userDataFromForm);
          responseMessage = "Usuario creado con éxito.";
        }
        toggleFormModal();
        await fetchUsers(); // Recargar la lista de usuarios
        showAlert("success", responseMessage);
      } catch (error) {
        console.error(`Error ${userId ? 'actualizando' : 'creando'} usuario:`, error);
        const friendlyError = getFriendlyErrorMessage(error); // Esto ya establece los errores de campo si existen
        setModalApiError(friendlyError); // Establecer el error general para el modal
      } finally {
        setIsSaving(false);
      }
    };
    const handleDelete = async (id) => {
      if (!id) return;
      const userToDelete = usuarios.find(u => (u.id || u._id) === id);
      const confirmMessage = `¿Está seguro de eliminar al usuario "${userToDelete?.username || `ID ${id}`}"? Esta acción no se puede deshacer.`;

      const result = await Swal.fire({
          title: 'Confirmar Eliminación', text: confirmMessage, icon: 'warning',
          showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setIsProcessing(true); // Usar isProcessing para la acción de borrado
        try {
          await eliminarUsuario(id);
          await fetchUsers(); // Recargar usuarios
          if ((selectedUser?.id || selectedUser?._id) === id) setSelectedUser(null); // Limpiar si el usuario borrado estaba seleccionado
          showAlert("info", "Usuario eliminado con éxito.");
        } catch (error) {
          console.error("Error deleting user:", error);
          showAlert("danger", `Error al eliminar: ${getFriendlyErrorMessage(error)}`);
        } finally {
          setIsProcessing(false);
        }
      }
    };
    const handleToggleUserStatus = async (userId) => {
        if (!userId) return;
        const user = usuarios.find(u => (u.id || u._id) === userId);
        if (!user) {
          showAlert("warning", "Usuario no encontrado para cambiar estado.");
          return;
        }
        const userName = user.username || `ID ${userId}`;
        const currentStatus = user.status; // Asumimos que status es booleano o 'activo'/'inactivo'
        const actionText = (currentStatus === true || String(currentStatus).toLowerCase() === 'activo') ? "desactivar" : "activar";
        const newStatusValue = !(currentStatus === true || String(currentStatus).toLowerCase() === 'activo');


        const result = await Swal.fire({
            title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            text: `¿Seguro que deseas ${actionText} al usuario "${userName}"?`,
            icon: 'question', showCancelButton: true,
            confirmButtonColor: newStatusValue ? '#28a745' : '#dc3545', // Verde para activar, Rojo para desactivar
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Sí, ${actionText}`, cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;

        setStatusLoadingStates(prev => ({ ...prev, [userId]: true }));
        try {
            const updatedUserData = await toggleUserStatusApi(userId); // API debe devolver el usuario actualizado con el nuevo estado
            setUsuarios(prevUsers =>
                prevUsers.map(u =>
                    (u.id || u._id) === userId ? { ...u, status: updatedUserData.status } : u
                )
            );
            showAlert("success", `Usuario "${updatedUserData.username || userName}" ha sido ${updatedUserData.status ? 'activado' : 'desactivado'}.`);
        } catch (error) {
            console.error(`Error toggling status for user ID ${userId}:`, error);
            showAlert("danger", `Error al cambiar estado: ${getFriendlyErrorMessage(error)}`);
        } finally {
          setStatusLoadingStates(prev => ({ ...prev, [userId]: false }));
        }
    };

    const renderPagination = () => {
      // if (totalPages <= 1) return null; // No renderizar si solo hay una página o menos

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

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      return (
        <Pagination
          aria-label="User pagination"
          size="sm"
          className="mt-4 custom-pagination"
          listClassName="justify-content-center"
        >
          <PaginationItem disabled={currentPage <= 1}>
            <PaginationLink onClick={() => handlePageChange(currentPage - 1)} aria-label="Anterior">
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
            <PaginationItem active={number === currentPage} key={number}>
              <PaginationLink onClick={() => handlePageChange(number)}>
                {number}
              </PaginationLink>
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

          <PaginationItem disabled={currentPage >= actualTotalPages}>
            <PaginationLink onClick={() => handlePageChange(currentPage + 1)} aria-label="Siguiente">
              <FontAwesomeIcon icon={faChevronRight} />
            </PaginationLink>
          </PaginationItem>
        </Pagination>
      );
    };

    return (
      <Container fluid className="mt-4 mb-5">
        <style>{paginationCustomCss}</style>

          {/* START: New Dashboard-like Header for Usuarios */}
          <Row className="mb-2">
              <Col className="text-center">
                  <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      <FontAwesomeIcon icon={faUsers} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                      Usuarios
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
                              <Input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bsSize="sm" aria-label="Buscar usuarios"/>
                          </InputGroup>
                          <Button color="success" size="sm" onClick={handleAddNew} className="flex-shrink-0">
                              <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Usuario
                          </Button>
                      </div>
                  </Col>
              </Row>
          )}
          {/* END: New Dashboard-like Header for Usuarios */}
        
        {generalAlert.visible && (
          <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ visible: false, message: "", type: "" })} fade={false} className="mt-3">
            {generalAlert.message}
          </Alert>
        )}

        {/* Removed old header row */}

        {isLoading && !isProcessing && ( // Spinner para carga inicial
          <div className="text-center p-5">
              <Spinner style={{ width: '3rem', height: '3rem' }} color="primary"/>
              <p className="mt-2">Cargando usuarios...</p>
          </div>
        )}
        {isProcessing && !isLoading && ( // Spinner para otras acciones
          <div className="text-center p-5">
              <Spinner style={{ width: '3rem', height: '3rem' }} color="secondary"/>
              <p className="mt-2">Procesando...</p>
          </div>
        )}

        {!isLoading && !isProcessing && ( // Mostrar tabla solo si no está cargando ni procesando
          <UserTable
              usuarios={currentItems}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleOpenViewModal}
              onToggleStatus={handleToggleUserStatus}
              loadingStatusStates={statusLoadingStates}
          />
        )}

        {/* Paginación: se muestra si no está cargando/procesando Y hay usuarios o término de búsqueda */}
        {!isLoading && !isProcessing && (usuarios.length > 0 || searchTerm) && renderPagination()}


        {/* Alertas de "No hay datos" */}
        {!isLoading && !isProcessing && filteredUsers.length === 0 && usuarios.length > 0 && searchTerm && (
            <Alert color="info" className="text-center mt-3" fade={false}>
              No se encontraron coincidencias para su búsqueda.
            </Alert>
        )}
        {!isLoading && !isProcessing && usuarios.length === 0 && !searchTerm && (
            <Alert color="info" className="text-center mt-3" fade={false}>
              No hay usuarios registrados. Puede agregar uno nuevo.
            </Alert>
        )}

        {isFormModalOpen && (
            <Modal
              isOpen={isFormModalOpen}
              toggle={!isSaving ? toggleFormModal : undefined} // Permitir cerrar si no se está guardando
              backdrop="static" // Evitar cierre al hacer clic afuera
              centered
              size="lg" // Modal más grande para formularios
              onClosed={() => { // Limpiar al cerrar completamente
                  setSelectedUser(null);
                  setModalApiError(null);
                  setModalFieldErrors({});
              }}
            >
              <ModalHeader toggle={!isSaving ? toggleFormModal : undefined}>
                {selectedUser ? `Editar Usuario: ${selectedUser.username}` : "Nuevo Usuario"}
              </ModalHeader>
              <ModalBody>
                <UserForm
                  key={selectedUser?.id || selectedUser?._id || 'new-user-form'} // Key para resetear el form
                  initialData={selectedUser}
                  onSubmit={handleSave}
                  onCancel={toggleFormModal}
                  apiError={modalApiError} // Pasar error de API al formulario
                  isSaving={isSaving} // Pasar estado de guardado
                  fieldErrors={modalFieldErrors} // Pasar errores de campo
                />
              </ModalBody>
            </Modal>
        )}

        {isViewModalOpen && selectedUser && (
          <ViewUserModal
              isOpen={isViewModalOpen}
              toggle={handleCloseViewModal}
              user={selectedUser}
          />
        )}
      </Container>
    );
  };

  export default UsersPage;