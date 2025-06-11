// src/components/Vacunacion/VacunacionForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const validateField = (name, value, formData) => {
    // ... (validateField sin cambios)
    switch (name) {
        case "nombreVacuna":
            if (!value?.trim()) return "El nombre de la vacuna es obligatorio.";
            if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
            return null;
        case "specimenId":
            if (!value) return "Debe seleccionar un espécimen.";
            return null;
        case "fechaAdministracion":
            if (!value) return "La fecha de administración es obligatoria.";
            const hoy = new Date();
            const fechaSeleccionada = new Date(value);
            hoy.setHours(0, 0, 0, 0);
            // fechaSeleccionada ya viene como YYYY-MM-DD, al crear new Date(value)
            // puede tener problemas de zona horaria si no se maneja con cuidado.
            // Es mejor comparar strings YYYY-MM-DD o parsear la fecha del input correctamente.
            // Para simplificar la comparación de solo fecha:
            const hoyStr = hoy.toISOString().split('T')[0];
            // if (value > hoyStr) { // Asumiendo que 'value' es YYYY-MM-DD
            //     return "La fecha de administración no puede ser futura.";
            // }
            return null;
        default:
            return null;
    }
};

const VacunacionForm = ({
  formData,
  handleInputChange,
  onFormSubmit,
  onFormCancel,
  editing, // Booleano que indica si es modo edición
  specimens = [],
  loadingSpecimens = false,
  isSubmitting = false,
  fieldErrors: backendFieldErrors = {},
  apiError: parentApiError,
}) => {
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  // hasAttemptedSubmit se usará para controlar cuándo se muestran todos los errores
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);


  // runAllValidations no necesita useCallback si no se pasa como prop o dependencia compleja
  const runAllValidations = () => {
    const fieldsToValidate = ["nombreVacuna", "specimenId", "fechaAdministracion"];
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
  
  useEffect(() => {
    // Resetear errores y 'touched' cuando formData cambia (al abrir modal para nuevo/editar)
    // También resetear el intento de submit
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false); // Resetear intento de submit
    // No llamamos a runAllValidations aquí para que el botón esté habilitado inicialmente
  }, [formData]);

  const fechaFormateada = useMemo(() => {
    // ... (sin cambios)
    if (!formData.fechaAdministracion) return '';
    try {
        const dateObj = new Date(formData.fechaAdministracion);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.warn("Error formateando fecha en VacunacionForm:", formData.fechaAdministracion, error);
        return '';
    }
  }, [formData.fechaAdministracion]);

  const internalHandleInputChange = (e) => {
    handleInputChange(e);
    const { name, value } = e.target;
    
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true); // Marcar que se intentó enviar

    // Marcar todos los campos relevantes como tocados para mostrar errores
    const allFieldsRelevantTouched = ["nombreVacuna", "specimenId", "fechaAdministracion"]
        .reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
    setTouched(prev => ({...prev, ...allFieldsRelevantTouched}));

    const isFormValid = runAllValidations();

    if (!isFormValid || isSubmitting || loadingSpecimens) {
        return;
    }
    if (typeof onFormSubmit === 'function') {
      onFormSubmit(formData);
    } else {
      console.error("VacunacionForm: onFormSubmit prop no es una función.");
    }
  };

  const handleCancel = () => {
    // ... (sin cambios)
    if (typeof onFormCancel === 'function') {
      onFormCancel();
    } else {
      console.error("VacunacionForm: onFormCancel prop no es una función.");
    }
  };

  const formTitle = editing ? "Actualizar Vacunación" : "Registrar Vacunación";
  
  // Mostrar error solo si el campo fue tocado O si ya se intentó enviar el formulario
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
  
  // El botón se deshabilita si se está guardando, cargando, o SI SE INTENTÓ ENVIAR y hay errores.
  // O si hay errores de backend.
  const isButtonDisabled = isSubmitting || loadingSpecimens || Object.keys(backendFieldErrors).length > 0 ||
                         (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));


  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
            <Alert color="danger" className="mb-3">{parentApiError}</Alert>
        )}

        {/* Campos del formulario... (sin cambios en la estructura de Row/Col/FormGroup) */}
        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="vac-nombreVacuna" className="fw-bold">Nombre Vacuna <span className="text-danger">*</span></Label>
                    <Input
                        id="vac-nombreVacuna" type="text" name="nombreVacuna"
                        placeholder="Ej: Rabia, Parvovirus"
                        value={formData.nombreVacuna || ''}
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting} bsSize="sm"
                        invalid={!!getFieldError("nombreVacuna")}
                    />
                    <FormFeedback>{getFieldError("nombreVacuna")}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="vac-specimenId" className="fw-bold">Espécimen <span className="text-danger">*</span></Label>
                    <Input
                        id="vac-specimenId" type="select" name="specimenId"
                        value={formData.specimenId || ''}
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={editing || loadingSpecimens || isSubmitting}
                        bsSize="sm" invalid={!!getFieldError("specimenId")}
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
                    <FormFeedback>{getFieldError("specimenId")}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="vac-fechaAdministracion" className="fw-bold">Fecha Administración <span className="text-danger">*</span></Label>
                    <Input
                        id="vac-fechaAdministracion" type="date" name="fechaAdministracion"
                        value={fechaFormateada}
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting} bsSize="sm"
                        invalid={!!getFieldError("fechaAdministracion")}
                    />
                    <FormFeedback>{getFieldError("fechaAdministracion")}</FormFeedback>
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
            disabled={isButtonDisabled} // Usar la nueva variable para deshabilitar
            size="sm"
          >
            {isSubmitting ? <Spinner size="sm" /> : formTitle}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default VacunacionForm;