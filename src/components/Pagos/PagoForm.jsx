import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Form, FormGroup, Label, Input, Button, Spinner, Row, Col, Alert, FormFeedback
} from "reactstrap";

const numberInputStyle = `
  .no-spinners::-webkit-outer-spin-button,
  .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .no-spinners { -moz-appearance: textfield; }
`;

// --- Función de Validación Específica ---
const validateField = (name, value, pagoActualData, isEditing) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    switch (name) {
        case "contractId":
            if (!isEditing && !value) return "Debe seleccionar un contrato.";
            return null;
        case "mesPago":
            if (String(trimmedValue).trim() === '') return "El mes de pago es obligatorio.";
            const mesNum = parseInt(trimmedValue, 10);
            if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
                return "El mes de pago debe ser un número entre 1 y 12.";
            }
            return null;
        case "valor":
            if (String(trimmedValue).trim() === '') return "El valor del pago es obligatorio.";
            const valorNum = parseFloat(trimmedValue);
            if (isNaN(valorNum) || valorNum <= 0) {
                return "El valor del pago debe ser un número positivo.";
            }
            return null;
        case "metodoPago":
            if (!value) return "Debe seleccionar un método de pago.";
            return null;
        default:
            return null;
    }
};

const PagoForm = ({
    onFormCancel,
    onFormSubmit,
    pagoActual,
    manejarCambioDirecto,
    contratos = [],
    isSaving = false,
    apiError: parentApiError,
    clearApiError,
    fieldErrors: backendFieldErrors = {},
}) => {
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [nombreClienteDelContrato, setNombreClienteDelContrato] = useState('');

    const {
        valor = "",
        metodoPago = "efectivo",
        mesPago = "",
        contractId = "",
        id_pago,
        fechaPago
    } = pagoActual || {};

    const isEditing = !!id_pago;
    const formIdPrefix = `pago-form-${isEditing ? id_pago : 'new'}`;

    const runAllValidations = useCallback(() => {
        const fieldsToValidate = ["contractId", "mesPago", "valor", "metodoPago"];
        let newClientErrors = {};
        let formIsValid = true;
        
        const currentFormData = pagoActual || { valor, metodoPago, mesPago, contractId };

        fieldsToValidate.forEach(fieldName => {
            const valueToValidate = currentFormData[fieldName];
            const error = validateField(fieldName, valueToValidate, currentFormData, isEditing);
            if (error) {
                newClientErrors[fieldName] = error;
                formIsValid = false;
            } else {
                newClientErrors[fieldName] = null;
            }
        });
        setClientFieldErrors(newClientErrors);
        return formIsValid;
    }, [pagoActual, isEditing, valor, metodoPago, mesPago, contractId]);

    useEffect(() => {
        setClientFieldErrors({});
        setTouched({});
        setHasAttemptedSubmit(false);
        if (parentApiError && typeof clearApiError === 'function') {
            clearApiError();
        }
    }, [pagoActual, clearApiError, parentApiError]);

    useEffect(() => {
        if (contractId && contratos.length > 0) {
            const contratoSeleccionado = contratos.find(c => (c.id || c._id)?.toString() === contractId.toString());
            setNombreClienteDelContrato(contratoSeleccionado?.client?.nombre || 'Cliente no encontrado');
        } else {
            setNombreClienteDelContrato('');
        }
    }, [contractId, contratos]);

    const internalHandleInputChange = (e) => {
        manejarCambioDirecto(e);

        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        
        const updatedFormDataForValidation = { ...(pagoActual || {}), [name]: value };
        const error = validateField(name, value, updatedFormDataForValidation, isEditing);
        setClientFieldErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
        const error = validateField(name, value, pagoActual || {}, isEditing);
        setClientFieldErrors(prev => ({ ...prev, [name]: error }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        const fieldsToTouch = ["contractId", "mesPago", "valor", "metodoPago"];
        const allFieldsTouched = fieldsToTouch.reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {});
        setTouched(prev => ({ ...prev, ...allFieldsTouched }));
        
        const isFormValid = runAllValidations();

        if (!isFormValid || isSaving) {
            return;
        }

        if (typeof onFormSubmit === 'function') {
            onFormSubmit();
        } else {
            console.warn("PagoForm: onFormSubmit no es una función!");
        }
    };

    const formButtonTitle = isEditing ? "Actualizar Pago" : "Crear Pago";

    const getFieldError = (name) => {
        if (backendFieldErrors[name]) return backendFieldErrors[name];
        if ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]) {
            return clientFieldErrors[name];
        }
        return null;
    };
    
    const isSubmitButtonDisabled = useMemo(() => {
        if (isSaving) return true;
        if (Object.keys(backendFieldErrors).length > 0) return true;

        // Condición explícita y prioritaria para contractId en NUEVOS pagos
        // Si es un nuevo pago y contractId es nulo, undefined, o una cadena vacía (después de trim), deshabilitar.
        if (!isEditing && (!contractId || String(contractId).trim() === "")) {
            return true;
        }

        const hasClientErrors = Object.values(clientFieldErrors).some(err => err !== null);
        if (hasAttemptedSubmit && hasClientErrors) return true;
        
        // Si no se ha intentado enviar, pero ya hay errores en campos tocados
        for (const fieldName in clientFieldErrors) {
            if (clientFieldErrors[fieldName] && touched[fieldName]) {
                return true;
            }
        }
        
        return false;
    }, [isSaving, backendFieldErrors, clientFieldErrors, hasAttemptedSubmit, touched, contractId, isEditing]);

    return (
        <> 
            <style>{numberInputStyle}</style>
            <Form onSubmit={handleSubmit} id={formIdPrefix}>
                {parentApiError && !Object.keys(backendFieldErrors).length && (
                    <Alert color="danger" className="mb-3" fade={false} timeout={150}>
                        {parentApiError}
                    </Alert>
                )}
                
                {isEditing && id_pago && <input type="hidden" name="id_pago" value={id_pago} />}

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for={`${formIdPrefix}-contractId`} className="fw-bold">Contrato <span className="text-danger">*</span></Label>
                            <Input
                                type="select" name="contractId" id={`${formIdPrefix}-contractId`}
                                value={contractId}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                disabled={isSaving || isEditing || contratos.length === 0}
                                bsSize="sm"
                                invalid={!!getFieldError('contractId')}
                            >
                                <option value="">-- Seleccione Contrato --</option>
                                {contratos.map((c) => (
                                    <option key={c.id || c._id} value={c.id || c._id}>
                                        Contrato #{(c.id || c._id)} (Cliente: {c.client?.nombre || 'N/A'})
                                    </option>
                                ))}
                            </Input>
                            {isEditing && <small className="text-muted d-block mt-1">El contrato no se cambia al editar un pago.</small>}
                            <FormFeedback>{getFieldError('contractId')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for={`${formIdPrefix}-nombreClienteDisplay`} className="fw-bold">Cliente</Label>
                            <Input
                                type="text" name="nombreClienteDisplay" id={`${formIdPrefix}-nombreClienteDisplay`}
                                value={nombreClienteDelContrato}
                                readOnly bsSize="sm"
                                placeholder="Se mostrará al seleccionar contrato"
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for={`${formIdPrefix}-mesPago`} className="fw-bold">Mes de Pago (1-12) <span className="text-danger">*</span></Label>
                            <Input
                                type="number" name="mesPago" id={`${formIdPrefix}-mesPago`}
                                value={mesPago}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                min="1" max="12"
                                disabled={isSaving} bsSize="sm" placeholder="Ej: 1 para Enero"
                                invalid={!!getFieldError('mesPago')}
                                className="no-spinners"
                            />
                            <FormFeedback>{getFieldError('mesPago')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for={`${formIdPrefix}-valor`} className="fw-bold">Valor del Pago <span className="text-danger">*</span></Label>
                            <Input
                                type="number" step="0.01" name="valor" id={`${formIdPrefix}-valor`}
                                value={valor}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                min="0.01"
                                disabled={isSaving} bsSize="sm" placeholder="Ej: 150000.50"
                                invalid={!!getFieldError('valor')}
                                className="no-spinners"
                            />
                            <FormFeedback>{getFieldError('valor')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for={`${formIdPrefix}-metodoPago`} className="fw-bold">Método de Pago <span className="text-danger">*</span></Label>
                            <Input
                                type="select" name="metodoPago" id={`${formIdPrefix}-metodoPago`}
                                value={metodoPago}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                disabled={isSaving} bsSize="sm"
                                invalid={!!getFieldError('metodoPago')}
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                            </Input>
                            <FormFeedback>{getFieldError('metodoPago')}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        {isEditing && fechaPago && (
                            <FormGroup>
                                <Label for={`${formIdPrefix}-fechaPagoDisplay`} className="fw-bold">Fecha de Pago Registrada</Label>
                                <Input
                                    type="text" id={`${formIdPrefix}-fechaPagoDisplay`}
                                    value={new Date(fechaPago).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    readOnly bsSize="sm"
                                />
                            </FormGroup>
                        )}
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <Button color="danger" type="button" onClick={onFormCancel} disabled={isSaving} size="sm">
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={isSubmitButtonDisabled} size="sm">
                        {isSaving ? <Spinner size="sm" /> : formButtonTitle}
                    </Button>
                </div>
            </Form>
        </>
    );
};

export default PagoForm;