// src/components/Categories/CategoryForm.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Añadido useCallback
import {
    Form, FormGroup, Label, Input, Button, Alert, Spinner, FormFeedback, Row, Col
} from 'reactstrap';

// --- Función de Validación Específica ---
const validateCategoryField = (fieldName, value) => {
    switch (fieldName) {
        case "name":
            if (!value.trim()) return "El nombre de la categoría es obligatorio.";
            if (value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        case "estado":
            if (value !== 'activo' && value !== 'inactivo') return 'El estado seleccionado no es válido.';
            if (!value) return 'El estado es obligatorio.'; // Si se permitiera una opción vacía
            return null;
        default:
            return null;
    }
};

const CategoryForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  apiError: parentApiError, // Renombrado
  isSaving,
  fieldErrors: backendFieldErrors = {} // Renombrado
}) => {
    // Estados del formulario
    const [name, setName] = useState('');
    const [estado, setEstado] = useState('activo');

    // Estados para validación
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    // localFormError ya no es necesario para errores de campo

    const isEditing = !!(initialData?.id || initialData?._id);

    // Sincronizar estado del formulario con initialData y resetear validaciones
    useEffect(() => {
        setClientFieldErrors({});
        setTouched({});
        setHasAttemptedSubmit(false);

        if (initialData) {
            setName(initialData.name || '');
            setEstado(initialData.estado === 'activo' || initialData.estado === 'inactivo' ? initialData.estado : 'activo');
        } else {
            setName('');
            setEstado('activo');
        }
    }, [initialData]);

    const runAllValidations = useCallback(() => {
        const fieldsToValidate = ["name", "estado"];
        let newClientErrors = {};
        let formIsValid = true;
        
        const currentFormData = { name, estado }; // Usar los estados actuales para validar

        fieldsToValidate.forEach(fieldName => {
            const value = currentFormData[fieldName];
            const error = validateCategoryField(fieldName, value);
            if (error) {
                newClientErrors[fieldName] = error;
                formIsValid = false;
            } else {
                newClientErrors[fieldName] = null;
            }
        });
        setClientFieldErrors(newClientErrors);
        return formIsValid;
    }, [name, estado]); // Dependencias


    const internalHandleChange = (e) => {
        const { name: fieldName, value: fieldValue } = e.target;

        if (fieldName === "name") setName(fieldValue);
        if (fieldName === "estado") setEstado(fieldValue);

        setTouched(prev => ({ ...prev, [fieldName]: true }));
        // Validar con el nuevo valor inmediatamente
        const error = validateCategoryField(fieldName, fieldValue);
        setClientFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    };
    
    const handleBlur = (e) => {
        const { name: fieldName, value: fieldValue } = e.target;
        if (!touched[fieldName]) {
            setTouched(prev => ({ ...prev, [fieldName]: true }));
        }
        const error = validateCategoryField(fieldName, fieldValue);
        setClientFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);
        const allFieldsTouched = { name: true, estado: true };
        setTouched(allFieldsTouched);

        const isClientValid = runAllValidations();
        if (!isClientValid || isSaving) return;

        onSubmit({ name: name.trim(), estado: estado });
    };

    const formTitle = isEditing ? 'Actualizar Categoría' : 'Crear Categoría';
    const getFieldError = (fieldName) => (backendFieldErrors[fieldName] || ((touched[fieldName] || hasAttemptedSubmit) && clientFieldErrors[fieldName]));
    
    const isButtonDisabled = isSaving || 
                           (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null)) ||
                           Object.keys(backendFieldErrors).length > 0;

    return (
        <div className="border p-3 rounded">
            <Form onSubmit={handleSubmit} className="mt-3" noValidate>
                {parentApiError && !Object.keys(backendFieldErrors).length && 
                    <Alert color="danger" className="mb-3">{parentApiError}</Alert>
                }
                {/* localFormError ya no es necesario si los errores son por campo */}

                <Row className="mb-3">
                    <Col md={12}>
                        <FormGroup>
                            <Label for="categoryName" className="fw-bold">Nombre Categoría <span className="text-danger">*</span></Label>
                            <Input
                                id="categoryName" type="text" name="name"
                                value={name}
                                onChange={internalHandleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: Competencia, Potros, etc."
                                disabled={isSaving}
                                invalid={!!getFieldError('name')}
                                bsSize="sm"
                            />
                            <FormFeedback>{getFieldError('name')}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                         <FormGroup>
                             <Label for="categoryEstado" className="fw-bold">Estado <span className="text-danger">*</span></Label>
                             <Input
                                id="categoryEstado" type="select" name="estado"
                                value={estado}
                                onChange={internalHandleChange}
                                onBlur={handleBlur}
                                disabled={isSaving || (isEditing && initialData)} 
                                invalid={!!getFieldError('estado')}
                                bsSize="sm"
                             >
                                 <option value="activo">Activo</option>
                                 <option value="inactivo">Inactivo</option>
                             </Input>
                             <FormFeedback>{getFieldError('estado')}</FormFeedback>
                             {isEditing && initialData && (
                                <small className="text-muted d-block mt-1">
                                    El estado se gestiona mediante acciones específicas en la lista.
                                </small>
                             )}
                         </FormGroup>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                    <Button
                        color="danger" onClick={onCancel} type="button"
                        disabled={isSaving} size="sm"
                    >
                         Cancelar
                    </Button>
                    <Button
                        color="success" type="submit"
                        disabled={isButtonDisabled}
                        size="sm"
                    >
                        {isSaving ? <Spinner size="sm" /> : formTitle}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CategoryForm;