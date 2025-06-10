// src/components/Alimentacion/AlimentacionForm.jsx
import React, { useState, useEffect, useCallback } from "react"; // Añadido useCallback
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Spinner,
    FormFeedback,
    Alert,
    Row,
    Col
} from "reactstrap";

// --- Función de Validación Específica ---
const validateField = (name, value, formData) => { // editing no es relevante aquí a menos que cambien las reglas
    switch (name) {
        case "nombreAlimento":
            if (!value?.trim()) return "El nombre del alimento es obligatorio.";
            if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
            return null;
        case "specimenId":
            if (!value) return "Debe seleccionar un espécimen.";
            return null;
        case "cantidad":
            if (value === undefined || value === null || String(value).trim() === '') {
                return "La cantidad es obligatoria.";
            }
            const cantidadNum = Number(value);
            if (isNaN(cantidadNum) || cantidadNum <= 0) {
                return "La cantidad debe ser un número positivo.";
            }
            return null;
        case "estado": // Aunque tenga default, validamos que no sea una opción vacía si se añade
            if (!value) return "Debe seleccionar un estado para la alimentación.";
            return null;
        // Validar otros campos como fechaAdministracion, notas si se añaden
        default:
            return null;
    }
};

const AlimentacionForm = ({
  formData,
  handleInputChange,
  onFormSubmit,
  onFormCancel,
  editing,
  specimens = [],
  loadingSpecimens = false,
  isSubmitting = false,
  fieldErrors: backendFieldErrors = {}, // Renombrado para claridad
  apiError: parentApiError, // Renombrado para claridad
}) => {
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Usamos useCallback para runAllValidations porque depende de formData,
  // y así evitamos que se recree en cada render a menos que formData cambie.
  const runAllValidations = useCallback(() => {
    const fieldsToValidate = ["nombreAlimento", "specimenId", "cantidad", "estado"];
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
  }, [formData]); // Dependencia de formData

  useEffect(() => {
    // Resetear errores y 'touched' cuando formData cambia (al abrir modal para nuevo/editar)
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);
    // No llamamos a runAllValidations aquí para que el botón esté habilitado inicialmente para un nuevo form
  }, [formData]); // Dependencia de formData

  const internalHandleInputChange = (e) => {
    handleInputChange(e); // Llama al manejador del padre para actualizar formData

    const { name, value } = e.target;
    setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
    // Validar con el valor que acaba de cambiar para retroalimentación inmediata
    const error = validateField(name, value, { ...formData, [name]: value }); 
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    const allFieldsRelevantTouched = ["nombreAlimento", "specimenId", "cantidad", "estado"]
        .reduce((acc, key) => {
            if (formData.hasOwnProperty(key)) acc[key] = true;
            return acc;
        }, {});
    setTouched(prev => ({...prev, ...allFieldsRelevantTouched}));

    const isFormValid = runAllValidations();

    if (!isFormValid || isSubmitting || loadingSpecimens) {
        return;
    }
    if (typeof onFormSubmit === 'function') {
      onFormSubmit(); // El padre ya tiene el formData actualizado
    } else {
      console.error("AlimentacionForm: onFormSubmit prop no es una función.");
    }
  };

  const handleCancel = () => {
    if (typeof onFormCancel === 'function') {
      onFormCancel();
    } else {
      console.error("AlimentacionForm: onFormCancel prop no es una función.");
    }
  };

  const formTitle = editing ? "Actualizar Alimentación" : "Registrar Alimentación";
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
  
  const isButtonDisabled = isSubmitting || loadingSpecimens || Object.keys(backendFieldErrors).length > 0 ||
                         (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
            <Alert color="danger" className="mb-3">{parentApiError}</Alert>
        )}
        {/* localFormError general ya no se usa, los errores son por campo */}

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="alim-nombreAlimento" className="fw-bold">Nombre Alimento <span className="text-danger">*</span></Label>
                    <Input
                        id="alim-nombreAlimento" type="text" name="nombreAlimento"
                        placeholder="Ej: Pienso A, Heno B"
                        value={formData.nombreAlimento || ''}
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting} bsSize="sm"
                        invalid={!!getFieldError('nombreAlimento')}
                    />
                    <FormFeedback>{getFieldError('nombreAlimento')}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label for="alim-specimenId" className="fw-bold">Espécimen <span className="text-danger">*</span></Label>
                    <Input
                        id="alim-specimenId" type="select" name="specimenId"
                        value={formData.specimenId || ''}
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={editing || loadingSpecimens || isSubmitting}
                        bsSize="sm" invalid={!!getFieldError('specimenId')}
                    >
                        <option value="" disabled>-- Selecciona un Espécimen --</option>
                        {loadingSpecimens ? (
                            <option value="" disabled>Cargando especímenes...</option>
                        ) : specimens.length > 0 ? (
                        specimens.map((spec) => (
                            <option key={spec.id || spec._id} value={spec.id || spec._id}>
                                {spec.name} 
                            </option>
                        ))
                        ) : (
                        <option value="" disabled>No hay especímenes disponibles</option>
                        )}
                    </Input>
                    {editing && <small className="text-muted d-block mt-1"> No se puede cambiar el espécimen al editar.</small>}
                    <FormFeedback>{getFieldError('specimenId')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="alim-cantidad" className="fw-bold">Cantidad <span className="text-danger">*</span></Label>
                    <Input
                        id="alim-cantidad" type="number" name="cantidad"
                        placeholder="Cantidad (ej: 500)"
                        value={formData.cantidad ?? ''} // Usar ?? para que 0 se muestre si es válido
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        min="0.01" // Si debe ser positivo. Si 0 es válido, min="0"
                        step="any" 
                        disabled={isSubmitting} bsSize="sm"
                        invalid={!!getFieldError('cantidad')}
                    />
                    <FormFeedback>{getFieldError('cantidad')}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label for="alim-estadoAlimentacion" className="fw-bold">Estado <span className="text-danger">*</span></Label>
                    <Input
                        id="alim-estadoAlimentacion" type="select" name="estado"
                        value={formData.estado || 'Programado'} // Default si formData.estado es undefined
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting} bsSize="sm"
                        invalid={!!getFieldError('estado')}
                    >
                        {/* Podrías añadir una opción inicial si el default no siempre es deseado */}
                        {/* <option value="">-- Seleccione Estado --</option> */}
                        <option value="Programado">Programado</option>
                        <option value="Administrado">Administrado</option>
                        <option value="Cancelado">Cancelado</option>
                    </Input>
                    <FormFeedback>{getFieldError('estado')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>
        
        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          <Button
            color="danger" type="button" onClick={handleCancel}
            disabled={isSubmitting} size="sm"
          >
            Cancelar
          </Button>
          <Button
            color="success" type="submit"
            disabled={isButtonDisabled}
            size="sm"
          >
            {isSubmitting ? <Spinner size="sm" /> : formTitle}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AlimentacionForm;