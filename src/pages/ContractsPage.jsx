// src/pages/ContractsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Button, Spinner, Alert, Input, InputGroup, InputGroupText,
  Modal, ModalHeader, ModalBody, Row, Col,
  Pagination, PaginationItem, PaginationLink
} from 'reactstrap';
import Swal from 'sweetalert2';
import { useContracts } from '../context/ContractContext';
import ContractTable from '../components/Contratos/ContractTable';
import ContractForm from '../components/Contratos/ContractForm';
import ViewContractModal from '../components/Contratos/ViewContractModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faSearch, faFileSignature, // Icono para Contratos
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

const ContractsPage = () => {
    const {
        contratos,
        isLoading: isLoadingContractsContext,
        error: contextError,
        agregarNuevoContrato,
        actualizarContratoContext,
        eliminarContratoContext,
        cargarContratos
    } = useContracts();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    
    const [modalApiError, setModalApiError] = useState(null);
    const [modalFieldErrors, setModalFieldErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
    
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const isLoadingPageData = isLoadingContractsContext;


    const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
        setGeneralAlert({ visible: true, message, type });
        const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
        return () => clearTimeout(timer);
    }, []);

    const clearModalErrors = useCallback(() => {
        setModalApiError(null);
        setModalFieldErrors({});
    }, []);

    const processApiErrorForContractForm = useCallback((err, entityType = 'contrato') => {
        clearModalErrors();
        const responseData = err.response?.data || err; 
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
        } else if (err.validationErrors && Array.isArray(err.validationErrors)) { 
            const fieldErrorsObj = {};
            let errorMessagesForAlert = [];
            err.validationErrors.forEach(valErr => {
                if(valErr.path) fieldErrorsObj[valErr.path] = valErr.msg;
                else errorMessagesForAlert.push(valErr.msg);
            });
            setModalFieldErrors(fieldErrorsObj);
            generalMessageForModal = errorMessagesForAlert.length > 0 ? errorMessagesForAlert.join('; ') : "Corrija los errores.";
        } else if (responseData?.message) {
            generalMessageForModal = responseData.message;
        } else if (err.message) {
            generalMessageForModal = err.message;
        }
        
        if (generalMessageForModal.includes("Network Error")) generalMessageForModal = "Error de conexión. Verifique su red.";
        if (generalMessageForModal.includes("timeout")) generalMessageForModal = "La solicitud tardó demasiado.";
        
        setModalApiError(generalMessageForModal);
    }, [clearModalErrors]);


    useEffect(() => {
        if (cargarContratos) {
            setGeneralAlert({ visible: false, message: "", type: "" }); 
            cargarContratos().catch(err => {
                showAlert("danger", `Error al cargar contratos: ${err.message || 'Error desconocido'}`);
            });
        }
    }, [cargarContratos, showAlert]);

    const filteredContracts = useMemo(() => {
        const originalContracts = Array.isArray(contratos) ? contratos : [];
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        if (!lowerCaseSearchTerm) {
            return originalContracts.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
        }
        return originalContracts.filter(contract => {
            if (!contract) return false;
            const clientName = contract.client?.nombre?.toLowerCase() || '';
            const specimenName = contract.specimen?.name?.toLowerCase() || '';
            const contractId = (contract.id || contract._id || '').toString().toLowerCase();
            const estado = contract.estado?.toLowerCase() || '';
            
            return (
                contractId.includes(lowerCaseSearchTerm) ||
                clientName.includes(lowerCaseSearchTerm) ||
                specimenName.includes(lowerCaseSearchTerm) ||
                estado.includes(lowerCaseSearchTerm) ||
                (contract.precioMensual?.toString() || '').includes(lowerCaseSearchTerm)
            );
        }).sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    }, [searchTerm, contratos]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentTableData = useMemo(() => {
        return filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredContracts, indexOfFirstItem, indexOfLastItem]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredContracts.length / ITEMS_PER_PAGE));
    }, [filteredContracts.length]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        window.scrollTo(0,0);
    };
    
    useEffect(() => {
        const newTotalPages = Math.max(1, Math.ceil(filteredContracts.length / ITEMS_PER_PAGE));
        if (currentPage > newTotalPages) {
            setCurrentPage(newTotalPages);
        } else if (currentPage < 1 && newTotalPages >= 1) {
            setCurrentPage(1);
        }
    }, [filteredContracts.length, currentPage]);


    const handleOpenNewModal = () => {
        setSelectedContract(null);
        clearModalErrors();
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (contract) => {
        setSelectedContract(contract);
        clearModalErrors();
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = useCallback(() => {
        setIsFormModalOpen(false);
        setSelectedContract(null);
        clearModalErrors();
        setIsSaving(false);
    }, [clearModalErrors]);

    const handleOpenViewModal = (contract) => {
        setSelectedContract(contract);
        setIsViewModalOpen(true);
    };
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedContract(null);
    };

    const handleSaveContract = async (formDataFromForm, contractIdFromForm) => {
        const idToUse = contractIdFromForm || selectedContract?.id || selectedContract?._id;
        setIsSaving(true);
        clearModalErrors();

        try {
            let responseMessage = "";
            if (idToUse) {
                await actualizarContratoContext(idToUse, formDataFromForm);
                responseMessage = "Contrato actualizado correctamente.";
            } else {
                await agregarNuevoContrato(formDataFromForm);
                responseMessage = "Contrato creado correctamente.";
            }
            handleCloseFormModal();
            showAlert('success', responseMessage);
        } catch (err) {
            console.error("Error guardando contrato en ContractsPage:", err);
            processApiErrorForContractForm(err, 'contrato');
        } finally {
            setIsSaving(false);
        }
    };

     const handleDeleteContract = async (id) => {
         if (!id) return;
         const contractToDelete = contratos.find(c => (c.id || c._id)?.toString() === id.toString());
         const clientName = contractToDelete?.client?.nombre || 'Cliente Desconocido';
         const confirmMessage = `¿Está seguro que desea eliminar el contrato para "<b>${clientName}</b>" (ID: ${id})?`;
         
         const result = await Swal.fire({
             title: 'Confirmar Eliminación', html: confirmMessage, icon: 'warning',
             showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
             confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
         });

         if (result.isConfirmed) {
             setIsProcessing(true);
             try {
                 await eliminarContratoContext(id);
                 showAlert('info', 'El contrato ha sido eliminado.');
             } catch (err) {
                 console.error("Error eliminando contrato:", err);
                 showAlert('danger', `Error al eliminar: ${err.message || "No se pudo eliminar el contrato."}`);
             } finally {
                 setIsProcessing(false);
             }
         }
     };

    const renderPagination = () => {
        const actualTotalPages = totalPages;
        const currentPageNum = currentPage;
        // if (actualTotalPages <= 1) return null; // Removido para que siempre se muestre

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
        // startPage y endPage ya están dentro de [1, actualTotalPages] por la lógica anterior
        for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }
        
        return (
          <Pagination 
            aria-label="Contract pagination" 
            size="sm" 
            className="mt-4 custom-pagination"
            listClassName="justify-content-center"
          >
            <PaginationItem disabled={currentPageNum <= 1}>
              <PaginationLink onClick={() => handlePageChange(currentPageNum - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink>
            </PaginationItem>
            {startPage > 1 && (<><PaginationItem onClick={() => handlePageChange(1)}><PaginationLink>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}</>)}
            {pageNumbers.map(number => (<PaginationItem active={number === currentPageNum} key={`contract-page-${number}`}><PaginationLink onClick={() => handlePageChange(number)}>{number}</PaginationLink></PaginationItem>))}
            {endPage < actualTotalPages && (<>{endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}<PaginationItem onClick={() => handlePageChange(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem></>)}
            <PaginationItem disabled={currentPageNum >= actualTotalPages}><PaginationLink onClick={() => handlePageChange(currentPageNum + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
          </Pagination>
        );
    };

    return (
        <Container fluid className="mt-4 mb-5">
            <style>{paginationCustomCss}</style>

            {/* START: New Dashboard-like Header for Contratos */}
            <Row className="mb-2">
                <Col className="text-center">
                    <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                        <FontAwesomeIcon icon={faFileSignature} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                        Contratos
                    </h2>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col>
                    <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
                </Col>
            </Row>

            {!(isLoadingPageData || isProcessing) && ( // Conditionally render controls section
                <Row className="mb-3 align-items-center">
                    <Col md="6" className="d-none d-md-block"> {/* Empty spacer for layout */}
                    </Col>
                    <Col xs="12" md="6">
                        <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                            <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                                <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                                <Input
                                    type="text"
                                    placeholder="Buscar contrato..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    bsSize="sm"
                                    aria-label="Buscar contratos"
                                />
                            </InputGroup>
                            <Button color="success" size="sm" onClick={handleOpenNewModal} className="flex-shrink-0">
                                <FontAwesomeIcon icon={faPlus} className="me-1" /> Nuevo Contrato
                            </Button>
                        </div>
                    </Col>
                </Row>
            )}
            {/* END: New Dashboard-like Header for Contratos */}
            
            {generalAlert.visible && (
                <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mb-3">
                    {generalAlert.message}
                </Alert>
            )}
             
            {contextError && !generalAlert.visible && (
                <Alert color="danger" fade={false} className="mb-3">
                    Error del Contexto: {typeof contextError === 'object' ? contextError.message || JSON.stringify(contextError) : contextError}
                </Alert>
            )}

            {/* Removed old header row */}

            {(isLoadingPageData || isProcessing) && !isSaving && (
                 <div className="text-center py-5">
                    <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="text-muted mt-2">{isProcessing ? 'Procesando...' : 'Cargando contratos...'}</p>
                 </div>
            )}

            {!isLoadingPageData && !isProcessing && !contextError && (
                <>
                    {currentTableData.length > 0 ? (
                        <ContractTable
                            contracts={currentTableData}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteContract}
                            onView={handleOpenViewModal}
                        />
                    ) : (
                        <Alert color="info" className="text-center mt-3" fade={false}>
                            {searchTerm
                                ? `No se encontraron contratos que coincidan con "${searchTerm}".`
                                : (contratos.length === 0 
                                    ? "Aún no hay contratos registrados." 
                                    : "No hay contratos para mostrar." // Si hay contratos pero el filtro no muestra nada
                                )
                            }
                        </Alert>
                    )}
                    
                    {renderPagination()} {/* El paginador ahora se muestra siempre, totalPages es al menos 1 */}
                </>
            )}
            
            {!isLoadingPageData && !isProcessing && contextError && filteredContracts.length === 0 && (
                 <Alert color="warning" className="text-center mt-3" fade={false}>
                    No se pudieron cargar los contratos. Verifique el error del contexto mostrado arriba o inténtelo de nuevo.
                 </Alert>
            )}


            {isFormModalOpen && (
                <Modal
                    isOpen={isFormModalOpen}
                    toggle={!isSaving ? handleCloseFormModal : undefined}
                    backdrop="static"
                    size="lg" 
                    centered
                    onClosed={handleCloseFormModal}
                >
                    <ModalHeader toggle={!isSaving ? handleCloseFormModal : undefined} closeAriaLabel="Cerrar">
                        {selectedContract ? `Editar Contrato` : "Nuevo Contrato"}
                    </ModalHeader>
                    <ModalBody>
                        {modalApiError && (
                            <Alert color="danger" className="mb-3" isOpen={!!modalApiError} toggle={() => setModalApiError(null)}>
                                {modalApiError}
                            </Alert>
                        )}
                        <ContractForm
                            isOpen={isFormModalOpen} // Puede ser útil para el form
                            toggle={handleCloseFormModal}
                            initialData={selectedContract}
                            onSubmit={handleSaveContract}
                            fieldErrors={modalFieldErrors}
                            isSaving={isSaving}
                            key={selectedContract?.id || selectedContract?._id || 'new-contract-form'}
                        />
                    </ModalBody>
                </Modal>
            )}

             {isViewModalOpen && selectedContract && (
                <ViewContractModal
                    isOpen={isViewModalOpen}
                    toggle={handleCloseViewModal}
                    contract={selectedContract}
                />
             )}
        </Container>
    );
};

export default ContractsPage;