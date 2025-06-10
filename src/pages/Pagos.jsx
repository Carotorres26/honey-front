// src/pages/Pagos.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Container, Row, Col, Button, Alert, Spinner, InputGroup, InputGroupText, Input,
    Modal, ModalHeader, ModalBody,
    Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faFilter, faSearch, faMoneyBillWave, // Icono para Pagos
    faChevronLeft, faChevronRight, faEye,
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import PagoTable from "../components/Pagos/PagoTable";
import PagoForm from "../components/Pagos/PagoForm";
import ViewPagoModal from "../components/Pagos/ViewPagoForm";
import pagosApi, { obtenerPagoPorId } from "../api/pagosApi";
import { getAllContracts } from "../api/contractApi";

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

const Pagos = () => {
    const [pagos, setPagos] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [pagoActual, setPagoActual] = useState(null);
    const [pagoToView, setPagoToView] = useState(null);

    const [isLoading, setIsLoading] = useState(false); // isLoading para carga general de datos
    const [isSaving, setIsSaving] = useState(false); // Para el modal de formulario
    const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Para cargar detalles de un pago

    const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });
    const [modalApiError, setModalApiError] = useState(null);
    const [modalFieldErrors, setModalFieldErrors] = useState({});

    const [selectedContractIdFilter, setSelectedContractIdFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
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

    const getFriendlyErrorMessage = useCallback((error, defaultMessage = "Ocurrió un error inesperado.") => {
        if (!error) return defaultMessage;
        const responseData = error.response?.data;
        if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
            const generalMessages = responseData.errors.filter(err => !err.path).map(err => err.msg);
            if (generalMessages.length > 0) return generalMessages.join('; ');
            return responseData.message || "Error de validación. Por favor, revise los campos.";
        }
        if (responseData && responseData.message) return responseData.message;
        if (error.message) {
            if (error.message.includes("401") || error.message.includes("403")) return "No tiene permiso para esta acción o su sesión ha expirado.";
            if (error.message.includes("Network Error")) return "Error de conexión con el servidor.";
            if (error.message.toLowerCase().includes('request failed with status code')) {
                 return responseData?.error || `Error: ${error.message.split('status code ')[1]}`;
            }
            return error.message;
        }
        return responseData?.error || defaultMessage;
    }, []);
    
    const processApiErrorForModal = useCallback((err) => {
        clearModalErrors();
        const responseData = err.response?.data;
        let mainErrorMessage = "Ocurrió un error inesperado al guardar.";
        if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
            const fieldErrorsObj = {};
            let generalModalMessages = [];
            responseData.errors.forEach(valErr => {
                if (valErr.path) { fieldErrorsObj[valErr.path] = valErr.msg; }
                else { generalModalMessages.push(valErr.msg); }
            });
            setModalFieldErrors(fieldErrorsObj);
            mainErrorMessage = responseData.message || (generalModalMessages.length > 0 ? generalModalMessages.join('; ') : "Por favor, corrija los errores en el formulario.");
        } else {
            mainErrorMessage = getFriendlyErrorMessage(err, "Ocurrió un error inesperado al guardar.");
        }
        setModalApiError(mainErrorMessage);
    }, [clearModalErrors, getFriendlyErrorMessage]);

    const cargarDatos = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        setGeneralAlert({ visible: false, message: "", type: "" });
        let accumulatedErrorMessages = [];
        try {
            const [pagosResponse, contratosResponse] = await Promise.allSettled([
                pagosApi.obtenerPagos(), getAllContracts()
            ]);
            if (pagosResponse.status === 'fulfilled' && Array.isArray(pagosResponse.value)) { setPagos(pagosResponse.value); }
            else { setPagos([]); accumulatedErrorMessages.push(`Pagos: ${getFriendlyErrorMessage(pagosResponse.reason, 'Error obteniendo lista de pagos')}`); }
            if (contratosResponse.status === 'fulfilled' && Array.isArray(contratosResponse.value)) { setContratos(contratosResponse.value.filter(c => c.estado === 'activo')); } // Solo contratos activos para filtro
            else { setContratos([]); accumulatedErrorMessages.push(`Contratos: ${getFriendlyErrorMessage(contratosResponse.reason, 'Error obteniendo lista de contratos')}`); }
        } catch (unexpectedError) {
            accumulatedErrorMessages.push(`Error general al cargar datos: ${getFriendlyErrorMessage(unexpectedError)}`);
            setPagos([]); setContratos([]);
        } finally {
            if (accumulatedErrorMessages.length > 0) { showAlert("danger", accumulatedErrorMessages.join(' | ')); }
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, [showAlert, getFriendlyErrorMessage]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const toggleFormModal = useCallback(() => {
        if (formModalOpen) { setPagoActual(null); clearModalErrors(); setIsSaving(false); }
        setFormModalOpen(prev => !prev);
    }, [formModalOpen, clearModalErrors]);

    const toggleViewModal = useCallback(() => {
        if (viewModalOpen) { setPagoToView(null); }
        setViewModalOpen(prev => !prev);
    }, [viewModalOpen]);

    const abrirModalNuevo = useCallback(() => {
        setPagoActual({ valor: "", metodoPago: "efectivo", mesPago: "", contractId: "", }); // Valores iniciales
        clearModalErrors(); setFormModalOpen(true);
    }, [clearModalErrors]);

    const abrirModalEditar = useCallback((pago) => {
        clearModalErrors();
        // Formatear para el formulario
        setPagoActual({ 
            ...pago, 
            id_pago: pago.id_pago, 
            contractId: pago.contract?.id?.toString() || pago.contractId?.toString() || '', 
            mesPago: pago.mesPago?.toString() || '', 
            valor: pago.valor?.toString() || '', 
            metodoPago: pago.metodoPago || 'efectivo', 
        });
        setFormModalOpen(true);
    }, [clearModalErrors]);

    const handleViewPago = useCallback(async (pagoBasico) => {
        if (!pagoBasico?.id_pago) { Swal.fire("Atención", "ID de pago inválido o no proporcionado.", "warning"); return; }
        setIsFetchingDetails(true); setPagoToView(null);
        try {
            const pagoCompleto = await obtenerPagoPorId(pagoBasico.id_pago);
            setPagoToView(pagoCompleto); setViewModalOpen(true);
        } catch (error) {
            console.error("Error en handleViewPago:", error);
            showAlert("danger", getFriendlyErrorMessage(error, "Error al obtener detalles del pago."));
        } finally { setIsFetchingDetails(false); }
    }, [showAlert, getFriendlyErrorMessage]);

    const manejarCambioForm = useCallback((e) => {
        const { name, value } = e.target;
        if (modalApiError) setModalApiError(null);
        if (modalFieldErrors[name]) { setModalFieldErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; }); }
        setPagoActual(prev => {
            if (!prev) return null; // Si pagoActual es null, no hacer nada (debería estar inicializado)
            const isNewPayment = !prev.id_pago; // Si no hay id_pago, es nuevo
            let updatedPago = { ...prev, [name]: value };

            if (name === 'contractId' && value && isNewPayment) { // Solo auto-rellenar para nuevos pagos
                const selectedContractIdStr = value;
                const contratoSeleccionado = contratos.find(c => (c.id || c._id)?.toString() === selectedContractIdStr);
                if (contratoSeleccionado) {
                    updatedPago.valor = contratoSeleccionado.precioMensual?.toString() ?? "";
                    // Lógica para sugerir mesPago
                    const paymentsForThisContract = pagos.filter(p => (p.contractId?.toString() === selectedContractIdStr) || (p.contract?.id?.toString() === selectedContractIdStr));
                    let suggestedMonth;
                    if (paymentsForThisContract.length > 0) {
                        const maxMonthPaid = Math.max(0, ...paymentsForThisContract.map(p => Number(p.mesPago || 0)));
                        suggestedMonth = maxMonthPaid >= 12 ? 1 : maxMonthPaid + 1; // Si ya pagó diciembre, sugiere enero
                    } else {
                        // Si no hay pagos, sugiere el mes actual
                        suggestedMonth = new Date().getMonth() + 1;
                    }
                    updatedPago.mesPago = suggestedMonth.toString();
                } else {
                    // Si el contrato no se encuentra o se deselecciona, limpiar valor y mes
                    updatedPago.valor = "";
                    updatedPago.mesPago = "";
                }
            }
            return updatedPago;
        });
    }, [modalApiError, modalFieldErrors, contratos, pagos]);

    const manejarEnvioForm = useCallback(async () => {
        if (!pagoActual) { showAlert("danger", "Error interno: No hay datos de pago para procesar."); return; }
        setIsSaving(true); clearModalErrors();
        let tempFieldErrors = {}; // Validaciones básicas del lado del cliente
        if (!pagoActual.mesPago || isNaN(parseInt(pagoActual.mesPago, 10)) || parseInt(pagoActual.mesPago, 10) < 1 || parseInt(pagoActual.mesPago, 10) > 12) { tempFieldErrors.mesPago = "El mes de pago debe ser un número entre 1 y 12."; }
        if (!pagoActual.valor || isNaN(parseFloat(pagoActual.valor)) || parseFloat(pagoActual.valor) <= 0) { tempFieldErrors.valor = "El valor debe ser un número positivo."; }
        if (!pagoActual.metodoPago || String(pagoActual.metodoPago).trim() === "") { tempFieldErrors.metodoPago = "El método de pago es obligatorio."; }
        
        const isNew = !pagoActual.id_pago;
        let currentContractIdForValidation = pagoActual.contractId;

        if (isNew) {
            if (!currentContractIdForValidation || String(currentContractIdForValidation).trim() === "") { tempFieldErrors.contractId = "El ID del contrato es obligatorio."; }
            else { const parsedId = parseInt(currentContractIdForValidation, 10); if (isNaN(parsedId) || parsedId <= 0) { tempFieldErrors.contractId = "El ID del contrato debe ser un número entero positivo."; } }
        }

        if (Object.keys(tempFieldErrors).length > 0) { setModalFieldErrors(tempFieldErrors); setModalApiError("Por favor, corrija los errores marcados."); setIsSaving(false); return; }

        let datosParaApi = { mesPago: parseInt(pagoActual.mesPago, 10), valor: parseFloat(pagoActual.valor), metodoPago: pagoActual.metodoPago, };
        if (isNew) { datosParaApi.contractId = parseInt(currentContractIdForValidation, 10); }
        else { datosParaApi.id_pago = pagoActual.id_pago; } // Asegurarse que el ID del pago se envíe para actualización

        try {
            const apiResponse = await pagosApi.guardarPago(datosParaApi); // guardarPago maneja si es crear o actualizar
            const successMessage = apiResponse?.message || (isNew ? "Pago creado exitosamente." : "Pago actualizado exitosamente.");
            toggleFormModal(); await cargarDatos(false); showAlert("success", successMessage); setCurrentPage(1); 
        } catch (error) { console.error("Error en manejarEnvioForm (llamada API):", error); processApiErrorForModal(error); }
        finally { setIsSaving(false); }
    }, [pagoActual, toggleFormModal, cargarDatos, processApiErrorForModal, clearModalErrors, showAlert]);

    const filteredPagos = useMemo(() => {
        let filtered = Array.isArray(pagos) ? [...pagos] : [];
        if (selectedContractIdFilter) { filtered = filtered.filter(p => (p.contractId?.toString() === selectedContractIdFilter) || (p.contract?.id?.toString() === selectedContractIdFilter)); }
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(p => {
                const clientName = p.contract?.client?.nombre?.toLowerCase() || ''; const contractIdText = p.contract?.id?.toString() || p.contractId?.toString() || '';
                const paymentIdText = p.id_pago?.toString() || ''; const mesPagoText = p.mesPago?.toString() || '';
                return (clientName.includes(lowerSearchTerm) || contractIdText.includes(lowerSearchTerm) || paymentIdText.includes(lowerSearchTerm) || mesPagoText.includes(lowerSearchTerm) || (p.metodoPago?.toLowerCase() || '').includes(lowerSearchTerm) || (p.valor?.toString() || '').includes(lowerSearchTerm));
            });
        }
        // Ordenar por fecha de pago, más reciente primero
        return filtered.sort((a, b) => new Date(b.fechaPago || 0) - new Date(a.fechaPago || 0));
    }, [pagos, selectedContractIdFilter, searchTerm]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentTableData = useMemo(() => filteredPagos.slice(indexOfFirstItem, indexOfLastItem), [filteredPagos, indexOfFirstItem, indexOfLastItem]);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredPagos.length / ITEMS_PER_PAGE)), [filteredPagos.length]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber); window.scrollTo(0,0);
    };

    useEffect(() => { // Ajustar página si filtros cambian
        const newTotalPages = Math.max(1, Math.ceil(filteredPagos.length / ITEMS_PER_PAGE));
        if (currentPage > newTotalPages) { setCurrentPage(newTotalPages); }
        else if (currentPage < 1 && newTotalPages > 0) { setCurrentPage(1); }
    }, [searchTerm, selectedContractIdFilter, filteredPagos.length, currentPage]); // Dependencias correctas

    const renderPagination = () => {
        const actualTotalPages = totalPages;
        const pageNumbers = [];
        const maxPageButtons = 5;
        let startPage, endPage;

        if (actualTotalPages <= maxPageButtons) {
            startPage = 1; endPage = actualTotalPages;
        } else {
            let maxPagesBeforeCurrent = Math.floor(maxPageButtons / 2);
            let maxPagesAfterCurrent = Math.ceil(maxPageButtons / 2) - 1;
            if (currentPage <= maxPagesBeforeCurrent) { startPage = 1; endPage = maxPageButtons; }
            else if (currentPage + maxPagesAfterCurrent >= actualTotalPages) { startPage = actualTotalPages - maxPageButtons + 1; endPage = actualTotalPages; }
            else { startPage = currentPage - maxPagesBeforeCurrent; endPage = currentPage + maxPagesAfterCurrent; }
        }
        // startPage y endPage ya están dentro de [1, actualTotalPages] por la lógica anterior
        for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }

        const prevDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= actualTotalPages;
        const showFirstPageButton = startPage > 1;
        const showLastPageButton = endPage < actualTotalPages;
        const showLeftEllipsis = startPage > 2;
        const showRightEllipsis = endPage < actualTotalPages - 1;

        // if (actualTotalPages <= 1) return null; // Removido para que siempre se muestre

        return (
          <Pagination aria-label="Pagos pagination" size="sm" listClassName="justify-content-center" className="justify-content-center mt-4 custom-pagination">
            <PaginationItem disabled={prevDisabled}><PaginationLink onClick={() => !prevDisabled && handlePageChange(currentPage - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink></PaginationItem>
            {showFirstPageButton && (<PaginationItem onClick={() => handlePageChange(1)}><PaginationLink>1</PaginationLink></PaginationItem>)}
            {showLeftEllipsis && (<PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>)}
            {pageNumbers.map(number => (<PaginationItem active={number === currentPage} key={number}><PaginationLink onClick={() => handlePageChange(number)}>{number}</PaginationLink></PaginationItem>))}
            {showRightEllipsis && (<PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>)}
            {showLastPageButton && (<PaginationItem onClick={() => handlePageChange(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem>)}
            <PaginationItem disabled={nextDisabled}><PaginationLink onClick={() => !nextDisabled && handlePageChange(currentPage + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
          </Pagination>
        );
    };

    return (
        <Container fluid className="mt-4 mb-4">
            <style>{paginationCustomCss}</style>

            {/* START: New Dashboard-like Header for Pagos */}
            <Row className="mb-2">
                <Col className="text-center">
                    <h2 className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem' }}>
                        <FontAwesomeIcon icon={faMoneyBillWave} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                        Pagos
                    </h2>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col>
                    <hr className="mt-0" style={{ borderTop: '1px solid #e9ecef', opacity: 0 }}/>
                </Col>
            </Row>

            {!(isLoading || isFetchingDetails) && ( // Conditionally render controls section
                 <Row className="mb-3 align-items-center">
                    <Col md="auto" className="my-1 my-md-0"> {/* Ajuste para que el título del filtro no se vea mal */}
                    </Col>
                    <Col>
                        <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-stretch gap-2">
                            <InputGroup size="sm" style={{ minWidth: '200px', maxWidth: '300px' }}>
                                <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                                <Input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} aria-label="Buscar pago"/>
                            </InputGroup>
                            <InputGroup size="sm" style={{ minWidth: '220px', maxWidth: '350px' }}>
                                <InputGroupText><FontAwesomeIcon icon={faFilter} /></InputGroupText>
                                <Input type="select" name="contractFilter" id="contractFilter" value={selectedContractIdFilter} onChange={(e) => {setSelectedContractIdFilter(e.target.value); setCurrentPage(1);}} disabled={contratos.length === 0} title="Filtrar por Contrato">
                                    <option value="">Todos los Contratos</option>
                                    {contratos.map(c => ( <option key={c.id || c._id} value={c.id || c._id}>Contrato #{(c.id || c._id)} {c.client ? `- ${c.client.nombre}` : ''}</option> ))}
                                </Input>
                            </InputGroup>
                            <Button color="success" size="sm" onClick={abrirModalNuevo} disabled={isSaving} className="flex-shrink-0" title="Registrar un nuevo pago">
                                <FontAwesomeIcon icon={faPlus} className="me-1" /> Nuevo Pago
                            </Button>
                        </div>
                    </Col>
                </Row>
            )}
            {/* END: New Dashboard-like Header for Pagos */}
            
            {generalAlert.visible && ( <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mt-3">{generalAlert.message}</Alert> )}
            
            {/* Removed old header section */}

            {(isLoading || isFetchingDetails) && (!isSaving) && ( 
                <div className="text-center p-3">
                    <Spinner style={{ width: '3rem', height: '3rem' }} color="primary" />
                    <p className="ms-2 fst-italic mt-2">
                        {isLoading && 'Cargando datos...'}
                        {isFetchingDetails && 'Cargando detalles del pago...'}
                    </p>
                </div> 
            )}
            
            {!isLoading && !isFetchingDetails && (
                filteredPagos.length > 0 ? (
                    <div className="table-responsive">
                        <PagoTable pagos={currentTableData} onEdit={abrirModalEditar} onView={handleViewPago}/>
                    </div>
                ) : (
                    <Alert color="info" className="text-center mt-3" fade={false}>
                        {searchTerm || selectedContractIdFilter ? "No se encontraron pagos que coincidan con los filtros." : "Aún no hay pagos registrados."}
                    </Alert>
                )
            )}
            
            {!isLoading && !isFetchingDetails && renderPagination()} {/* El paginador ahora se muestra siempre, totalPages es al menos 1 */}

            {formModalOpen && (
                <Modal isOpen={formModalOpen} toggle={!isSaving ? toggleFormModal : undefined} backdrop="static" centered size="lg" onClosed={() => { setPagoActual(null); clearModalErrors(); }}>
                    <ModalHeader toggle={!isSaving ? toggleFormModal : undefined}>{pagoActual?.id_pago ? "Editar Pago" : "Registrar Nuevo Pago"}</ModalHeader>
                    <ModalBody>
                        <PagoForm key={`pago-form-${pagoActual?.id_pago || 'new'}-${formModalOpen ? 'open' : 'closed'}`} pagoActual={pagoActual} manejarCambioDirecto={manejarCambioForm} onFormSubmit={manejarEnvioForm} onFormCancel={toggleFormModal} contratos={contratos} isSaving={isSaving} apiError={modalApiError} fieldErrors={modalFieldErrors} clearApiError={clearModalErrors}/>
                    </ModalBody>
                </Modal>
            )}
            {pagoToView && viewModalOpen && ( <ViewPagoModal isOpen={viewModalOpen} toggle={toggleViewModal} pago={pagoToView} key={`view-pago-${pagoToView.id_pago || 'details'}-${viewModalOpen}`}/> )}
        </Container>
    );
};

export default Pagos;