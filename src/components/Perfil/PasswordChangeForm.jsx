import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Form, FormGroup, Label, Input, Button, Spinner, Alert, FormFeedback, Row, Col
} from 'reactstrap';
import { cambiarContraseñaActual } from '../../api/userApi';

// --- Función de Validación Específica ---
const validatePasswordField = (name, value, formData) => {
    switch (name) {
        case "currentPassword":
            if (!value.trim()) return "La contraseña actual es obligatoria.";
            return null;
        case "newPassword":
            if (!value.trim()) return "La nueva contraseña es obligatoria.";
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
            if (!strongPasswordRegex.test(value)) {
                return "Mín. 8 caracteres, mayúscula, minúscula, número y símbolo.";
            }
            return null;
        case "confirmPassword":
            if (!value.trim()) return "La confirmación de contraseña es obligatoria.";
            if (value !== formData.newPassword) {
                return "La nueva contraseña y su confirmación no coinciden.";
            }
            return null;
        default:
            return null;
    }
};

const PasswordChangeForm = ({ onPasswordChanged, onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  const [apiError, setApiError] = useState(null);
  const [backendFieldErrors, setBackendFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setApiError(null);
    setBackendFieldErrors({});
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);
    setSuccessMessage(null);
  }, []);

  const internalHandleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    
    if (apiError) setApiError(null);
    if (backendFieldErrors[name]) {
        setBackendFieldErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
    if (successMessage) setSuccessMessage(null);

    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validatePasswordField(name, value, {...formData, [name]: value});
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));

    if (name === "newPassword" && formData.confirmPassword) {
        const confirmError = validatePasswordField("confirmPassword", formData.confirmPassword, {...formData, newPassword: value});
        setClientFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!touched[name]) {
        setTouched(prev => ({ ...prev, [name]: true }));
    }
    const error = validatePasswordField(name, value, formData);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const runAllValidations = () => {
    const fieldsToValidate = ["currentPassword", "newPassword", "confirmPassword"];
    let newClientErrors = {};
    let formIsValid = true;
    fieldsToValidate.forEach(fieldName => {
        const error = validatePasswordField(fieldName, formData[fieldName], formData);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setBackendFieldErrors({});
    setSuccessMessage(null);
    setHasAttemptedSubmit(true);

    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true; return acc;
    }, {});
    setTouched(allFieldsTouched);

    const isClientValid = runAllValidations();
    if (!isClientValid || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      // --- CORRECCIÓN AQUÍ ---
      // Se añade el campo `confirmPassword` para que el backend pueda realizar su propia validación.
      const response = await cambiarContraseñaActual({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTouched({});
      setHasAttemptedSubmit(false);
      setClientFieldErrors({});
      if (onPasswordChanged) {
        onPasswordChanged(response.message || '¡Contraseña actualizada exitosamente!');
      } else {
        setSuccessMessage(response.message || '¡Contraseña actualizada exitosamente!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error.';
      const fieldErrs = err.response?.data?.errors;
      if (fieldErrs && Array.isArray(fieldErrs)) {
          const newBackendFieldErrors = {};
          fieldErrs.forEach(fe => {
              if(fe.path) newBackendFieldErrors[fe.path] = fe.msg;
          });
          setBackendFieldErrors(newBackendFieldErrors);
          setApiError(errorMessage);
      } else {
        setApiError(errorMessage);
      }
      console.error("API Error en PasswordChangeForm:", err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));
  
  const isButtonDisabled = isSaving || 
                           (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null)) ||
                           Object.keys(backendFieldErrors).length > 0;

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {apiError && !Object.keys(backendFieldErrors).length > 0 && (
            <Alert color="danger" className="mb-3" toggle={() => setApiError(null)} fade={false}>{apiError}</Alert>
        )}
        {successMessage && (
            <Alert color="success" className="mb-3" toggle={() => setSuccessMessage(null)} fade={false}>
                {successMessage}
            </Alert>
        )}

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="currentPassword" className="fw-bold">Contraseña Actual <span className="text-danger">*</span></Label>
                    <Input
                        type="password" id="currentPassword" name="currentPassword"
                        value={formData.currentPassword} 
                        onChange={internalHandleChange}
                        onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm" autoComplete="current-password"
                        invalid={!!getFieldError('currentPassword')}
                    />
                    <FormFeedback>{getFieldError('currentPassword')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="newPassword" className="fw-bold">Nueva Contraseña <span className="text-danger">*</span></Label>
                    <Input
                        type="password" id="newPassword" name="newPassword"
                        value={formData.newPassword} 
                        onChange={internalHandleChange}
                        onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm" autoComplete="new-password"
                        invalid={!!getFieldError('newPassword')}
                    />
                    <FormFeedback>{getFieldError('newPassword')}</FormFeedback>
                    {!(touched.newPassword || hasAttemptedSubmit) && !getFieldError('newPassword') && (
                        <small className="text-muted d-block mt-1">
                            Mín. 8 caracteres. Debe incluir: mayúscula, minúscula, número y símbolo (ej: !@#$%).
                        </small>
                    )}
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="confirmPassword" className="fw-bold">Confirmar Nueva Contraseña <span className="text-danger">*</span></Label>
                    <Input
                        type="password" id="confirmPassword" name="confirmPassword"
                        value={formData.confirmPassword} 
                        onChange={internalHandleChange}
                        onBlur={handleBlur}
                        disabled={isSaving} bsSize="sm" autoComplete="new-password"
                        invalid={!!getFieldError('confirmPassword')}
                    />
                    <FormFeedback>{getFieldError('confirmPassword')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          {onCancel && (
            <Button
              type="button" color="danger" onClick={onCancel}
              disabled={isSaving} size="sm"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit" color="success"
            disabled={isButtonDisabled}
            size="sm"
          >
            {isSaving ? <Spinner size="sm" /> : 'Actualizar Contraseña'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

PasswordChangeForm.propTypes = {
  onPasswordChanged: PropTypes.func,
  onCancel: PropTypes.func,
};

export default PasswordChangeForm;