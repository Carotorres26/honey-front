// src/components/Sedes/VenueForm.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Añadido useCallback
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Alert,
    Spinner,
    FormFeedback,
    Row,
    Col
} from 'reactstrap';
import PropTypes from 'prop-types';

// --- Función de Validación Específica ---
const validateField = (name, value) => {
    switch (name) {
        case "NombreSede":
            if (!value?.trim()) return "El nombre de la sede es obligatorio.";
            if (value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        // Añadir casos para 'direccion', 'ciudad' si se implementan y validan
        default:
            return null;
    }
};

const VenueForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    apiError: parentApiError, // Renombrado
    isSaving,
    fieldErrors: backendFieldErrors = {} // Renombrado
}) => {
    // getInitialFormState ahora se usa dentro de getInitialFormData
    const getInitialFormData = useCallback(() => ({
        NombreSede: initialData?.NombreSede || '',
        // direccion: initialData?.direccion || '',
        // ciudad: initialData?.ciudad || '',
    }), [initialData]);

    const [formData, setFormData] = useState(getInitialFormData);
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    // localFormError ya no se usa para errores de campo

    const isEditing = !!(initialData?.id || initialData?._id);

    useEffect(() => {
        setFormData(getInitialFormData()); // Actualizar formData cuando initialData cambie
        setClientFieldErrors({});
        setTouched({});
        setHasAttemptedSubmit(false);
    }, [initialData, getInitialFormData]); // Dependencia de getInitialFormData también


    const runAllValidations = useCallback(() => {
        const fieldsToValidate = ["NombreSede"]; // Añadir 'direccion', 'ciudad' si se usan
        let newClientErrors = {};
        let formIsValid = true;

        fieldsToValidate.forEach(fieldName => {
            const value = formData[fieldName];
            const error = validateField(fieldName, value);
            if (error) {
                newClientErrors[fieldName] = error;
                formIsValid = false;
            } else {
                newClientErrors[fieldName] = null;
            }
        });
        setClientFieldErrors(newClientErrors);
        return formIsValid;
    }, [formData]); // Dependencia de formData

    const internalHandleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        const error = validateField(name, value);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (!touched[name]) {
            setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
        }
        const error = validateField(name, value);
        setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);
        const allFieldsTouched = { NombreSede: true }; // Adaptar si hay más campos
        setTouched(allFieldsTouched);

        const isFormValid = runAllValidations();

        if (!isFormValid || isSaving) {
            return;
        }

        const dataToSend = {
            NombreSede: formData.NombreSede.trim(),
            // direccion: formData.direccion?.trim() || null,
            // ciudad: formData.ciudad?.trim() || null,
        };
        onSubmit(dataToSend);
    };

    const formTitle = isEditing ? "Actualizar Sede" : "Crear Sede";
    const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
    
    const isButtonDisabled = isSaving ||
                           (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null)) ||
                           Object.keys(backendFieldErrors).length > 0;

    return (
        <div className="border p-3 rounded">
            <Form onSubmit={handleSubmit} className="mt-3" noValidate>
                {parentApiError && !Object.keys(backendFieldErrors).length && 
                    <Alert color="danger" className="mb-3">{parentApiError}</Alert>
                }
                {/* localFormError general ya no se usa aquí */}

                <Row className="mb-3">
                    {/* Cambiado a md={12} ya que es el campo principal único por ahora */}
                    <Col md={12}> 
                        <FormGroup>
                            <Label for="NombreSede" className="fw-bold">Nombre Sede <span className="text-danger">*</span></Label>
                            <Input
                                id="NombreSede" type="text" name="NombreSede"
                                value={formData.NombreSede}
                                onChange={internalHandleInputChange}
                                onBlur={handleBlur}
                                placeholder="Ej: Sede Principal, Sucursal Centro"
                                disabled={isSaving}
                                invalid={!!getFieldError('NombreSede')}
                                bsSize="sm"
                            />
                            <FormFeedback>{getFieldError('NombreSede')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                {/* Si añades más campos, seguirían un patrón similar de Row y Col */}

                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                    <Button color="danger" onClick={onCancel} type="button" disabled={isSaving} size="sm">
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

VenueForm.propTypes = {
    initialData: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.string,
        NombreSede: PropTypes.string,
    }),
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    apiError: PropTypes.string,
    isSaving: PropTypes.bool,
    fieldErrors: PropTypes.object,
};

VenueForm.defaultProps = {
    initialData: null,
    apiError: null,
    isSaving: false,
    fieldErrors: {},
};

export default VenueForm;