// src/pages/SedesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Button, Input, Spinner, Alert,
    Modal, ModalHeader, ModalBody,
    Row, Col, InputGroup, InputGroupText,
    Badge,
    Pagination, PaginationItem, PaginationLink
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faArrowLeft, faBuilding, // Added faBuilding back
    faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import {
    getAllSedes, createSede, updateSede, deleteSede,
    getEjemplaresBySedeId
} from '../api/sedeApi';
import VenueForm from '../components/Sedes/VenueForm';
import VenueCard from '../components/Sedes/VenueCard';
import { getAllCategories } from '../api/categoryApi';
import SpecimenCard from '../components/Specimens/SpecimenCard';

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

const ITEMS_PER_PAGE_SEDES = 6;
const ITEMS_PER_PAGE_SPECIMENS_IN_SEDE = 8;
const ALERT_DURATION = 4000;

const SedesPage = () => {
    const [sedes, setSedes] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
    const [modalApiError, setModalApiError] = useState(null);
    const [modalFieldErrors, setModalFieldErrors] = useState({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [formSedeModalOpen, setFormSedeModalOpen] = useState(false);
    const [selectedSedeToEdit, setSelectedSedeToEdit] = useState(null);

    const [viewingSedeIdForSpecimens, setViewingSedeIdForSpecimens] = useState(null);
    const [selectedSedeNombre, setSelectedSedeNombre] = useState('');
    const [specimensOfSelectedSede, setSpecimensOfSelectedSede] = useState([]);
    const [isLoadingSpecimens, setIsLoadingSpecimens] = useState(false);

    const [currentSedePage, setCurrentSedePage] = useState(1);
    const [currentSpecimenPage, setCurrentSpecimenPage] = useState(1);

    const showAlert = useCallback((type, message, duration = ALERT_DURATION) => {
        setGeneralAlert({ visible: true, message, type });
        const timer = setTimeout(() => { setGeneralAlert({ visible: false, message: "", type: "" }); }, duration);
        return () => clearTimeout(timer);
    }, []);

    const clearModalErrors = useCallback(() => {
        setModalApiError(null);
        setModalFieldErrors({});
    }, []);

    const processApiErrorForModals = useCallback((err, entityType = 'sede') => {
        clearModalErrors();
        const responseData = err.response?.data;
        let generalMessageForModal = `Ocurrió un error al procesar ${entityType === 'sede' ? 'la' : 'el'} ${entityType}.`;

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
        } else if (err?.message) {
            generalMessageForModal = err.message;
        }
        
        if (generalMessageForModal.includes("Network Error")) generalMessageForModal = "Error de conexión. Verifique su red.";
        if (generalMessageForModal.includes("timeout")) generalMessageForModal = "La solicitud tardó demasiado.";
        
        setModalApiError(generalMessageForModal);
    }, [clearModalErrors]);


    const fetchAllMasterData = useCallback(async (showLoadingSpinner = true) => {
        if(showLoadingSpinner) setIsLoading(true);
        setGeneralAlert({ visible: false, message: "", type: "" });
        let combinedErrorMessages = "";
        try {
            const [sedesData, categoriesData] = await Promise.allSettled([
                getAllSedes(),
                getAllCategories(),
            ]);

            if (sedesData.status === 'fulfilled' && Array.isArray(sedesData.value)) {
                setSedes(sedesData.value);
            } else {
                const reason = sedesData.status === 'rejected' ? (sedesData.reason?.response?.data?.message || sedesData.reason?.message || "Error desconocido") : "Formato de datos incorrecto.";
                console.error("Error cargando sedes:", sedesData.reason || reason);
                combinedErrorMessages += `Error sedes: ${reason}. `;
                setSedes([]);
            }

            if (categoriesData.status === 'fulfilled' && Array.isArray(categoriesData.value)) {
                setAllCategories(categoriesData.value);
            } else {
                const reason = categoriesData.status === 'rejected' ? (categoriesData.reason?.response?.data?.message || categoriesData.reason?.message || "Error desconocido") : "Formato de datos incorrecto.";
                console.error("Error cargando categorías:", categoriesData.reason || reason);
                combinedErrorMessages += `Error categorías: ${reason}. `;
                setAllCategories([]);
            }
            setCurrentSedePage(1);

        } catch (err) {
            combinedErrorMessages += `Error General al cargar datos maestros: ${err.message}.`;
            setSedes([]); 
            setAllCategories([]);
        } finally {
            if (combinedErrorMessages) {
                showAlert("danger", combinedErrorMessages.trim());
            }
            if(showLoadingSpinner) setIsLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchAllMasterData();
    }, [fetchAllMasterData]);

    const filteredSedes = useMemo(() =>
        sedes.filter(sede =>
            sede.NombreSede?.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.NombreSede.localeCompare(b.NombreSede)),
    [sedes, searchTerm]);

    const toggleFormSedeModal = useCallback(() => {
        setFormSedeModalOpen(prev => {
            if (prev) {
                setSelectedSedeToEdit(null);
                clearModalErrors();
            }
            return !prev;
        });
        if(formSedeModalOpen) setIsSaving(false);
    }, [formSedeModalOpen, clearModalErrors]);

    const handleOpenCreateSedeModal = () => {
        setSelectedSedeToEdit(null);
        clearModalErrors();
        setFormSedeModalOpen(true);
    };

    const handleOpenEditSedeModal = (sedeToEdit) => {
        setSelectedSedeToEdit(sedeToEdit);
        clearModalErrors();
        setFormSedeModalOpen(true);
    };

    const handleSaveSede = async (formDataFromForm) => {
        setIsSaving(true);
        clearModalErrors();
        const sedeIdToUpdate = selectedSedeToEdit?.id;
        const sedeName = formDataFromForm.NombreSede || (selectedSedeToEdit?.NombreSede || "La sede");
        try {
            if (sedeIdToUpdate) {
                await updateSede(sedeIdToUpdate, formDataFromForm);
            } else {
                await createSede(formDataFromForm);
            }
            toggleFormSedeModal();
            await fetchAllMasterData(false);
            showAlert('success', `Sede '${sedeName}' ${sedeIdToUpdate ? 'actualizada' : 'creada'} correctamente.`);
        } catch (err) {
            processApiErrorForModals(err, 'sede');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSedeClick = async (id, nombreSede = "La sede") => {
        const result = await Swal.fire({
            title: 'Confirmar Eliminación',
            html: `¿Está seguro de eliminar ${nombreSede}? Los ejemplares asociados quedarán sin sede. Esta acción no se puede deshacer.`,
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
                await deleteSede(id);
                await fetchAllMasterData(false);
                showAlert('info', `Sede "${nombreSede}" ha sido eliminada.`);
            } catch (err) {
                showAlert('danger', `Error al eliminar sede: ${err.response?.data?.message || err.message}`);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleViewEjemplaresInCards = useCallback(async (sedeId) => {
        const sedeSeleccionada = sedes.find(s => s.id === sedeId);
        if (!sedeSeleccionada) {
            showAlert("danger","No se pudo obtener la información de la sede seleccionada.");
            return;
        }
        setSelectedSedeNombre(sedeSeleccionada.NombreSede);
        setViewingSedeIdForSpecimens(sedeId);
        setSpecimensOfSelectedSede([]);
        setIsLoadingSpecimens(true);
        setCurrentSpecimenPage(1);
        window.scrollTo(0, 0);

        try {
            const data = await getEjemplaresBySedeId(sedeId);
            setSpecimensOfSelectedSede(Array.isArray(data) ? data.sort((a,b) => a.name.localeCompare(b.name)) : []);
            if (!Array.isArray(data)) {
                 showAlert("warning","Formato de respuesta inesperado del servidor para los ejemplares.");
            }
        } catch (err) {
            showAlert("danger",`Error cargando ejemplares: ${err.response?.data?.message || err.message}`);
            setSpecimensOfSelectedSede([]);
        } finally {
            setIsLoadingSpecimens(false);
        }
    }, [sedes, showAlert]);

    const handleReturnToSedesView = useCallback(() => {
        setViewingSedeIdForSpecimens(null);
        setSpecimensOfSelectedSede([]);
        setSelectedSedeNombre('');
        setSearchTerm('');
        setCurrentSedePage(1);
    }, []);

    const indexOfLastSede = currentSedePage * ITEMS_PER_PAGE_SEDES;
    const indexOfFirstSede = indexOfLastSede - ITEMS_PER_PAGE_SEDES;
    const currentSedesItems = useMemo(() =>
        filteredSedes.slice(indexOfFirstSede, indexOfLastSede),
        [filteredSedes, indexOfFirstSede, indexOfLastSede]
    );
    const totalSedesPages = Math.max(1, Math.ceil(filteredSedes.length / ITEMS_PER_PAGE_SEDES));

    const indexOfLastSpecimenInSede = currentSpecimenPage * ITEMS_PER_PAGE_SPECIMENS_IN_SEDE;
    const indexOfFirstSpecimenInSede = indexOfLastSpecimenInSede - ITEMS_PER_PAGE_SPECIMENS_IN_SEDE;
    const currentSpecimensInSedeItems = useMemo(() =>
        specimensOfSelectedSede.slice(indexOfFirstSpecimenInSede, indexOfLastSpecimenInSede),
        [specimensOfSelectedSede, indexOfFirstSpecimenInSede, indexOfLastSpecimenInSede]
    );
    const totalSpecimensInSedePages = Math.max(1, Math.ceil(specimensOfSelectedSede.length / ITEMS_PER_PAGE_SPECIMENS_IN_SEDE));

    const handleSedePageChange = (page) => {
        if (page < 1 || page > totalSedesPages) return;
        setCurrentSedePage(page);
        window.scrollTo(0,0);
    };
    const handleSpecimenPageChange = (page) => {
        if (page < 1 || page > totalSpecimensInSedePages) return;
        setCurrentSpecimenPage(page);
        window.scrollTo(0,0);
    };
    
    useEffect(() => {
        const newTotalSedesPages = Math.max(1, Math.ceil(filteredSedes.length / ITEMS_PER_PAGE_SEDES));
        if (currentSedePage > newTotalSedesPages) setCurrentSedePage(newTotalSedesPages);
        else if (currentSedePage < 1 && newTotalSedesPages >=1) setCurrentSedePage(1);
    }, [filteredSedes.length, currentSedePage]);

    useEffect(() => {
        const newTotalSpecimensPages = Math.max(1, Math.ceil(specimensOfSelectedSede.length / ITEMS_PER_PAGE_SPECIMENS_IN_SEDE));
        if (currentSpecimenPage > newTotalSpecimensPages) setCurrentSpecimenPage(newTotalSpecimensPages);
        else if (currentSpecimenPage < 1 && newTotalSpecimensPages >= 1) setCurrentSpecimenPage(1);
    }, [specimensOfSelectedSede.length, currentSpecimenPage]);


    const renderPagination = (currentPageNum, onPageChangeFunc, contextKey, listForTotalItems, itemsPerPageConstant) => {
        const actualTotalPages = Math.max(1, Math.ceil(listForTotalItems.length / itemsPerPageConstant));
        
        // if (actualTotalPages <= 1) return null;

        const pageNumbers = [];
        const maxPageButtons = 5;
        let startPage, endPage;

        if (actualTotalPages <= maxPageButtons) {
            startPage = 1; endPage = actualTotalPages;
        } else {
            let maxPagesBeforeCurrent = Math.floor(maxPageButtons / 2);
            let maxPagesAfterCurrent = Math.ceil(maxPageButtons / 2) - 1;
            if (currentPageNum <= maxPagesBeforeCurrent) {
                startPage = 1; endPage = maxPageButtons;
            } else if (currentPageNum + maxPagesAfterCurrent >= actualTotalPages) {
                startPage = actualTotalPages - maxPageButtons + 1; endPage = actualTotalPages;
            } else {
                startPage = currentPageNum - maxPagesBeforeCurrent; endPage = currentPageNum + maxPagesAfterCurrent;
            }
        }
        for (let i = startPage; i <= endPage; i++) { 
            if (i >= 1 && i <= actualTotalPages) pageNumbers.push(i); 
        }
        if (pageNumbers.length === 0 && actualTotalPages === 1) pageNumbers.push(1);

        return (
          <Pagination aria-label={`${contextKey} pagination`} size="sm" className="mt-4 custom-pagination" listClassName="justify-content-center">
            <PaginationItem disabled={currentPageNum <= 1}><PaginationLink onClick={() => onPageChangeFunc(currentPageNum - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink></PaginationItem>
            {startPage > 1 && (<><PaginationItem onClick={() => onPageChangeFunc(1)}><PaginationLink>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}</>)}
            {pageNumbers.map(number => (<PaginationItem active={number === currentPageNum} key={`${contextKey}-page-${number}`}><PaginationLink onClick={() => onPageChangeFunc(number)}>{number}</PaginationLink></PaginationItem>))}
            {endPage < actualTotalPages && (<>{endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}<PaginationItem onClick={() => onPageChangeFunc(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem></>)}
            <PaginationItem disabled={currentPageNum >= actualTotalPages}><PaginationLink onClick={() => onPageChangeFunc(currentPageNum + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
          </Pagination>
        );
    };


    return (
        <Container fluid className="mt-4 mb-4">
            <style>{paginationCustomCss}</style>

            {!viewingSedeIdForSpecimens && (
                <>
                    {/* Row 1: Centered Title + Icon */}
                    <Row className="mb-2">
                        <Col className="text-center">
                            <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                                <FontAwesomeIcon icon={faBuilding} size="lg" className="me-3" style={{ color: '#80B0AA' /* PaleGoldenrod */ }} />
                                Sedes
                            </h2>
                        </Col>
                    </Row>

                    {/* Row 2: Underline */}
                    <Row className="mb-3">
                        <Col>
                            <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
                        </Col>
                    </Row>

                    {/* Row 3: Controls (Search & Add Button) */}
                    {/* Conditionally render controls only if not initial loading */}
                    {!isLoading && !isProcessing && (
                         <Row className="mb-3 align-items-center">
                            <Col md="6" className="d-none d-md-block"> {/* Empty spacer for layout */}
                            </Col>
                            <Col xs="12" md="6">
                                <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                                    <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                                        <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                                        <Input
                                            type="text" placeholder="Buscar sede..." value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentSedePage(1);
                                            }}
                                            bsSize="sm" aria-label="Buscar sedes"
                                        />
                                    </InputGroup>
                                    <Button color="success" size="sm" onClick={handleOpenCreateSedeModal} className="flex-shrink-0">
                                        <FontAwesomeIcon icon={faPlus} className="me-1" /> Añadir Sede
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    )}
                </>
            )}
            
            {generalAlert.visible && (
                <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ visible: false, message: "", type: "" })} fade={false} className="mb-3">
                    {generalAlert.message}
                </Alert>
            )}

            {(isLoading || isProcessing) && !viewingSedeIdForSpecimens && !formSedeModalOpen && (
                <div className="text-center p-5">
                    <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">{isProcessing ? 'Procesando...' : 'Cargando sedes...'}</p>
                </div>
            )}

            {!isLoading && !isProcessing && !viewingSedeIdForSpecimens && (
                <>
                    <div className="mt-4">
                        {currentSedesItems.length > 0 ? (
                            currentSedesItems.map((sede) => (
                                <VenueCard
                                    key={sede.id} venue={sede}
                                    onViewEjemplares={() => handleViewEjemplaresInCards(sede.id)}
                                    onEdit={handleOpenEditSedeModal}
                                    onDelete={() => handleDeleteSedeClick(sede.id, sede.NombreSede)}
                                />
                            ))
                        ) : (
                            <Alert color="info" className="text-center mt-4" fade={false}>
                                {sedes.length === 0 ? 'Aún no hay sedes registradas.' : 'No se encontraron sedes que coincidan con su búsqueda.'}
                            </Alert>
                        )}
                        {renderPagination(currentSedePage, handleSedePageChange, "sedes-list", filteredSedes, ITEMS_PER_PAGE_SEDES)}
                    </div>
                </>
            )}

            {viewingSedeIdForSpecimens && (
                <>
                    <Row className="mb-3 align-items-center">
                        <Col xs="auto">
                            <Button color="link" onClick={handleReturnToSedesView} className="text-warning text-decoration-none p-0" style={{ fontWeight: 500 }}>
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Volver a Sedes
                            </Button>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <h3 className="mb-0 me-3 text-break">
                            Ejemplares en: {selectedSedeNombre || 'Sede'}
                            {!isLoadingSpecimens && (
                                <Badge color="warning" text="dark" pill className="ms-2 align-middle">
                                    {specimensOfSelectedSede.length}
                                </Badge>
                            )}
                        </h3>
                    </div>

                    {isLoadingSpecimens ? (
                        <div className="text-center p-5">
                            <Spinner color="info" style={{ width: '3rem', height: '3rem' }} />
                            <p className="mt-3 text-muted">Cargando ejemplares...</p>
                        </div>
                    ) : (
                        <>
                            {currentSpecimensInSedeItems.length > 0 ? (
                                <Row className="g-0">
                                    {currentSpecimensInSedeItems.map(specimen => (
                                        <SpecimenCard
                                            key={specimen.id || specimen._id}
                                            specimen={specimen}
                                            categories={allCategories}
                                            isReadOnlyView={true}
                                        />
                                    ))}
                                </Row>
                            ) : (
                                 <Alert color="info" className="text-center mt-3">No hay ejemplares registrados en esta sede.</Alert>
                            )}
                            {renderPagination(currentSpecimenPage, handleSpecimenPageChange, "specimens-in-sede", specimensOfSelectedSede, ITEMS_PER_PAGE_SPECIMENS_IN_SEDE)}
                        </>
                    )}
                </>
            )}

            {formSedeModalOpen && (
                <Modal isOpen={formSedeModalOpen} toggle={toggleFormSedeModal} centered backdrop="static" size="md">
                    <ModalHeader toggle={!isSaving ? toggleFormSedeModal : undefined}>
                        {selectedSedeToEdit ? `Editar Sede: ${selectedSedeToEdit.NombreSede}` : 'Nueva Sede'}
                    </ModalHeader>
                    <ModalBody>
                        {modalApiError && (
                            <Alert color="danger" className="mb-3" isOpen={!!modalApiError} toggle={() => setModalApiError(null)}>
                                {modalApiError}
                            </Alert>
                        )}
                        <VenueForm
                            key={`venue-form-${selectedSedeToEdit?.id || 'new'}`}
                            initialData={selectedSedeToEdit}
                            onSubmit={handleSaveSede}
                            onCancel={toggleFormSedeModal}
                            isSaving={isSaving}
                            fieldErrors={modalFieldErrors}
                        />
                    </ModalBody>
                </Modal>
            )}
        </Container>
    );
};

export default SedesPage;