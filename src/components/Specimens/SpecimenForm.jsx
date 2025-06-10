// src/components/Specimens/SpecimenForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, FormGroup, Label, Input, Button, Alert, Spinner, Row, Col, FormFeedback } from 'reactstrap';

// --- Función de Validación Específica ---
const validateField = (name, value, formData, isEditing, isMoveMode, initialData) => {
    if (isMoveMode) {
        // En modo movimiento, las validaciones de campo individuales no aplican aquí directamente.
        // La validación principal es si hubo un cambio efectivo, que se maneja
        // en runAllValidations y se refleja en localFormError.
        return null;
    }

    // Validaciones para modo creación/edición normal
    switch (name) {
        case "name":
            if (!value?.trim()) return "El Nombre del ejemplar es obligatorio.";
            return null;
        case "specimenCategoryId":
            if (!value) return "La Categoría es obligatoria."; // value es el ID, no necesita trim
            return null;
        case "clientId":
            // Obligatorio solo al crear (no editando, no moviendo)
            if (!isEditing && !value) return "El Propietario es obligatorio al crear.";
            // Si el propietario fuera siempre obligatorio después de la creación y no se pudiera desasignar:
            // if (!isMoveMode && !value) return "El Propietario es obligatorio.";
            return null;
        case "breed":
            if (!value?.trim()) return "La Raza es obligatoria.";
            return null;
        case "color":
            if (!value?.trim()) return "El Color es obligatorio.";
            return null;
        case "birthDate":
            if (!value) return "La Fecha de Nacimiento es obligatoria."; // value es YYYY-MM-DD
            // Validar que la fecha no sea futura (ya se hace en el input type=date, pero doble check es bueno)
            const today = new Date();
            const birth = new Date(value);
            today.setHours(0,0,0,0); // Normalizar para comparación de solo fecha
            birth.setHours(0,0,0,0); // Normalizar para comparación de solo fecha
            if (birth > today) {
                return "La fecha de nacimiento no puede ser futura.";
            }
            return null;
        case "sedeId": 
            if (!value) return "La Sede es obligatoria."; // value es el ID
            return null;
        default:
            return null;
    }
};

const SpecimenForm = ({
    initialData = null,
    categories = [],
    sedes = [],
    clients = [],
    onSubmit,
    onCancel,
    apiError: parentApiError,
    isSaving,
    isMoveMode = false,
    fieldErrors: backendFieldErrors = {}
}) => {
    const isEditing = !!(initialData?.id || initialData?._id);

    const getInitialFormData = useCallback(() => ({
        name: initialData?.name || '',
        breed: initialData?.breed || '',
        color: initialData?.color || '',
        birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
        specimenCategoryId: initialData?.specimenCategoryId?.toString() || initialData?.category?.id?.toString() || '',
        sedeId: initialData?.sedeId?.toString() || initialData?.sede?.id?.toString() || '',
        clientId: initialData?.clientId?.toString() || initialData?.propietario?.id?.toString() || '',
    }), [initialData]);

    const [formData, setFormData] = useState(getInitialFormData);
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [localFormError, setLocalFormError] = useState('');


    useEffect(() => {
        setFormData(getInitialFormData());
        setClientFieldErrors({});
        setTouched({});
        setLocalFormError('');
        setHasAttemptedSubmit(false);
    }, [initialData, getInitialFormData, isMoveMode]);


    const runAllValidations = () => {
        let newClientErrors = {};
        let formIsValid = true;
        
        if (isMoveMode) {
            setClientFieldErrors({}); // No hay errores de campo individuales en moveMode
            const currentSedeId = initialData?.sedeId?.toString() || initialData?.sede?.id?.toString() || '';
            const currentCategoryId = initialData?.specimenCategoryId?.toString() || initialData?.category?.id?.toString() || '';
            const formSede = formData.sedeId?.toString();
            const formCategory = formData.specimenCategoryId?.toString();
            let changedSede = formSede !== currentSedeId;
            if (currentSedeId && formSede === '') changedSede = true;
            let changedCategory = formCategory !== currentCategoryId;
            if (currentCategoryId && formCategory === '') changedCategory = true;

            if (!changedSede && !changedCategory) {
                setLocalFormError('Para mover, debe seleccionar una nueva Categoría o Sede diferente a la actual, o desasociar.');
                formIsValid = false;
            } else {
                setLocalFormError('');
            }
        } else {
            setLocalFormError(''); // Limpiar error general si no es moveMode
            const fieldsToValidate = ["name", "specimenCategoryId", "clientId", "breed", "color", "birthDate", "sedeId"]; 
            fieldsToValidate.forEach(fieldName => {
                const value = formData[fieldName];
                const error = validateField(fieldName, value, formData, isEditing, isMoveMode, initialData);
                if (error) {
                    newClientErrors[fieldName] = error;
                    formIsValid = false;
                } else {
                    newClientErrors[fieldName] = null;
                }
            });
            setClientFieldErrors(newClientErrors);
        }
        return formIsValid;
    };
    
    const internalHandleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        const error = validateField(name, value, {...formData, [name]:value }, isEditing, isMoveMode, initialData);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));

        if (localFormError) setLocalFormError('');
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (!touched[name]) {
            setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        }
        const error = validateField(name, value, formData, isEditing, isMoveMode, initialData);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        let fieldsToTouch = ["name", "specimenCategoryId", "clientId", "breed", "color", "birthDate", "sedeId"];
        if (isMoveMode) {
            fieldsToTouch = ["specimenCategoryId", "sedeId"]; // Solo estos son relevantes para tocar en moveMode
        }
        const allRelevantFieldsTouched = fieldsToTouch.reduce((acc, key) => {
            if (formData.hasOwnProperty(key)) { // Asegurar que el campo existe en formData
                 acc[key] = true;
            }
            return acc;
        }, {});
        setTouched(prev => ({...prev, ...allRelevantFieldsTouched}));

        const isFormValid = runAllValidations();

        if (!isFormValid || isSaving) {
            return;
        }

        const specimenIdToSubmit = initialData?.id || initialData?._id;
        let dataToSend;

        if (isMoveMode) {
            dataToSend = {};
            const initialSedeId = initialData?.sedeId?.toString() || initialData?.sede?.id?.toString() || '';
            const initialCategoryId = initialData?.specimenCategoryId?.toString() || initialData?.category?.id?.toString() || '';
            
            // Solo enviar si el valor es diferente del original Y no es una cadena vacía (a menos que sea para desasociar)
            if (formData.specimenCategoryId !== initialCategoryId) {
                dataToSend.specimenCategoryId = formData.specimenCategoryId ? parseInt(formData.specimenCategoryId, 10) : null;
            }
            if (formData.sedeId !== initialSedeId) {
                dataToSend.sedeId = formData.sedeId ? parseInt(formData.sedeId, 10) : null;
            }
            // La validación en runAllValidations (con localFormError) ya cubre el caso de "no cambios efectivos".
        } else { 
            dataToSend = {
                name: formData.name.trim(),
                breed: formData.breed.trim(),
                color: formData.color.trim(),
                birthDate: formData.birthDate, // Ya validado como no vacío
                specimenCategoryId: parseInt(formData.specimenCategoryId, 10), // Ya validado como no vacío
                sedeId: parseInt(formData.sedeId, 10), // Ya validado como no vacío
                clientId: formData.clientId ? parseInt(formData.clientId, 10) : null, // Puede ser null si se edita y no era obligatorio
            };
        }
        onSubmit(dataToSend, specimenIdToSubmit);
    };

    const propietarioDisabled = isSaving || clients.length === 0 || isMoveMode || 
                              (isEditing && !!(initialData?.clientId || initialData?.propietario?.id));
    const readOnlyNameForMove = isMoveMode;
    const otherFieldsReadOnlyInMoveMode = isMoveMode;

    const title = isMoveMode ? "Mover Ejemplar" : (isEditing ? "Editar Ejemplar" : "Nuevo Ejemplar");
    const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));

    const isButtonDisabled = isSaving || 
                           (hasAttemptedSubmit && (Object.values(clientFieldErrors).some(err => err !== null) || !!localFormError)) ||
                           Object.keys(backendFieldErrors).length > 0;

    return (
        <div className="border p-3 rounded">
            <Form onSubmit={handleSubmit} className="mt-3" noValidate>
                {parentApiError && !Object.keys(backendFieldErrors).length && 
                    <Alert color="danger" className="mb-3" toggle={onCancel}>{parentApiError}</Alert>
                }
                {localFormError && <Alert color="warning" className="mb-3" toggle={() => setLocalFormError('')}>{localFormError}</Alert>}

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenName" className="fw-bold">Nombre{!isMoveMode ? <span className="text-danger">*</span> : ''}</Label>
                            <Input id="specimenName" name="name" type="text" 
                                   value={formData.name} 
                                   onChange={internalHandleInputChange} 
                                   onBlur={handleBlur}
                                   readOnly={readOnlyNameForMove} 
                                   disabled={isSaving || readOnlyNameForMove} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('name')}/>
                            <FormFeedback>{getFieldError('name')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenCategory" className="fw-bold">Categoría{!isMoveMode ? <span className="text-danger">*</span> : (isMoveMode ? ' Nueva' : '')}</Label>
                            <Input id="specimenCategory" name="specimenCategoryId" type="select" 
                                   value={formData.specimenCategoryId} 
                                   onChange={internalHandleInputChange} 
                                   onBlur={handleBlur}
                                   disabled={isSaving || categories.length === 0} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('specimenCategoryId')}>
                                <option value="">-- Seleccione Categoría --</option>
                                {categories.map(cat => <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>)}
                            </Input>
                            <FormFeedback>{getFieldError('specimenCategoryId')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenBreed" className="fw-bold">Raza{!isMoveMode ? <span className="text-danger">*</span> : ''}</Label>
                            <Input id="specimenBreed" name="breed" type="text" 
                                   value={formData.breed} 
                                   onChange={internalHandleInputChange} 
                                   placeholder="Ej: P1, P2, etc."      
                                   onBlur={handleBlur}
                                   readOnly={otherFieldsReadOnlyInMoveMode} 
                                   disabled={isSaving || otherFieldsReadOnlyInMoveMode} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('breed')}/>
                            <FormFeedback>{getFieldError('breed')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenColor" className="fw-bold">Color{!isMoveMode ? <span className="text-danger">*</span> : ''}</Label>
                            <Input id="specimenColor" name="color" type="text" 
                                   value={formData.color} 
                                   onChange={internalHandleInputChange} 
                                   onBlur={handleBlur}
                                   readOnly={otherFieldsReadOnlyInMoveMode} 
                                   disabled={isSaving || otherFieldsReadOnlyInMoveMode} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('color')}/>
                            <FormFeedback>{getFieldError('color')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenBirthDate" className="fw-bold">Fecha Nacimiento{!isMoveMode ? <span className="text-danger">*</span> : ''}</Label>
                            <Input id="specimenBirthDate" name="birthDate" type="date" 
                                   value={formData.birthDate} 
                                   onChange={internalHandleInputChange} 
                                   onBlur={handleBlur}
                                   readOnly={otherFieldsReadOnlyInMoveMode} 
                                   disabled={isSaving || otherFieldsReadOnlyInMoveMode} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('birthDate')}/>
                            <FormFeedback>{getFieldError('birthDate')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenSede" className="fw-bold">
                                Sede {isMoveMode ? 'Nueva' : 'Actual'}
                                {!isMoveMode ? <span className="text-danger">*</span> : ''}
                            </Label>
                            <Input id="specimenSede" name="sedeId" type="select" 
                                   value={formData.sedeId} 
                                   onChange={internalHandleInputChange} 
                                   onBlur={handleBlur}
                                   disabled={isSaving || sedes.length === 0} 
                                   bsSize="sm" 
                                   invalid={!!getFieldError('sedeId')}>
                                <option value="">-- Seleccione Sede --</option>
                                {sedes.map(sede => <option key={sede.id || sede._id} value={sede.id || sede._id}>{sede.NombreSede}</option>)}
                            </Input>
                             <FormFeedback>{getFieldError('sedeId')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for="specimenClient" className="fw-bold">Propietario{(!isMoveMode && !isEditing) ? <span className="text-danger">*</span> : ''}</Label>
                            <Input
                                id="specimenClient" name="clientId" type="select" 
                                value={formData.clientId} 
                                onChange={internalHandleInputChange} 
                                onBlur={handleBlur}
                                disabled={propietarioDisabled} 
                                bsSize="sm"
                                invalid={!!getFieldError('clientId')}
                            >
                                <option value="">-- Seleccione Propietario --</option>
                                {clients.map(client => (<option key={client.id || client._id} value={client.id || client._id}>{client.nombre}</option>))}
                            </Input>
                            {(isEditing && !!(initialData?.clientId || initialData?.propietario?.id) && propietarioDisabled && !isMoveMode) && 
                                <small className="text-muted d-block mt-1">El propietario no se puede modificar.</small>
                            }
                            <FormFeedback>{getFieldError('clientId')}</FormFeedback>
                        </FormGroup>
                    </Col>
                     <Col md={6}></Col> 
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                    <Button type="button" color="danger" onClick={onCancel} disabled={isSaving} size="sm">
                       Cancelar
                    </Button>
                    <Button type="submit" color="success" disabled={isButtonDisabled} size="sm">
                        {isSaving ? <Spinner size="sm" /> : title} 
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default SpecimenForm;