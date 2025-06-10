// src/components/Clients/ClientForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Spinner,
    Alert,
    FormFeedback,
    Row,
    Col
} from 'reactstrap';

// --- Función de Validación Específica ---
const validateField = (name, value, formData) => { // isEditing no es necesario aquí si las reglas son las mismas
    const trimmedValue = value.trim();
    switch (name) {
        case "nombre":
            if (!trimmedValue) return "El nombre del cliente es obligatorio.";
            if (trimmedValue.length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        case "documento":
            if (!trimmedValue) return "El documento del cliente es obligatorio.";
            if (!/^\d+$/.test(trimmedValue)) return "El documento solo debe contener números.";
            if (trimmedValue.length < 9 || trimmedValue.length > 11) {
                return "El documento debe tener entre 9 y 11 dígitos.";
            }
            return null;
        case "email":
            if (!trimmedValue) return "El correo electrónico es obligatorio.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
                return "El formato del correo electrónico no es válido.";
            }
            return null;
        case "celular":
            if (!trimmedValue) return "El número de celular es obligatorio.";
            if (!/^\d+$/.test(trimmedValue)) return "El celular solo debe contener números.";
            if (trimmedValue.length !== 10) return "El celular debe tener exactamente 10 dígitos.";
            return null;
        default:
            return null;
    }
};


const ClientForm = ({
  initialData,
  onSubmit,
  onCancel,
  apiError: parentApiError, // Renombrado para claridad
  fieldErrors: backendFieldErrors = {}, // Renombrado para claridad
  isSaving,
}) => {
    const getInitialClientState = useCallback(() => ({
        nombre: initialData?.nombre || '',
        documento: initialData?.documento || '',
        email: initialData?.email || '',
        celular: initialData?.celular || '',
    }), [initialData]);

    // Renombrar 'client' a 'formData' para consistencia con otros forms
    const [formData, setFormData] = useState(getInitialClientState()); 
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    // localFormError ya no se usa, los errores son por campo

    const isEditing = !!initialData; // No se usa directamente en la lógica de validación aquí, pero útil para el título

    useEffect(() => {
        setFormData(getInitialClientState());
        setClientFieldErrors({});
        setTouched({});
        setHasAttemptedSubmit(false);
    }, [initialData, getInitialClientState]);


    const internalHandleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        const error = validateField(name, value, {...formData, [name]: value});
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (!touched[name]) {
            setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        }
        const error = validateField(name, value, formData);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const runAllValidations = () => {
        const fieldsToValidate = ["nombre", "documento", "email", "celular"];
        let newClientErrors = {};
        let formIsValid = true;

        fieldsToValidate.forEach(fieldName => {
            const value = formData[fieldName];
            const error = validateField(fieldName, value, formData);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        const allFieldsTouched = Object.keys(formData)
            .filter(key => ["nombre", "documento", "email", "celular"].includes(key))
            .reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {});
        setTouched(prev => ({...prev, ...allFieldsTouched}));

        const isFormValid = runAllValidations();

        if (!isFormValid || isSaving) {
            return;
        }
        // Enviar formData directamente, ya que el padre lo espera así (según la prop `onSubmit(client)`)
        // Si el padre espera un objeto procesado, se haría aquí.
        onSubmit(formData); 
    };

    const formTitle = isEditing ? 'Actualizar Cliente' : 'Agregar Cliente';
    const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
    
    const isButtonDisabled = isSaving || 
                           (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null)) ||
                           Object.keys(backendFieldErrors).length > 0;

    return (
        <div className="border p-3 rounded">
            <Form onSubmit={handleSubmit} className="mt-3" noValidate>
                {parentApiError && !Object.keys(backendFieldErrors).length && (
                    <Alert color="danger" className="mb-3">{parentApiError}</Alert>
                )}
                {/* localFormError ya no se usa aquí */}

                <Row className="mb-3">
                    <Col md={12}>
                        <FormGroup>
                            <Label for="client-nombre" className="fw-bold">Nombre <span className="text-danger">*</span></Label>
                            <Input
                                type="text" name="nombre" id="client-nombre"
                                value={formData.nombre}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                // placeholder="ej: algun nombre"
                                disabled={isSaving} bsSize="sm"
                                invalid={!!getFieldError('nombre')}
                            />
                            <FormFeedback>{getFieldError('nombre')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                        <FormGroup>
                            <Label for="client-documento" className="fw-bold">Documento <span className="text-danger">*</span></Label>
                            <Input
                                type="text" name="documento" id="client-documento" // type="text" para no filtrar auto
                                value={formData.documento}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                // placeholder="ej: 1234567890"
                                disabled={isSaving} bsSize="sm"
                                maxLength={11}
                                invalid={!!getFieldError('documento')}
                            />
                            <FormFeedback>{getFieldError('documento')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                        <FormGroup>
                            <Label for="client-email" className="fw-bold">Correo Electrónico <span className="text-danger">*</span></Label>
                            <Input
                                type="email" name="email" id="client-email"
                                value={formData.email}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                placeholder="ejemplo@dominio.com"
                                disabled={isSaving} bsSize="sm"
                                invalid={!!getFieldError('email')}
                            />
                            <FormFeedback>{getFieldError('email')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                        <FormGroup>
                            <Label for="client-celular" className="fw-bold">Celular <span className="text-danger">*</span></Label>
                            <Input
                                type="text" name="celular" id="client-celular" // type="text" para no filtrar auto
                                value={formData.celular}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                // placeholder="ej: 3001234567"
                                disabled={isSaving} bsSize="sm"
                                maxLength={10}
                                invalid={!!getFieldError('celular')}
                            />
                            <FormFeedback>{getFieldError('celular')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                    <Button color="danger" type="button" onClick={onCancel} disabled={isSaving} size="sm">
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={isButtonDisabled} size="sm">
                        {isSaving ? <Spinner size="sm" /> : formTitle}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default ClientForm;