// src/components/auth/ProfileEditForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, FormGroup, Label, Input, Button, Spinner, Alert, FormFeedback, Row, Col
} from 'reactstrap';

// --- Función de Validación Específica ---
const validateProfileField = (name, value, formData) => {
    const trimmedValue = value.trim();
    switch (name) {
        case "nombreCompleto":
            if (!trimmedValue) return "El nombre completo es obligatorio.";
            if (trimmedValue.length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        case "email":
            if (!trimmedValue) return "El correo electrónico es obligatorio.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
                return "El formato del correo electrónico no es válido.";
            }
            return null;
        case "username":
            if (!trimmedValue) return "El nombre de usuario es obligatorio.";
            if (trimmedValue.length < 4) return "El username debe tener al menos 4 caracteres.";
            return null;
        case "celular": // AHORA OBLIGATORIO
            if (!trimmedValue) return "El celular es obligatorio.";
            if (!/^\d+$/.test(trimmedValue)) return "El celular solo debe contener números.";
            if (trimmedValue.length !== 10) return "El celular debe tener 10 dígitos.";
            return null;
        case "documento": // AHORA OBLIGATORIO
            if (!trimmedValue) return "El documento es obligatorio.";
            if (!/^\d+$/.test(trimmedValue)) return "El documento solo debe contener números.";
            if (trimmedValue.length < 9 || trimmedValue.length > 11) {
                return "El documento debe tener entre 9 y 11 dígitos.";
            }
            return null;
        default:
            return null;
    }
};

const ProfileEditForm = ({
    initialUserData,
    onSave,
    onCancel,
    isLoading,
    apiError: parentApiError, 
    fieldErrors: backendFieldErrors = {}, 
}) => {
  // ... (getInitialFormData, estados, useEffect, internalHandleChange, handleBlur - sin cambios) ...
  const getInitialFormData = useCallback(() => ({
    nombreCompleto: initialUserData?.nombreCompleto || '',
    email: initialUserData?.email || '',
    celular: initialUserData?.celular || '',
    documento: initialUserData?.documento || '',
    username: initialUserData?.username || ''
  }), [initialUserData]);
  
  const [formData, setFormData] = useState(getInitialFormData);
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData());
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);
  }, [initialUserData, getInitialFormData]);

  const internalHandleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateProfileField(name, value, {...formData, [name]: value});
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!touched[name]) {
        setTouched(prev => ({ ...prev, [name]: true }));
    }
    const error = validateProfileField(name, value, formData);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };
  
  // runAllValidations y handleSubmit se mantienen igual, ya que la lógica de
  // qué campos validar está en la función validateProfileField y la lista fieldsToValidate.
  // El cambio importante es que ahora validateProfileField considera celular y documento como obligatorios.
  const runAllValidations = () => {
    const fieldsToValidate = ["nombreCompleto", "email", "username", "celular", "documento"];
    let newClientErrors = {};
    let formIsValid = true;
    fieldsToValidate.forEach(fieldName => {
        const error = validateProfileField(fieldName, formData[fieldName], formData);
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
    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true; return acc;
    }, {});
    setTouched(allFieldsTouched);

    const isClientValid = runAllValidations();
    if (!isClientValid || isLoading) {
        return;
    }
    onSave(formData);
  };

  const isSaving = isLoading;
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
  
  const isButtonDisabled = isSaving || 
                           (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null)) ||
                           Object.keys(backendFieldErrors).length > 0;


  if (!initialUserData && !isSaving) {
    return (
        <div className="text-center p-5">
            <Spinner /> <p className="mt-2 text-muted">Cargando datos del perfil...</p>
        </div>
    );
  }

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
            <Alert color="danger" className="mb-3">{parentApiError}</Alert>
        )}

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="profile-nombreCompleto" className="fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                    <Input
                        type="text" id="profile-nombreCompleto" name="nombreCompleto"
                        value={formData.nombreCompleto} onChange={internalHandleChange} onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm"
                        invalid={!!getFieldError('nombreCompleto')}
                    />
                    <FormFeedback>{getFieldError('nombreCompleto')}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label for="profile-email" className="fw-bold">Email <span className="text-danger">*</span></Label>
                    <Input
                        type="email" id="profile-email" name="email"
                        value={formData.email} onChange={internalHandleChange} onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm"
                        invalid={!!getFieldError('email')}
                    />
                    <FormFeedback>{getFieldError('email')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    {/* MODIFICADO: Celular ahora es obligatorio */}
                    <Label for="profile-celular" className="fw-bold">Celular <span className="text-danger">*</span></Label>
                    <Input
                        type="text" id="profile-celular" name="celular"
                        value={formData.celular} onChange={internalHandleChange} onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm" maxLength={10}
                        invalid={!!getFieldError('celular')}
                    />
                    <FormFeedback>{getFieldError('celular')}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    {/* MODIFICADO: Documento ahora es obligatorio */}
                    <Label for="profile-documento" className="fw-bold">Documento <span className="text-danger">*</span></Label>
                    <Input
                        type="text" id="profile-documento" name="documento"
                        value={formData.documento} onChange={internalHandleChange} onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm" maxLength={11}
                        invalid={!!getFieldError('documento')}
                    />
                    <FormFeedback>{getFieldError('documento')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="profile-username" className="fw-bold">Nombre de Usuario <span className="text-danger">*</span></Label>
                    <Input
                        type="text" id="profile-username" name="username"
                        value={formData.username} onChange={internalHandleChange} onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm"
                        invalid={!!getFieldError('username')}
                    />
                    <FormFeedback>{getFieldError('username')}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}></Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          <Button
            type="button" color="danger" onClick={onCancel}
            disabled={isSaving} size="sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit" color="success"
            disabled={isButtonDisabled}
            size="sm"
          >
            {isSaving ? <Spinner size="sm" /> : 'Guardar Cambios'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProfileEditForm;