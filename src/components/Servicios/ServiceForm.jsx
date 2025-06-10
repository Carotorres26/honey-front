// src/components/Services/ServiceForm.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Form, FormGroup, Label, Input, Button, Alert, Spinner, FormFeedback, Row, Col
} from 'reactstrap';

const validateField = (name, value, formData, isEditing, imageFile) => {
    switch (name) {
        case "nombre":
            if (!value?.trim()) return "El nombre del servicio es obligatorio.";
            if (value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        case "descripcion":
            return null; // Opcional
        case "imagen": 
            // La obligatoriedad ya no se valida aquí. Tipo/tamaño en handleFileChange.
            return null; 
        default:
            return null;
    }
};

const ServiceForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  apiError: parentApiError,
  isSaving,
  fieldErrors: backendFieldErrors = {}
}) => {
  const getInitialFormData = useCallback(() => ({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
  }), [initialData]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [localFormError, setLocalFormError] = useState('');

  const isEditing = !!initialData;

  const runAllValidations = useCallback(() => {
    const fieldsToValidate = ["nombre"]; // Solo 'nombre' es obligatorio aquí
    let newClientErrors = {};
    let formIsValid = true;

    fieldsToValidate.forEach(fieldName => {
        const value = formData[fieldName];
        const error = validateField(fieldName, value, formData, isEditing, imageFile);
        if (error) {
            newClientErrors[fieldName] = error;
            formIsValid = false;
        } else {
            newClientErrors[fieldName] = null;
        }
    });
    setClientFieldErrors(newClientErrors);
    return formIsValid;
  }, [formData, isEditing, imageFile]);

  useEffect(() => {
    setLocalFormError('');
    setImageFile(null);
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);

    const currentFormData = getInitialFormData();
    setFormData(currentFormData);

    if (initialData) {
      setImagePreview(initialData.imagen || initialData.image_url || null);
    } else {
      setImagePreview(null);
    }

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [initialData, getInitialFormData]);

  const internalHandleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value, {...formData, [name]: value}, isEditing, imageFile);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
    if (localFormError && name !== "imagen") setLocalFormError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!touched[name]) {
        setTouched(prev => ({ ...prev, [name]: true }));
    }
    const error = validateField(name, value, formData, isEditing, imageFile);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const internalHandleFileChange = (e) => {
    const file = e.target.files[0];
    setLocalFormError('');
    setClientFieldErrors(prev => ({ ...prev, imagen: null }));
    setTouched(prev => ({ ...prev, imagen: true }));

    if (file) {
      if (!file.type.startsWith('image/')) {
        setLocalFormError('Archivo no válido. Seleccione JPG, PNG, GIF o WebP.');
        setImageFile(null);
        setImagePreview(initialData?.imagen || initialData?.image_url || null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalFormError('Archivo demasiado grande. Máximo 5MB.');
        setImageFile(null);
        setImagePreview(initialData?.imagen || initialData?.image_url || null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(initialData?.imagen || initialData?.image_url || null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const fieldsToTouchOnSubmit = { nombre: true, descripcion: true, imagen: true };
    setTouched(prev => ({...prev, ...fieldsToTouchOnSubmit}));

    const isClientValid = runAllValidations();
    if (!isClientValid || !!localFormError || isSaving) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nombre', formData.nombre.trim());
    formDataToSend.append('descripcion', formData.descripcion.trim());
    if (imageFile) {
      formDataToSend.append('imagen', imageFile);
    } 
    // Si se está editando y no se seleccionó una nueva imagen, el backend no debería
    // requerir 'imagen'. Si el backend borra la imagen si el campo 'imagen' no está presente
    // en una actualización, se necesitaría lógica adicional (ej. enviar un flag).
    
    onSubmit(formDataToSend); // El padre decide si es CREATE o UPDATE
  };

  const formTitle = isEditing ? "Actualizar Servicio" : "Crear Servicio";
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));

  const isButtonDisabled = isSaving || !!localFormError || Object.keys(backendFieldErrors).length > 0 ||
                         (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));
  
  // Condición para el fondo de sugerencia de imagen
  const noImageSelectedOrPresent = !imageFile && !imagePreview;

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
            <Alert color="danger" className="mb-3">{parentApiError}</Alert>
        )}
        {localFormError && <Alert color="warning" className="mb-3" toggle={() => setLocalFormError('')}>{localFormError}</Alert>}

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="serviceName" className="fw-bold">Nombre <span className="text-danger">*</span></Label>
                    <Input
                        id="serviceName" type="text" name="nombre"
                        value={formData.nombre} 
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        invalid={!!getFieldError('nombre')}
                        bsSize="sm" placeholder="Ej: Alimentacion, Veterinaria, etc."
                    />
                    <FormFeedback>{getFieldError('nombre')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup>
                    <Label for="serviceDescription" className="fw-bold">Descripción</Label>
                    <Input
                        id="serviceDescription" type="textarea" name="descripcion"
                        value={formData.descripcion} 
                        onChange={internalHandleInputChange}
                        onBlur={handleBlur}
                        rows="3" disabled={isSaving} bsSize="sm" placeholder="Detalles del servicio..."
                        invalid={!!getFieldError('descripcion')}
                    />
                    <FormFeedback>{getFieldError('descripcion')}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={12}>
                <FormGroup 
                    style={
                        noImageSelectedOrPresent 
                        ? { backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '0.25rem', border: '1px dashed #ffc107' } 
                        : { padding: '1rem', borderRadius: '0.25rem' }
                    }
                >
                    <Label for="serviceImageFile" className="fw-bold">
                        Imagen {isEditing && (initialData?.imagen || initialData?.image_url) ? '(Opcional: reemplazar existente)' : '(Opcional)'}
                    </Label>
                    <Input
                        id="serviceImageFile" type="file" name="imagen"
                        onChange={internalHandleFileChange}
                        accept="image/*" disabled={isSaving}
                        innerRef={fileInputRef} bsSize="sm"
                        invalid={!!localFormError.includes("imagen") || !!backendFieldErrors.imagen } 
                    />
                    {backendFieldErrors.imagen && <FormFeedback>{backendFieldErrors.imagen}</FormFeedback>}
                    {/* localFormError (para tipo/tamaño) ya se muestra en la alerta general */}

                    {imagePreview && (
                        <div className="mt-2 text-center border rounded p-2" style={{backgroundColor: '#f8f9fa'}}>
                            <Label className='d-block text-muted small mb-1'>Previsualización:</Label>
                            <img src={imagePreview} alt="Previsualización" style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}/>
                            {imageFile && <small className="text-muted d-block mt-1">Nuevo: {imageFile.name}</small>}
                        </div>
                    )}
                    {noImageSelectedOrPresent && (
                        <small className="text-muted d-block mt-1">
                            (Sugerencia: Añadir una imagen mejora la presentación del servicio)
                        </small>
                    )}
                </FormGroup>
            </Col>
        </Row>

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

export default ServiceForm;