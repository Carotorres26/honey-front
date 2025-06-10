// src/components/Medicina/MedicineForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Añadido useCallback
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    Spinner,
    FormFeedback,
    Alert
} from "reactstrap";

// --- Función de Validación Específica ---
const validateField = (name, value, formData) => { // editing no es necesario aquí para las reglas actuales
    const trimmedValue = typeof value === 'string' ? value.trim() : value; // value puede ser número para 'cantidad'

    switch (name) {
        case "nombre": // Asumiendo que el name en formData es 'nombre'
            if (!trimmedValue) return "El nombre del medicamento es obligatorio.";
            if (trimmedValue.length < 2) return "El nombre debe tener al menos 2 caracteres.";
            return null;
        case "dosis":
            if (!trimmedValue) return "La dosis es obligatoria.";
            return null;
        case "horaAdministracion":
            if (!value) return "La hora de administración es obligatoria."; // value es HH:MM o HH:MM:SS
            if (!/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)) {
                return "El formato de la hora no es válido (HH:MM o HH:MM:SS).";
            }
            return null;
        case "specimenId":
            if (!value) return "Debe seleccionar un espécimen.";
            return null;
        case "cantidad":
            if (value === undefined || value === null || String(value).trim() === '') {
                return "La cantidad es obligatoria.";
            }
            const cantidadNum = Number(value);
            if (isNaN(cantidadNum) || cantidadNum < 0) { // Permitir 0 si es válido según tu backend
                return "La cantidad debe ser un número igual o mayor a cero.";
            }
            return null;
        case "estado":
            if (!value) return "Debe seleccionar un estado.";
            return null;
        default:
            return null;
    }
};


const MedicineForm = ({
  formData, // Objeto del estado en MedicinePage.jsx
  handleInputChange, // Función del padre para actualizar formData
  onFormSubmit,
  onFormCancel,
  editing,
  specimens = [],
  loadingSpecimens = false,
  isSubmitting = false,
  fieldErrors: backendFieldErrors = {}, // Renombrado
  apiError: parentApiError, // Renombrado
}) => {
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  // localFormError ya no se usa

  // Usamos useCallback para runAllValidations
  const runAllValidations = useCallback(() => {
    const fieldsToValidate = ["nombre", "dosis", "horaAdministracion", "specimenId", "cantidad", "estado"];
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
  }, [formData]);

  useEffect(() => {
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);
    // No llamar a runAllValidations aquí para que el botón esté habilitado al inicio
  }, [formData]); // Dependencia de formData (cuando cambia initialData en el padre)

  const horaParaInput = useMemo(() => {
    if (!formData.horaAdministracion) return '';
    const horaStr = String(formData.horaAdministracion);
    const match = horaStr.match(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/);
    return match ? horaStr : horaStr.substring(0, 5);
  }, [formData.horaAdministracion]);

  const internalHandleInputChange = (e) => {
    handleInputChange(e); // Actualizar formData en el padre
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value, { ...formData, [name]: value });
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!touched[name]) {
        setTouched(prev => ({ ...prev, [name]: true }));
    }
    const error = validateField(name, value, formData);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    const allFieldsRelevantTouched = ["nombre", "dosis", "horaAdministracion", "specimenId", "cantidad", "estado"]
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
      console.error("MedicineForm: onFormSubmit prop no es una función.");
    }
  };

  const handleCancel = () => {
    if (typeof onFormCancel === 'function') {
      onFormCancel();
    } else {
      console.error("MedicineForm: onFormCancel prop no es una función.");
    }
  };

  const formTitle = editing ? "Actualizar Medicina" : "Registrar Medicina";
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
  
  const isButtonDisabled = isSubmitting || loadingSpecimens || Object.keys(backendFieldErrors).length > 0 ||
                         (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
            <Alert color="danger" className="mb-3">{parentApiError}</Alert>
        )}
        {/* localFormError ya no se usa */}

        <Row className="mb-3">
          <Col md={6}>
            <FormGroup>
              <Label for="medicine-nombre" className="fw-bold">Nombre Medicina <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm" id="medicine-nombre" type="text" name="nombre"
                placeholder="Ej: Analgésico X"
                value={formData.nombre || ''} // Asegurar que coincida con el campo en formData
                onChange={internalHandleInputChange}
                onBlur={handleBlur}
                autoComplete="off" disabled={isSubmitting}
                invalid={!!getFieldError('nombre')}
              />
              <FormFeedback>{getFieldError('nombre')}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="medicine-dosis" className="fw-bold">Dosis <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm" id="medicine-dosis" type="text" name="dosis"
                placeholder="Ej: 10mg, 5ml"
                value={formData.dosis || ''}
                onChange={internalHandleInputChange}
                onBlur={handleBlur}
                autoComplete="off" disabled={isSubmitting}
                invalid={!!getFieldError('dosis')}
              />
              <FormFeedback>{getFieldError('dosis')}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="medicine-horaAdministracion" className="fw-bold">Hora Administración <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm" id="medicine-horaAdministracion" type="time" name="horaAdministracion"
                value={horaParaInput}
                onChange={internalHandleInputChange}
                onBlur={handleBlur}
                disabled={isSubmitting} step="1"
                invalid={!!getFieldError('horaAdministracion')}
              />
              <FormFeedback>{getFieldError('horaAdministracion')}</FormFeedback>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label for="medicine-specimenId" className="fw-bold">Espécimen <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm" id="medicine-specimenId" type="select" name="specimenId"
                value={formData.specimenId || ''}
                onChange={internalHandleInputChange}
                onBlur={handleBlur}
                disabled={editing || loadingSpecimens || isSubmitting}
                invalid={!!getFieldError('specimenId')}
              >
                <option value="" disabled>-- Selecciona Espécimen --</option>
                {loadingSpecimens ? (
                    <option value="" disabled>Cargando...</option>
                ) : specimens.length > 0 ? (
                    specimens.map((spec) => (
                        <option key={spec.id || spec._id} value={spec.id || spec._id}>
                            {spec.name}  {/* Considerar añadir (ID: ...) si es útil */}
                        </option>
                    ))
                ) : (
                    <option value="" disabled>No hay especímenes</option>
                )}
              </Input>
              {editing && <small className="text-muted d-block mt-1">No se puede cambiar el espécimen al editar.</small>}
              <FormFeedback>{getFieldError('specimenId')}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="medicine-cantidad" className="fw-bold">Cantidad <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm" id="medicine-cantidad" type="number" name="cantidad"
                placeholder="Unidades/Dosis"
                value={formData.cantidad ?? ''}
                onChange={internalHandleInputChange}
                onBlur={handleBlur}
                min="0" step="1" // Asumiendo que 0 es válido
                disabled={isSubmitting}
                invalid={!!getFieldError('cantidad')}
              />
              <FormFeedback>{getFieldError('cantidad')}</FormFeedback>
            </FormGroup>
            <FormGroup>
               <Label for="medicine-estadoMedicina" className="fw-bold">Estado <span className="text-danger">*</span></Label>
               <Input
                    bsSize="sm" id="medicine-estadoMedicina" type="select" name="estado"
                    value={formData.estado || 'Programado'}
                    onChange={internalHandleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    invalid={!!getFieldError('estado')}
                >
                 {/* <option value="">-- Seleccione Estado --</option>  // Añadir si el default 'Programado' no es siempre deseado */}
                 <option value="Programado">Programado</option>
                 <option value="Administrado">Administrado</option>
                 <option value="Cancelado">Cancelado</option>
               </Input>
               <FormFeedback>{getFieldError('estado')}</FormFeedback>
            </FormGroup>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          <Button color="danger" type="button" onClick={handleCancel} disabled={isSubmitting} size="sm">
            Cancelar
          </Button>
          <Button color="success" type="submit" disabled={isButtonDisabled} size="sm">
            {isSubmitting ? <Spinner size="sm" /> : formTitle}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default MedicineForm;