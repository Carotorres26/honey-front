// src/pages/SpecimensPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Row, Col, Button, Input, Spinner, Alert,
    Modal, ModalHeader, ModalBody, Card, CardHeader,
    InputGroup, InputGroupText, Badge,
    Pagination, PaginationItem, PaginationLink
} from 'reactstrap';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faSearch, faArrowLeft, faHorseHead, faExchangeAlt,
    faEdit, faTrash, faEye, faToggleOn, faToggleOff,
    faChevronLeft, faChevronRight,
    faHorse // Changed from faThLarge to faHorse
} from '@fortawesome/free-solid-svg-icons';
// faHorseHead is still used for the "Sin Categoría" card's badge if needed.

// API Imports
import { getAllCategories, createCategory, updateCategory as updateCategoryApi, deleteCategory } from '../api/categoryApi';
import { getAllSpecimens, createSpecimenApi, updateSpecimen as updateSpecimenApi, deleteSpecimen as deleteSpecimenApi, moveSpecimen as moveSpecimenApi } from '../api/specimenApi';
import { getAllSedes } from '../api/sedeApi';
import { getAllClients } from '../api/clientApi';

// Component Imports
import CategoryCard from '../components/Categories/CategoryCard';
import CategoryForm from '../components/Categories/CategoryForm.jsx';
import SpecimenForm from '../components/Specimens/SpecimenForm';
import ViewSpecimenModal from '../components/Specimens/ViewSpecimenForm.jsx';
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

const ITEMS_PER_PAGE_CATEGORIES = 5;
const ITEMS_PER_PAGE_SPECIMENS = 3;
const ALERT_DURATION = 4000;

const SpecimensPage = () => {
    const [categories, setCategories] = useState([]);
    const [specimens, setSpecimens] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [isSavingSpecimen, setIsSavingSpecimen] = useState(false);

    const [generalAlert, setGeneralAlert] = useState({ visible: false, message: "", type: "info" });

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [specimenEditModalOpen, setSpecimenEditModalOpen] = useState(false);
    const [isSpecimenMoveMode, setIsSpecimenMoveMode] = useState(false);
    const [specimenViewModalOpen, setSpecimenViewModalOpen] = useState(false);

    const [modalApiError, setModalApiError] = useState(null);
    const [modalFieldErrors, setModalFieldErrors] = useState({});

    const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState(null);
    const [selectedSpecimenToEdit, setSelectedSpecimenToEdit] = useState(null);
    const [specimenToView, setSpecimenToView] = useState(null);
    const [viewingCategoryId, setViewingCategoryId] = useState(null);
    const [categoryStatusLoading, setCategoryStatusLoading] = useState({});

    const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
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
        } else if (err.message) {
            generalMessageForModal = err.message;
        }

        if (generalMessageForModal.includes("Network Error")) generalMessageForModal = "Error de conexión. Verifique su red.";
        if (generalMessageForModal.includes("timeout")) generalMessageForModal = "La solicitud tardó demasiado.";

        setModalApiError(generalMessageForModal);
    }, [clearModalErrors]);

    const handleViewCategorySpecimens = useCallback((categoryId) => {
        const idStr = categoryId?.toString();
        if (idStr) {
            setViewingCategoryId(idStr);
            setSearchTerm('');
            setLocalSearchTerm('');
            setCurrentSpecimenPage(1);
            window.scrollTo(0, 0);
        }
    }, []);

    const handleReturnToCategories = useCallback(() => {
        setViewingCategoryId(null);
        setSearchTerm('');
        setLocalSearchTerm('');
        setCurrentSpecimenPage(1);
    }, []);

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        setGeneralAlert({ visible: false, message: "", type: "" });
        let combinedErrorMessages = "";
        try {
            const [catRes, specRes, sedRes, cliRes] = await Promise.allSettled([
                getAllCategories(true), getAllSpecimens(), getAllSedes(), getAllClients()
            ]);
            const processResult = (res, name, setter) => {
                if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                     setter(res.value);
                } else {
                    const reason = res.status === 'rejected' ? (res.reason?.response?.data?.message || res.reason?.message || "Error desconocido") : "Formato de datos incorrecto.";
                    console.error(`Error cargando ${name}:`, res.reason || reason);
                    combinedErrorMessages += `Error ${name}: ${reason}. `;
                    setter([]);
                }
            };
            processResult(catRes, 'categorías', setCategories);
            processResult(specRes, 'ejemplares', setSpecimens);
            processResult(sedRes, 'sedes', setSedes);
            processResult(cliRes, 'clientes', setClients);
        } catch (err) {
             combinedErrorMessages += `Error General al cargar datos: ${err.message}.`;
             setCategories([]); setSpecimens([]); setSedes([]); setClients([]);
        } finally {
            if (combinedErrorMessages) {
                showAlert("danger", combinedErrorMessages.trim());
            }
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, [showAlert]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getCategoryNameById = (idStr) => {
        if (!idStr || idStr === 'sin_categoria') return 'Ejemplares Sin Categoría';
        const category = categories.find(c => (c.id || c._id)?.toString() === idStr);
        return category ? category.name : 'Categoría Desconocida';
    };
    
    const currentViewingCategoryName = useMemo(() => getCategoryNameById(viewingCategoryId), [viewingCategoryId, categories]);

     const filteredSpecimensGlobalSearch = useMemo(() => {
        if (viewingCategoryId || !searchTerm.trim()) return [];
        const lowerSearch = searchTerm.toLowerCase().trim();
        return specimens.filter(spec =>
            spec.name?.toLowerCase().includes(lowerSearch) ||
            spec.propietario?.nombre?.toLowerCase().includes(lowerSearch) ||
            spec.identifier?.toLowerCase().includes(lowerSearch) ||
            (spec.id || spec._id)?.toString().includes(lowerSearch)
       ).sort((a,b) => a.name.localeCompare(b.name));
     }, [specimens, searchTerm, viewingCategoryId]);

     const specimensByCategory = useMemo(() => {
        if (!specimens.length) return {};
        const byCategory = specimens.reduce((acc, spec) => {
            const categoryIdString = spec.specimenCategoryId?.toString() || spec.category?.id?.toString();
            const key = categoryIdString && categoryIdString !== 'null' && categoryIdString !== 'undefined' ? categoryIdString : 'sin_categoria';
            if (!acc[key]) acc[key] = [];
            acc[key].push(spec);
            return acc;
        }, {});
        for (const key in byCategory) {
            byCategory[key].sort((a,b) => a.name.localeCompare(b.name));
        }
        return byCategory;
     }, [specimens]);

    const toggleCategoryModal = useCallback(() => { setCategoryModalOpen(p => { if (p) setSelectedCategoryToEdit(null); clearModalErrors(); return !p; }); if (!categoryModalOpen) setIsSavingCategory(false); }, [categoryModalOpen, clearModalErrors]);
    const toggleSpecimenEditModal = useCallback(() => { setSpecimenEditModalOpen(p => { if (p) { setSelectedSpecimenToEdit(null); setIsSpecimenMoveMode(false); } clearModalErrors(); return !p; }); if (!specimenEditModalOpen) setIsSavingSpecimen(false); }, [specimenEditModalOpen, clearModalErrors]);
    const toggleSpecimenViewModal = useCallback((specimen = null) => { setSpecimenToView(specimen); setSpecimenViewModalOpen(p => !p); }, []);
    const handleAddNewCategory = useCallback(() => { setSelectedCategoryToEdit(null); clearModalErrors(); setCategoryModalOpen(true); }, [clearModalErrors]);
    const handleEditCategory = useCallback((category) => { setSelectedCategoryToEdit({ id: category.id || category._id, name: category.name, estado: category.estado }); clearModalErrors(); setCategoryModalOpen(true); }, [clearModalErrors]);

    const handleSaveCategory = useCallback(async (formData) => {
        setIsSavingCategory(true); clearModalErrors();
        const catId = selectedCategoryToEdit?.id || selectedCategoryToEdit?._id;
        const catName = formData.name?.trim() || (selectedCategoryToEdit?.name || 'La categoría');
        try {
             let data = { name: formData.name?.trim() };
             if (catId) { await updateCategoryApi(catId, data); } 
             else { data.estado = formData.estado === undefined ? 'activo' : formData.estado; await createCategory(data); }
             toggleCategoryModal(); await fetchData(false);
             showAlert("success", `Categoría '${catName}' ${catId ? 'actualizada' : 'creada'}.`);
        } catch (err) { processApiErrorForModals(err, 'categoría'); } 
        finally { setIsSavingCategory(false); }
    }, [selectedCategoryToEdit, fetchData, processApiErrorForModals, clearModalErrors, toggleCategoryModal, showAlert]);

    const handleDeleteCategory = useCallback(async (catIdDel) => {
        const idStr = catIdDel?.toString(); if (!idStr) return;
        const cat = categories.find(c => (c.id || c._id)?.toString() === idStr);
        if (!cat) { showAlert("danger", 'Categoría no encontrada.'); return; }
        const res = await Swal.fire({ title: '¿Eliminar?', html: `Seguro eliminar "<b>${cat.name}</b>"? Los ejemplares asociados quedarán sin categoría.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar' });
        if (res.isConfirmed) {
             setIsProcessing(true);
             try {
                 await deleteCategory(idStr);
                 if (viewingCategoryId === idStr) handleReturnToCategories();
                 await fetchData(false); showAlert("success", `Categoría "${cat.name}" eliminada.`);
             } catch (err) { showAlert("danger", `Error: ${err.response?.data?.message || err.message}`); }
             finally { setIsProcessing(false); }
         }
    }, [categories, viewingCategoryId, fetchData, showAlert, handleReturnToCategories]);

    const handleToggleCategoryStatus = useCallback(async (cat) => {
        const catId = cat.id || cat._id; if (!catId) return;
        const newEstado = cat.estado === 'activo' ? 'inactivo' : 'activo';
        const action = newEstado === 'activo' ? "activar" : "desactivar";
        const res = await Swal.fire({ title: `¿${action.charAt(0).toUpperCase() + action.slice(1)}?`, html: `Seguro ${action} "<b>${cat.name}</b>"?`, icon: 'question', showCancelButton: true, confirmButtonText: `Sí, ${action}` });
        if (!res.isConfirmed) return;
        setCategoryStatusLoading(prev => ({ ...prev, [catId]: true }));
        try {
            await updateCategoryApi(catId, { estado: newEstado });
            await fetchData(false); showAlert("success", `Categoría "${cat.name}" ahora ${newEstado}.`);
        } catch (err) { showAlert("danger", `Error: ${err.response?.data?.message || err.message}`); }
        finally { setCategoryStatusLoading(prev => ({ ...prev, [catId]: false }));}
    }, [fetchData, showAlert]);

    const handleAddNewSpecimen = useCallback(() => {
        let prefill = {}; if (viewingCategoryId && viewingCategoryId !== 'sin_categoria') prefill.specimenCategoryId = viewingCategoryId;
        setSelectedSpecimenToEdit(Object.keys(prefill).length ? prefill : null);
        setIsSpecimenMoveMode(false); clearModalErrors(); setSpecimenEditModalOpen(true);
    }, [viewingCategoryId, clearModalErrors]);
    const handleEditSpecimen = useCallback((spec) => { setSelectedSpecimenToEdit(spec); setIsSpecimenMoveMode(false); clearModalErrors(); setSpecimenEditModalOpen(true); }, [clearModalErrors]);
    const handleMoveSpecimen = useCallback((spec) => { setSelectedSpecimenToEdit(spec); setIsSpecimenMoveMode(true); clearModalErrors(); setSpecimenEditModalOpen(true); }, [clearModalErrors]);
    const handleViewSpecimen = useCallback((spec) => { setSpecimenToView(spec); setSpecimenViewModalOpen(true); }, []);

    const handleDeleteSpecimen = useCallback(async (specIdDel) => {
        const idStr = specIdDel?.toString(); if (!idStr) return;
        const spec = specimens.find(s => (s.id || s._id)?.toString() === idStr);
        if (!spec) { showAlert("danger", 'Ejemplar no encontrado.'); return; }
        const res = await Swal.fire({ title: '¿Eliminar?', html: `Seguro eliminar "<b>${spec.name}</b>"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#d33'});
        if (res.isConfirmed) {
            setIsProcessing(true);
            try { await deleteSpecimenApi(idStr); await fetchData(false); showAlert("success", `Ejemplar "${spec.name}" eliminado.`); }
            catch (err) { showAlert("danger", `Error: ${err.response?.data?.message || err.message}`); }
            finally { setIsProcessing(false); }
        }
    }, [specimens, fetchData, showAlert]);

    const handleSaveSpecimen = useCallback(async (formData, specIdInput) => {
        setIsSavingSpecimen(true); clearModalErrors();
        const currentId = specIdInput?.toString();
        const parse = (id) => (id===undefined||id===null||id===''||id==='null')?null:(isNaN(parseInt(id,10))?String(id):parseInt(id,10));
        let name = formData.name?.trim() || selectedSpecimenToEdit?.name || (currentId ? 'El ejemplar' : 'Nuevo');
        try {
            const dataToSave = {
                name:formData.name?.trim(),
                identifier: formData.identifier?.trim(),
                breed:formData.breed?.trim(),
                color:formData.color?.trim(),
                birthDate:formData.birthDate,
                specimenCategoryId:parse(formData.specimenCategoryId),
                sedeId:parse(formData.sedeId),
                clientId:parse(formData.clientId),
                estado: formData.estado === undefined ? true : formData.estado,
                gender: formData.gender,
                imageUrl: formData.imageUrl
            };

            if (isSpecimenMoveMode && currentId) {
                const p = {}; const o = selectedSpecimenToEdit || {};
                const fcId=parse(formData.specimenCategoryId); const fsId=parse(formData.sedeId);
                const ocId=parse(o.specimenCategoryId||o.category?.id); const osId=parse(o.sedeId||o.sede?.id);
                if (fcId!==ocId)p.specimenCategoryId=fcId; if(fsId!==osId)p.sedeId=fsId;
                if (Object.keys(p).length > 0) await moveSpecimenApi(currentId, p);
            } else {
                currentId ? await updateSpecimenApi(currentId, dataToSave) : await createSpecimenApi(dataToSave);
            }
            toggleSpecimenEditModal(); await fetchData(false);
            showAlert("success", `Ejemplar '${name}' ${isSpecimenMoveMode?'movido':(currentId?'actualizado':'creado')}.`);
        } catch (err) { processApiErrorForModals(err, 'ejemplar'); } 
        finally { setIsSavingSpecimen(false); }
     }, [isSpecimenMoveMode, selectedSpecimenToEdit, fetchData, processApiErrorForModals, clearModalErrors, toggleSpecimenEditModal, showAlert]);
    
    const sortedCategoriesMemo = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
    const indexOfLastCategory = currentCategoryPage * ITEMS_PER_PAGE_CATEGORIES;
    const indexOfFirstCategory = indexOfLastCategory - ITEMS_PER_PAGE_CATEGORIES;
    const currentCategoryItems = useMemo(() => sortedCategoriesMemo.slice(indexOfFirstCategory, indexOfLastCategory), [sortedCategoriesMemo, indexOfFirstCategory, indexOfLastCategory]);
    const totalCategoryPages = Math.max(1, Math.ceil(sortedCategoriesMemo.length / ITEMS_PER_PAGE_CATEGORIES));

    const specimensToDisplay = useMemo(() => {
        if (viewingCategoryId) {
            let specimensInCat = (specimensByCategory[viewingCategoryId] || []);
            if (localSearchTerm.trim()) {
                const lowerLocalSearch = localSearchTerm.toLowerCase().trim();
                specimensInCat = specimensInCat.filter(spec =>
                    spec.name?.toLowerCase().includes(lowerLocalSearch) ||
                    spec.identifier?.toLowerCase().includes(lowerLocalSearch) ||
                    (spec.id || spec._id)?.toString().includes(lowerLocalSearch)
                );
            }
            return specimensInCat;
        }
        if (searchTerm.trim() && !viewingCategoryId) {
            return filteredSpecimensGlobalSearch;
        }
        return []; 
    }, [viewingCategoryId, specimensByCategory, localSearchTerm, searchTerm, filteredSpecimensGlobalSearch]);

    const indexOfLastSpecimenCard = currentSpecimenPage * ITEMS_PER_PAGE_SPECIMENS;
    const indexOfFirstSpecimenCard = indexOfLastSpecimenCard - ITEMS_PER_PAGE_SPECIMENS;
    const currentSpecimenCardItems = useMemo(() => specimensToDisplay.slice(indexOfFirstSpecimenCard, indexOfLastSpecimenCard), [specimensToDisplay, indexOfFirstSpecimenCard, indexOfLastSpecimenCard]);
    const totalSpecimenCardPages = Math.max(1, Math.ceil(specimensToDisplay.length / ITEMS_PER_PAGE_SPECIMENS));

    const handleCategoryPageChange = (page) => { if (page >= 1 && page <= totalCategoryPages) { setCurrentCategoryPage(page); window.scrollTo(0,0); }};
    const handleSpecimenPageChange = (page) => { if (page >= 1 && page <= totalSpecimenCardPages) { setCurrentSpecimenPage(page); window.scrollTo(0,0); }};

    useEffect(() => {
        const newTotal = Math.max(1, Math.ceil(specimensToDisplay.length / ITEMS_PER_PAGE_SPECIMENS));
        if (currentSpecimenPage > newTotal && newTotal > 0) setCurrentSpecimenPage(newTotal);
        else if (currentSpecimenPage < 1 && newTotal > 0) setCurrentSpecimenPage(1);
    }, [specimensToDisplay.length, currentSpecimenPage]);

    useEffect(() => {
        if (!viewingCategoryId && !searchTerm.trim()) {
            const newTotal = Math.max(1, Math.ceil(sortedCategoriesMemo.length / ITEMS_PER_PAGE_CATEGORIES));
            if (currentCategoryPage > newTotal && newTotal > 0) setCurrentCategoryPage(newTotal);
            else if (currentCategoryPage < 1 && newTotal > 0) setCurrentCategoryPage(1);
        }
    }, [viewingCategoryId, searchTerm, sortedCategoriesMemo.length, currentCategoryPage]);

    const renderCustomPagination = (currentPageNum, onPageChangeFunc, contextKey, listForTotalItems, itemsPerPageConstant, alwaysVisible = false) => {
        const actualTotalPages = Math.max(1, Math.ceil(listForTotalItems.length / itemsPerPageConstant)); 
        
        if (!alwaysVisible && actualTotalPages <= 1 && listForTotalItems.length <= itemsPerPageConstant) return null;
        if (!alwaysVisible && listForTotalItems.length === 0 && !isLoading) return null; 
        
        const pageNumbers = [];
        const maxPageButtons = 5; let startPage, endPage;
        if (actualTotalPages <= maxPageButtons) { startPage = 1; endPage = actualTotalPages; } 
        else { let mid = Math.floor(maxPageButtons / 2); if (currentPageNum <= mid+1) { startPage = 1; endPage = maxPageButtons; } 
        else if (currentPageNum + mid -1 >= actualTotalPages) { startPage = actualTotalPages - maxPageButtons + 1; endPage = actualTotalPages; } 
        else { startPage = currentPageNum - mid; endPage = currentPageNum + (maxPageButtons -1 - mid); } }
        for (let i = startPage; i <= endPage; i++) { if (i >= 1 && i <= actualTotalPages) pageNumbers.push(i); }
        
        return (
          <Pagination aria-label={`${contextKey} pagination`} size="sm" className="mt-4 custom-pagination" listClassName="justify-content-center">
            <PaginationItem disabled={currentPageNum <= 1}><PaginationLink onClick={() => onPageChangeFunc(currentPageNum - 1)} aria-label="Anterior"><FontAwesomeIcon icon={faChevronLeft} /></PaginationLink></PaginationItem>
            {startPage > 1 && (<><PaginationItem onClick={() => onPageChangeFunc(1)}><PaginationLink>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}</>)}
            {pageNumbers.map(n => (<PaginationItem active={n === currentPageNum} key={`${contextKey}-${n}`}><PaginationLink onClick={() => onPageChangeFunc(n)}>{n}</PaginationLink></PaginationItem>))}
            {endPage < actualTotalPages && (<>{endPage < actualTotalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}<PaginationItem onClick={() => onPageChangeFunc(actualTotalPages)}><PaginationLink>{actualTotalPages}</PaginationLink></PaginationItem></>)}
            <PaginationItem disabled={currentPageNum >= actualTotalPages}><PaginationLink onClick={() => onPageChangeFunc(currentPageNum + 1)} aria-label="Siguiente"><FontAwesomeIcon icon={faChevronRight} /></PaginationLink></PaginationItem>
          </Pagination>
        );
    };

    return (
        <Container fluid className="mt-4 mb-4 specimens-page">
            <style>{paginationCustomCss}</style>

            {!viewingCategoryId && !searchTerm.trim() && (
                <>
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
                                    icon={faHorse} // Changed to faHorse
                                    size="lg" 
                                    className="me-3" 
                                    style={{ color: '#80B0AA' }} 
                                />
                                Categorías
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
                </>
            )}

            {generalAlert.visible && (
                <Alert color={generalAlert.type} isOpen={generalAlert.visible} toggle={() => setGeneralAlert({ ...generalAlert, visible: false })} fade={false} className="mb-3">
                    {generalAlert.message}
                </Alert>
            )}

            <Row className="mb-3 align-items-center">
                 <Col xs="12" md="auto" className="mb-2 mb-md-0">
                    {viewingCategoryId ? ( 
                       <Button color="link" onClick={handleReturnToCategories} title="Volver a Categorías" className="text-decoration-none p-0" style={{ fontWeight: 500, color: '#ffc107' }}>
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Volver a Categorías
                        </Button>
                    ) : null }
                 </Col>
                 <Col xs="12" md>
                    {!viewingCategoryId && (
                       <div className="d-flex flex-column flex-sm-row justify-content-md-end align-items-stretch gap-2">
                           <InputGroup size="sm" className="flex-grow-1" style={{ maxWidth: '400px' }}>
                               <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                               <Input 
                                   type="text" 
                                   placeholder="Buscar ejemplar globalmente..." 
                                   value={searchTerm} 
                                   onChange={(e) => { 
                                       setSearchTerm(e.target.value); 
                                       setCurrentSpecimenPage(1);
                                       if (e.target.value.trim()) setViewingCategoryId(null);
                                   }} 
                                   disabled={isLoading || isProcessing} 
                                   aria-label="Buscar ejemplar"/>
                           </InputGroup>
                           <Button color="success" size="sm" onClick={handleAddNewCategory} disabled={isLoading || isProcessing} className="flex-shrink-0">
                               <FontAwesomeIcon icon={faPlus} className="me-1" /> Crear Categoría
                           </Button>
                           <Button color="success" size="sm" onClick={handleAddNewSpecimen} disabled={isLoading || isProcessing} className="flex-shrink-0">
                               <FontAwesomeIcon icon={faPlus} className="me-1" /> Crear Ejemplar
                           </Button>
                       </div>
                    )}
                 </Col>
             </Row>

            {(isLoading && !isProcessing) && (
                <div className="text-center p-5"> <Spinner /> <p className="mt-2 text-muted">Cargando datos...</p> 
                </div>
            )}
             {isProcessing && (
                <div className="text-center p-5"> <Spinner /> <p className="mt-2 text-muted">Procesando...</p> </div>
            )}


            {!isLoading && !isProcessing && (
                <>
                    {viewingCategoryId ? (
                        <Row className="mt-3">
                            <Col xs="12">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <h3 className="mb-0 me-auto text-break"> 
                                         {currentViewingCategoryName}
                                         <Badge color="warning" text="dark" pill className="ms-2 align-middle">{specimensToDisplay.length}</Badge>
                                     </h3>
                                    <InputGroup size="sm" className="my-2 my-md-0 mx-md-2" style={{ maxWidth: '300px', minWidth: '200px' }}>
                                        <InputGroupText><FontAwesomeIcon icon={faSearch} /></InputGroupText>
                                        <Input
                                            type="text"
                                            placeholder="Buscar en esta categoría..."
                                            value={localSearchTerm}
                                            onChange={(e) => {
                                                setLocalSearchTerm(e.target.value);
                                                setCurrentSpecimenPage(1); 
                                            }}
                                            disabled={isLoading} 
                                            aria-label="Buscar ejemplar en categoría"
                                        />
                                    </InputGroup>
                                    <Button color="success" size="sm" onClick={handleAddNewSpecimen} className="flex-shrink-0">
                                        <FontAwesomeIcon icon={faPlus} className="me-1" /> Añadir Ejemplar aquí
                                    </Button>
                                </div>
                                {currentSpecimenCardItems.length > 0 ? (
                                    <Row className="g-3"> 
                                        {currentSpecimenCardItems.map(specimen => (
                                            <SpecimenCard
                                                key={specimen.id || specimen._id}
                                                specimen={specimen} categories={categories}
                                                onEdit={handleEditSpecimen} onDelete={handleDeleteSpecimen}
                                                onMove={handleMoveSpecimen} onView={handleViewSpecimen}
                                            />
                                        ))}
                                    </Row>
                                ) : (
                                    <Alert color="info" className="text-center mt-3" fade={false}>
                                        {localSearchTerm.trim() ? (
                                            <>No se encontraron ejemplares que coincidan con "<b>{localSearchTerm}</b>" en esta categoría.</>
                                        ) : (
                                            <>No hay ejemplares {viewingCategoryId === 'sin_categoria' ? 'sin categoría asignada' : `en la categoría "${currentViewingCategoryName}"`}.</>
                                        )}
                                    </Alert>
                                )}
                                {renderCustomPagination(currentSpecimenPage, handleSpecimenPageChange, "specimens-in-category", specimensToDisplay, ITEMS_PER_PAGE_SPECIMENS, specimensToDisplay.length > 0)}
                            </Col>
                        </Row>
                    ) : (
                        <>
                            {searchTerm.trim() ? ( 
                                <Row className="mt-3">
                                     <Col xs="12">
                                         <h4 className="mb-3">Resultados de Búsqueda Global para: "<strong>{searchTerm}</strong>"</h4>
                                        {currentSpecimenCardItems.length > 0 ? (
                                            <Row className="g-3">
                                                {currentSpecimenCardItems.map(specimen => (
                                                    <SpecimenCard
                                                        key={specimen.id || specimen._id}
                                                        specimen={specimen} categories={categories}
                                                        onEdit={handleEditSpecimen} onDelete={handleDeleteSpecimen}
                                                        onMove={handleMoveSpecimen} onView={handleViewSpecimen}
                                                    />
                                                ))}
                                            </Row>
                                        ) : (
                                            <Alert color="info" className="text-center mt-3" fade={false}>
                                                No se encontraron ejemplares que coincidan con la búsqueda.
                                            </Alert>
                                        )}
                                        {renderCustomPagination(currentSpecimenPage, handleSpecimenPageChange, "specimens-global-search", specimensToDisplay, ITEMS_PER_PAGE_SPECIMENS, specimensToDisplay.length > 0)}
                                    </Col>
                                </Row>
                            ) : (
                                <div className="category-list-container mt-3">
                                    <Row>
                                        <Col xs={12}>
                                            {currentCategoryItems.length > 0 ? (
                                                currentCategoryItems.map(category => {
                                                    const categoryIdStr = (category.id || category._id)?.toString();
                                                    if (!categoryIdStr) return null;
                                                    return (
                                                        <CategoryCard
                                                            key={categoryIdStr} category={category}
                                                            specimenCount={specimensByCategory[categoryIdStr]?.length || 0}
                                                            onViewSpecimens={handleViewCategorySpecimens}
                                                            onEditCategory={handleEditCategory}
                                                            onDeleteCategory={() => handleDeleteCategory(categoryIdStr)}
                                                            onToggleStatus={() => handleToggleCategoryStatus(category)}
                                                            isLoadingStatus={!!categoryStatusLoading[categoryIdStr]}
                                                            className="mb-3"
                                                        />
                                                    );
                                                })
                                            ) : (
                                                categories.length === 0 && !isLoading && (
                                                    <Alert color="light" className='text-center py-4 text-dark border' fade={false}>
                                                        No hay categorías registradas.
                                                    </Alert>
                                                )
                                            )}
                                            {renderCustomPagination(currentCategoryPage, handleCategoryPageChange, "categories-list", sortedCategoriesMemo, ITEMS_PER_PAGE_CATEGORIES, true)}

                                            {specimensByCategory['sin_categoria']?.length > 0 &&
                                             (sortedCategoriesMemo.length === 0 || (currentCategoryPage === totalCategoryPages && totalCategoryPages >=1) || (totalCategoryPages <=1 && currentCategoryItems.length < ITEMS_PER_PAGE_CATEGORIES)) &&
                                             !searchTerm.trim() && !viewingCategoryId && 
                                             (
                                                 <Card key="sin_categoria_card" className="mt-3 shadow-sm category-list-card border-start border-warning border-4">
                                                    <CardHeader className="d-flex justify-content-between align-items-center py-3 px-3" onClick={() => handleViewCategorySpecimens('sin_categoria')} style={{ cursor: 'pointer' }} title="Ver ejemplares Sin Categoría">
                                                        <h5 className="mb-0 text-dark">Ejemplares Sin Categoría</h5>
                                                        <Badge color="warning" text="dark" pill>{specimensByCategory['sin_categoria'].length} <FontAwesomeIcon icon={faHorseHead} size="xs"/></Badge>
                                                    </CardHeader>
                                                    <div className="text-center py-3 px-3">
                                                        <small className="text-muted">Ver ejemplares no asignados a una categoría específica.</small>
                                                    </div>
                                                </Card>
                                             )}
                                        </Col>
                                    </Row>
                                 </div>
                            )}
                        </>
                    )}
                </>
            )}

            {categoryModalOpen && (
                <Modal isOpen={categoryModalOpen} toggle={!isSavingCategory ? toggleCategoryModal : undefined} centered backdrop="static">
                    <ModalHeader toggle={!isSavingCategory ? toggleCategoryModal : undefined}>
                        {selectedCategoryToEdit?.id ? `Editar Categoría: ${selectedCategoryToEdit.name}` : 'Nueva Categoría'}
                    </ModalHeader>
                    <ModalBody><CategoryForm initialData={selectedCategoryToEdit} onSubmit={handleSaveCategory} onCancel={toggleCategoryModal} apiError={modalApiError} isSaving={isSavingCategory} key={`cat-form-${selectedCategoryToEdit?.id||'new'}`} fieldErrors={modalFieldErrors} /></ModalBody>
                </Modal>
            )}
            {specimenEditModalOpen && (
                <Modal isOpen={specimenEditModalOpen} toggle={!isSavingSpecimen ? toggleSpecimenEditModal : undefined} size="lg" backdrop="static" centered>
                    <ModalHeader toggle={!isSavingSpecimen ? toggleSpecimenEditModal : undefined}>
                        {isSpecimenMoveMode ? `Mover Ejemplar: ${selectedSpecimenToEdit?.name||''}` : (selectedSpecimenToEdit?.id ? `Editar Ejemplar: ${selectedSpecimenToEdit?.name||''}` : 'Nuevo Ejemplar')}
                    </ModalHeader>
                    <ModalBody><SpecimenForm initialData={selectedSpecimenToEdit} categories={categories.filter(c => c.estado === 'activo')} sedes={sedes} clients={clients} onSubmit={handleSaveSpecimen} onCancel={toggleSpecimenEditModal} apiError={modalApiError} isSaving={isSavingSpecimen} isMoveMode={isSpecimenMoveMode} key={`spec-form-${selectedSpecimenToEdit?.id||'new'}-${isSpecimenMoveMode}`} fieldErrors={modalFieldErrors} /></ModalBody>
                </Modal>
            )}
            {specimenViewModalOpen && specimenToView && (
                <ViewSpecimenModal isOpen={specimenViewModalOpen} toggle={() => toggleSpecimenViewModal(null)} specimen={specimenToView} categories={categories} sedes={sedes} clients={clients} />
            )}
        </Container>
    );
};

export default SpecimensPage;