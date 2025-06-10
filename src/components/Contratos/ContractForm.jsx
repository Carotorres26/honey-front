// src/components/Contracts/ContractForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Form, FormGroup, Label, Input, Button, Alert, Spinner, Row, Col, FormFeedback
} from 'reactstrap';
import Select from 'react-select'; // Para el campo de Servicios

// API Calls - Asegúrate que los paths y nombres de funciones sean correctos
import { getAllClients } from '../../api/clientApi';
import { getAllServices } from '../../api/servicesApi';
import { getAllSpecimens as fetchAllSpecimensApi } from '../../api/specimenApi'; // Renombrado para claridad

// --- Función de Validación ---
const validateField = (name, value, formData, isEditing) => {
    switch (name) {
        case "fechaInicio":
            if (!value) return "La Fecha de inicio es obligatoria.";
            return null;
        case "precioMensual":
            if (!value) return "El Precio mensual es obligatorio.";
            const precio = parseFloat(value);
            if (isNaN(precio) || precio <= 0) {
                return "El Precio mensual debe ser un número válido y mayor que cero.";
            }
            return null;
        case "clientId":
            if (!isEditing && !formData.clientAutocompleted && !value) {
                return "Debe seleccionar un Cliente.";
            }
            return null;
        case "specimenId":
            if (!isEditing && (value === null || value === undefined || value === '')) {
                return "Debe seleccionar un Ejemplar al crear un nuevo contrato.";
            }
            return null;
        case "estado":
            if (!value) return "Debe seleccionar un Estado.";
            return null;
        case "serviceIds":
            if (!Array.isArray(value) || value.length === 0) {
                return "Debe seleccionar al menos un Servicio.";
            }
            return null;
        default:
            return null;
    }
};

const ContractForm = ({
    isOpen,
    toggle,
    initialData,
    onSubmit,
    apiError: parentApiError,
    isSaving,
    fieldErrors: backendFieldErrors = {}
}) => {
    const editing = !!(initialData && (initialData.id || initialData._id));
    const formIdPrefix = `contract-form-${initialData ? (initialData.id || initialData._id || 'edit') : 'new'}`;

    const getInitialFormData = useCallback(() => {
        let initialSpecimenId = '';
        let initialSpecimenDisplayName = 'Ejemplar no asociado';
        let initialClientId = '';
        let initialClientName = '';
        let clientAutocompleted = false;

        if (editing && initialData) {
            initialClientId = initialData.client?.id?.toString() || initialData.clientId?.toString() || '';
            initialClientName = initialData.client?.nombre || '';

            if (initialData.contractSpecimens && initialData.contractSpecimens.length > 0 && initialData.contractSpecimens[0]) {
                const spec = initialData.contractSpecimens[0];
                initialSpecimenId = spec.id?.toString() || '';
                initialSpecimenDisplayName = spec.name || `Ejemplar (ID: ${initialSpecimenId}) sin nombre`;
                if (spec.propietario && spec.propietario.id?.toString() === initialClientId) {
                    initialClientName = spec.propietario.nombre || initialClientName;
                }
            } else if (initialData.specimen?.id) {
                initialSpecimenId = initialData.specimen.id.toString();
                initialSpecimenDisplayName = initialData.specimen.name || `Ejemplar (ID: ${initialSpecimenId}) sin nombre`;
                if (initialData.specimen.propietario && initialData.specimen.propietario.id?.toString() === initialClientId) {
                     initialClientName = initialData.specimen.propietario.nombre || initialClientName;
                }
            } else if (initialData.specimenId) {
                initialSpecimenId = initialData.specimenId.toString();
                initialSpecimenDisplayName = initialData.specimenName || `Buscando nombre para ID: ${initialSpecimenId}`;
            }
        }

        return {
            fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            precioMensual: initialData?.precioMensual?.toString() || '',
            clientId: initialClientId,
            estado: initialData?.estado || 'activo',
            serviceIds: initialData?.servicios?.map(s => (s.id || s._id).toString()) || initialData?.serviceIds?.map(id => id.toString()) || [],
            specimenId: initialSpecimenId,
            _currentSpecimenDisplayName: initialSpecimenDisplayName,
            _currentClientName: initialClientName,
            clientAutocompleted: clientAutocompleted,
        };
    }, [initialData, editing]);

    const [formData, setFormData] = useState(getInitialFormData);
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [dropdownLoadError, setDropdownLoadError] = useState('');

    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [allAvailableSpecimens, setAllAvailableSpecimens] = useState([]);
    const [specimensForSelectedClient, setSpecimensForSelectedClient] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
    const [isLoadingSpecimens, setIsLoadingSpecimens] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setClientFieldErrors({});
            setTouched({});
            setHasAttemptedSubmit(false);
            setDropdownLoadError('');
            return;
        }
        
        const currentInitialFormState = getInitialFormData();
        setFormData(currentInitialFormState);
        setClientFieldErrors({});
        setTouched({});
        setHasAttemptedSubmit(false);
        setDropdownLoadError('');
        setAllAvailableSpecimens([]);
        setSpecimensForSelectedClient([]);

        const loadInitialDropdownData = async () => {
            setIsLoadingDropdowns(true);
            try {
                const [clientsRes, servicesRes, specimensRes] = await Promise.allSettled([
                    getAllClients(),
                    getAllServices(true),
                    fetchAllSpecimensApi({ availableForContract: "true" })
                ]);

                const loadedClients = clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value) ? clientsRes.value : [];
                const loadedServices = servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [];
                const allLoadedAvailableSpecimens = specimensRes.status === 'fulfilled' && Array.isArray(specimensRes.value) ? specimensRes.value : [];
                
                setClients(loadedClients);
                setServices(loadedServices);
                setAllAvailableSpecimens(allLoadedAvailableSpecimens);
                
                if (!editing) {
                     setSpecimensForSelectedClient(allLoadedAvailableSpecimens);
                }

                if (editing && currentInitialFormState.specimenId && currentInitialFormState._currentSpecimenDisplayName.startsWith('Buscando')) {
                    const specimenFromInitial = initialData.contractSpecimens?.find(s => s.id?.toString() === currentInitialFormState.specimenId) ||
                                                initialData.specimen; // Fallback
                    if (specimenFromInitial?.name) {
                         setFormData(prev => ({ ...prev, _currentSpecimenDisplayName: specimenFromInitial.name }));
                    } else {
                        // Consider fetching specimen by ID if absolutely necessary and not in initialData
                        setFormData(prev => ({ ...prev, _currentSpecimenDisplayName: `Ejemplar (ID: ${currentInitialFormState.specimenId}) no encontrado` }));
                    }
                }
            } catch (error) {
                console.error("Error cargando datos para formulario de contrato:", error);
                setDropdownLoadError("Error al cargar opciones para los desplegables.");
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        loadInitialDropdownData();
    }, [isOpen, initialData, editing, getInitialFormData]);

    const runAllValidations = () => {
        const fieldsToValidate = ["fechaInicio", "precioMensual", "clientId", "specimenId", "estado", "serviceIds"];
        let newClientErrors = {};
        let formIsValid = true;
        fieldsToValidate.forEach(fieldName => {
            const value = formData[fieldName];
            const error = validateField(fieldName, value, formData, editing);
            if (error) {
                newClientErrors[fieldName] = error;
                formIsValid = false;
            } else {
                newClientErrors[fieldName] = null;
            }
        });
        setClientFieldErrors(newClientErrors);
        return formIsValid;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (!touched[name]) {
            setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        }
        const error = validateField(name, value, formData, editing);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };
    
    const handleSpecimenChange = (e) => {
        const newSpecimenId = e.target.value;
        setFormData(prev => ({ ...prev, specimenId: newSpecimenId, clientAutocompleted: false, _currentClientName: '' }));
        setTouched(prevTouched => ({ ...prevTouched, specimenId: true }));

        if (newSpecimenId && !editing) {
            const selectedSpecimen = allAvailableSpecimens.find(s => (s.id || s._id).toString() === newSpecimenId);
            if (selectedSpecimen && selectedSpecimen.propietario) {
                const ownerClientId = selectedSpecimen.propietario.id.toString();
                const ownerClient = clients.find(c => c.id.toString() === ownerClientId);
                const ownerClientName = ownerClient ? ownerClient.nombre : 'Cliente no encontrado';
                
                setFormData(prev => ({
                    ...prev,
                    clientId: ownerClientId,
                    _currentClientName: ownerClientName,
                    clientAutocompleted: true
                }));
                const clientError = validateField("clientId", ownerClientId, {...formData, clientId: ownerClientId, clientAutocompleted: true}, editing);
                setClientFieldErrors(prevErrors => ({ ...prevErrors, clientId: clientError }));
            } else {
                if (formData.clientAutocompleted) {
                    setFormData(prev => ({ ...prev, clientId: '', _currentClientName: '', clientAutocompleted: false }));
                }
            }
        } else if (!newSpecimenId && !editing) {
            if (formData.clientAutocompleted) {
                setFormData(prev => ({ ...prev, clientId: '', _currentClientName: '', clientAutocompleted: false }));
            }
        }
        
        const error = validateField("specimenId", newSpecimenId, {...formData, specimenId: newSpecimenId}, editing);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, specimenId: error }));
    };

    const handleClientChange = async (e) => {
        const newClientId = e.target.value;
        setFormData(prev => ({ ...prev, clientId: newClientId, clientAutocompleted: false, _currentClientName: '' }));
        setTouched(prevTouched => ({ ...prevTouched, clientId: true }));

        setIsLoadingSpecimens(true);
        if (newClientId && !editing) {
            try {
                const clientSpecimens = await fetchAllSpecimensApi({ clientId: newClientId, availableForContract: "true" });
                setSpecimensForSelectedClient(clientSpecimens);

                const currentSpecimenInForm = formData.specimenId;
                if (currentSpecimenInForm) {
                    const isCurrentSpecimenOfNewClient = clientSpecimens.some(s => (s.id || s._id).toString() === currentSpecimenInForm);
                    if (!isCurrentSpecimenOfNewClient) {
                        setFormData(prev => ({ ...prev, specimenId: '' }));
                         const specimenError = validateField("specimenId", "", {...formData, specimenId: ""}, editing);
                         setClientFieldErrors(prevErrors => ({ ...prevErrors, specimenId: specimenError }));
                    }
                }
            } catch (error) {
                console.error("Error filtrando ejemplares por cliente:", error);
                setDropdownLoadError("Error al cargar ejemplares para este cliente.");
                setSpecimensForSelectedClient([]);
            }
        } else if (!newClientId && !editing) {
            setSpecimensForSelectedClient(allAvailableSpecimens);
            setFormData(prev => ({ ...prev, specimenId: '' }));
            const specimenError = validateField("specimenId", "", {...formData, specimenId: ""}, editing);
            setClientFieldErrors(prevErrors => ({ ...prevErrors, specimenId: specimenError }));
        }
        setIsLoadingSpecimens(false);
        
        const error = validateField("clientId", newClientId, {...formData, clientId: newClientId}, editing);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, clientId: error }));
    };
    
    const internalHandleInputChange = (e) => {
        const { name, value } = e.target;
        if (!editing) {
            if (name === "clientId") {
                handleClientChange(e);
                return;
            }
            if (name === "specimenId") {
                handleSpecimenChange(e);
                return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        const error = validateField(name, value, {...formData, [name]: value}, editing);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const internalHandleReactSelectChange = (selectedOptions, actionMeta) => {
        const name = actionMeta.name;
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setFormData(prev => ({ ...prev, [name]: selectedIds }));
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        const error = validateField(name, selectedIds, {...formData, [name]: selectedIds}, editing);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };
    
    const serviceOptions = useMemo(() => (
        services.map(service => ({
            value: (service.id || service._id).toString(),
            label: service.nombre
        }))
    ), [services]);

    const selectedServiceObjects = useMemo(() => {
        if (!Array.isArray(serviceOptions) || !Array.isArray(formData.serviceIds)) return [];
        return serviceOptions.filter(option => formData.serviceIds.includes(option.value));
    }, [formData.serviceIds, serviceOptions]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);
        const fieldsToTouchOnSubmit = ["fechaInicio", "precioMensual", "clientId", "specimenId", "estado", "serviceIds"];
        const allRelevantFieldsTouched = fieldsToTouchOnSubmit.reduce((acc, key) => {
             if (formData.hasOwnProperty(key)) acc[key] = true;
            return acc;
        }, {});
        setTouched(prev => ({...prev, ...allRelevantFieldsTouched}));
        const isFormValid = runAllValidations();

        if (!isFormValid || isSaving || isLoadingDropdowns || isLoadingSpecimens) {
            return;
        }
        
        const contractIdToSubmit = editing ? (initialData.id || initialData._id) : undefined;
        let dataToSend = {
            fechaInicio: formData.fechaInicio,
            precioMensual: parseFloat(formData.precioMensual),
            estado: formData.estado,
            serviceIds: formData.serviceIds.map(id => parseInt(id, 10)),
        };
        if (!editing) {
            if (formData.clientId) {
                dataToSend.clientId = parseInt(formData.clientId, 10);
            }
            if (formData.specimenId && formData.specimenId !== '') { 
                dataToSend.specimenId = parseInt(formData.specimenId, 10);
            }
        }
        onSubmit(dataToSend, contractIdToSubmit);
    };

    const formButtonTitle = editing ? "Actualizar Contrato" : "Crear Contrato";
    const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
    
    const isSubmitButtonDisabled = isSaving || isLoadingDropdowns || isLoadingSpecimens ||
                               Object.keys(backendFieldErrors).length > 0 ||
                               (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));

    const specimenDropdownOptions = useMemo(() => {
        if (editing) return [];
        if (formData.clientId && !formData.clientAutocompleted) {
            return specimensForSelectedClient;
        }
        return allAvailableSpecimens;
    }, [editing, formData.clientId, formData.clientAutocompleted, specimensForSelectedClient, allAvailableSpecimens]);

    const getSpecimenOptionLabel = (specimen) => {
        let label = specimen.name;
        if (!formData.clientId && specimen.propietario && specimen.propietario.nombre) {
            label += ` (${specimen.propietario.nombre})`;
        }
        return label;
    };

    if (!isOpen) return null;

    return (
        <Form onSubmit={handleSubmit} className="mt-3" noValidate> 
            {parentApiError && !Object.keys(backendFieldErrors).length && (
                <Alert color="danger" className="mb-3">{parentApiError}</Alert>
            )}
            {dropdownLoadError && (
                <Alert color="danger" className="mb-3" toggle={() => setDropdownLoadError('')}>{dropdownLoadError}</Alert>
            )}
            {(isLoadingDropdowns || isLoadingSpecimens) && (
                <div className="text-center mb-3"><Spinner size="sm" /> 
                    {isLoadingSpecimens ? " Cargando ejemplares..." : " Cargando opciones..."}
                </div>
            )}

            <Row className="mb-3">
                <Col md={6}><FormGroup>
                    <Label for={`${formIdPrefix}-fechaInicio`} className="fw-bold">Fecha Inicio <span className="text-danger">*</span></Label>
                    <Input type="date" name="fechaInicio" id={`${formIdPrefix}-fechaInicio`} 
                           value={formData.fechaInicio} 
                           onChange={internalHandleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens} bsSize="sm" 
                           invalid={!!getFieldError('fechaInicio')} />
                    <FormFeedback>{getFieldError('fechaInicio')}</FormFeedback>
                </FormGroup></Col>
                <Col md={6}><FormGroup>
                    <Label for={`${formIdPrefix}-precioMensual`} className="fw-bold">Precio Mensual <span className="text-danger">*</span></Label>
                    <Input type="number" step="0.01" name="precioMensual" id={`${formIdPrefix}-precioMensual`} 
                           value={formData.precioMensual} 
                           onChange={internalHandleInputChange} 
                           onBlur={handleBlur}
                           min="0.01" disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens} bsSize="sm" 
                           placeholder="Ej: 150000" 
                           invalid={!!getFieldError('precioMensual')} />
                    <FormFeedback>{getFieldError('precioMensual')}</FormFeedback>
                </FormGroup></Col>
            </Row>
            <Row className="mb-3">
                <Col md={6}><FormGroup>
                    <Label for={`${formIdPrefix}-clientId`} className="fw-bold">
                        Cliente {(editing || formData.clientAutocompleted) ? '' : <span className="text-danger">*</span>}
                    </Label>
                    {editing ? (
                        <Input
                            type="text"
                            value={formData._currentClientName || (clients.find(c=>c.id.toString() === formData.clientId)?.nombre || 'Cliente no especificado')}
                            disabled
                            bsSize="sm"
                        />
                    ) : formData.clientAutocompleted ? (
                         <Input
                            type="text"
                            value={formData._currentClientName || 'Cliente autocompletado'}
                            disabled
                            bsSize="sm"
                            title="Cliente determinado por el ejemplar seleccionado."
                        />
                    ) : (
                        <Input
                            type="select" name="clientId" id={`${formIdPrefix}-clientId`}
                            value={formData.clientId} 
                            onChange={internalHandleInputChange}
                            onBlur={handleBlur}
                            disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens || clients.length === 0}
                            bsSize="sm" invalid={!!getFieldError('clientId')}
                        >
                            <option value="">{isLoadingDropdowns && !clients.length ? 'Cargando...' : '-- Seleccione Cliente --'}</option>
                            {clients.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.nombre}</option>)}
                        </Input>
                    )}
                    <FormFeedback>{getFieldError('clientId')}</FormFeedback>
                    {editing && <small className="form-text text-muted d-block mt-1">El cliente no se cambia en contratos existentes.</small>}
                    {!editing && formData.clientAutocompleted && <small className="form-text text-muted d-block mt-1">Cliente asociado al ejemplar seleccionado.</small>}
                </FormGroup></Col>
                
                <Col md={6}><FormGroup>
                    <Label for={`${formIdPrefix}-specimenId`} className="fw-bold">
                        Ejemplar {editing ? '' : <span className="text-danger">*</span>}
                    </Label>
                    {editing ? (
                        <Input
                            type="text"
                            value={formData._currentSpecimenDisplayName || 'Ejemplar no asociado'}
                            disabled 
                            bsSize="sm"
                            title={formData._currentSpecimenDisplayName?.includes('no encontrado') ? 'El ejemplar original puede haber sido eliminado o no se encontró.' : formData._currentSpecimenDisplayName}
                        />
                    ) : (
                        <Input 
                            type="select" name="specimenId" id={`${formIdPrefix}-specimenId`}
                            value={formData.specimenId} 
                            onChange={internalHandleInputChange}
                            onBlur={handleBlur}
                            disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens || specimenDropdownOptions.length === 0}
                            bsSize="sm" invalid={!!getFieldError('specimenId')}
                        >
                            <option value="">
                                {isLoadingSpecimens ? 'Cargando ejemplares...' : 
                                 (formData.clientId && !formData.clientAutocompleted && specimenDropdownOptions.length === 0 && !isLoadingSpecimens) ? 'Cliente sin ejemplares disponibles' :
                                 (!formData.clientId && specimenDropdownOptions.length === 0 && !isLoadingSpecimens) ? 'No hay ejemplares disponibles' :
                                 '-- Seleccione Ejemplar --'}
                            </option>
                            {specimenDropdownOptions.map(ej => (
                                <option key={ej.id || ej._id} value={ej.id || ej._id}>
                                    {getSpecimenOptionLabel(ej)}
                                </option> 
                            ))}
                        </Input>
                    )}
                    <FormFeedback>{getFieldError('specimenId')}</FormFeedback>
                    {editing && <small className="form-text text-muted d-block mt-1">El ejemplar no se cambia en contratos existentes.</small>}
                </FormGroup></Col>
            </Row>
            <Row className="mb-3">
                <Col md={6}><FormGroup>
                    <Label for={`${formIdPrefix}-estado`} className="fw-bold">Estado <span className="text-danger">*</span></Label>
                    <Input type="select" name="estado" id={`${formIdPrefix}-estado`} 
                           value={formData.estado} 
                           onChange={internalHandleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens} bsSize="sm" 
                           invalid={!!getFieldError('estado')}>
                        <option value="activo">Activo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                    </Input>
                    <FormFeedback>{getFieldError('estado')}</FormFeedback>
                </FormGroup></Col>
                <Col md={6}>
                    <FormGroup>
                         <Label for={`${formIdPrefix}-serviceIds`} className="fw-bold">Servicios Asociados <span className="text-danger">*</span></Label>
                         <Select
                             inputId={`${formIdPrefix}-serviceIds`} isMulti name="serviceIds"
                             options={isLoadingDropdowns ? [] : serviceOptions}
                             value={selectedServiceObjects} 
                             onChange={internalHandleReactSelectChange}
                             placeholder="Seleccione servicios..." isLoading={isLoadingDropdowns}
                             isDisabled={isSaving || isLoadingDropdowns || isLoadingSpecimens || services.length === 0} 
                             closeMenuOnSelect={false}
                             className={`react-select-container ${getFieldError('serviceIds') ? 'is-invalid' : ''}`}
                             classNamePrefix="react-select" isClearable={true}
                             noOptionsMessage={() => isLoadingDropdowns && !services.length ? 'Cargando...' : 'No hay servicios disponibles'}
                             styles={{
                                 control: (base, state) => ({
                                     ...base,
                                     minHeight: 'calc(1.5em + 0.5rem + 2px)',
                                     height: 'auto',
                                     fontSize: '0.875rem',
                                     borderColor: getFieldError('serviceIds') ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da',
                                     boxShadow: getFieldError('serviceIds') ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
                                 }),
                                 valueContainer: (base) => ({ ...base, padding: '0.1rem 0.5rem', maxHeight: '100px', overflowY: 'auto' }),
                                 input: (base) => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px' }),
                                 indicatorsContainer: (base) => ({ ...base, alignSelf: 'stretch' }),
                                 menu: base => ({ ...base, zIndex: 9999 })
                             }}
                         />
                         {getFieldError('serviceIds') && <div className="invalid-feedback d-block" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>{getFieldError('serviceIds')}</div>}
                     </FormGroup>
                </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                 <Button type="button" color="danger" onClick={toggle} disabled={isSaving || isLoadingDropdowns || isLoadingSpecimens} size="sm">
                     Cancelar
                 </Button>
                 <Button type="submit" color="success" 
                         disabled={isSubmitButtonDisabled} 
                         size="sm">
                    {isSaving ? <Spinner size="sm" /> : formButtonTitle}
                 </Button>
            </div>
        </Form>
    );
};

export default ContractForm;