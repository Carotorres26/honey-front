// src/components/Usuarios/UserForm.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
    Form, FormGroup, Label, Input, Alert, Row, Col, FormFeedback, Spinner, Button
} from "reactstrap";
import apiClient from "../../utils/apiClient"; // Ajusta la ruta si es necesario

// --- Funciones de Validación Específicas ---
const validateField = (name, value, formData, isEditing) => {
    const trimmedValue = value.trim(); // Usar valor sin espacios para validaciones

    switch (name) {
        case "nombreCompleto":
            if (!trimmedValue) return "El nombre completo es requerido.";
            if (trimmedValue.length < 3) return "El nombre debe tener al menos 3 caracteres.";
            return null;
        case "documento":
            if (!trimmedValue) return "El documento es requerido.";
            if (!/^\d+$/.test(trimmedValue)) {
                return "El documento solo debe contener números.";
            }
            if (trimmedValue.length < 9 || trimmedValue.length > 11) {
                return "El documento debe tener entre 9 y 11 dígitos.";
            }
            return null;
        case "email":
            if (!trimmedValue) return "El correo electrónico es requerido.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
                return "El formato del correo electrónico no es válido.";
            }
            return null;
        case "username":
            if (!trimmedValue) return "El nombre de usuario es requerido.";
            if (trimmedValue.length < 4) return "El username debe tener al menos 4 caracteres.";
            return null;
        case "password":
            if (!isEditing && !trimmedValue) { // Solo para creación o si se modifica
                return "La contraseña es requerida para nuevos usuarios.";
            }
            if (trimmedValue) { 
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
                if (!strongPasswordRegex.test(value)) { // Usar 'value' original aquí, no trimmedValue, para regex
                    return "Mín. 8 caracteres, mayúscula, minúscula, número y símbolo.";
                }
            }
            return null;
        case "roleId":
            if (!value) return "El rol es requerido."; // value aquí es el ID, no necesita trim
            return null;
        case "celular": // Ahora es obligatorio
            if (!trimmedValue) return "El celular es requerido.";
            if (!/^\d+$/.test(trimmedValue)) {
                 return "El celular solo debe contener números.";
            }
            if (trimmedValue.length !== 10) {
                return "El celular debe tener exactamente 10 dígitos.";
            }
            return null;
        default:
            return null;
    }
};

const UserForm = ({
  initialData,
  apiError: parentApiError,
  isSaving,
  onSubmit,
  onCancel,
  fieldErrors: backendFieldErrors = {}
}) => {
  const getInitialFormData = useCallback(() => ({
    nombreCompleto: "",
    documento: "",
    email: "",
    celular: "",
    username: "",
    password: "",
    roleId: "",
  }), []);

  const [formData, setFormData] = useState(getInitialFormData());
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errorRoles, setErrorRoles] = useState('');
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const isEditing = !!(initialData?.id || initialData?._id);

  useEffect(() => {
    const cargarRoles = async () => {
      setLoadingRoles(true); setErrorRoles('');
      try {
        const response = await apiClient.get("/roles?includeInactive=true");
        setRoles(response.data && Array.isArray(response.data) ? response.data : []);
        if (!(response.data && Array.isArray(response.data))) setErrorRoles('Respuesta inesperada al cargar roles.');
      } catch (err) {
        console.error("[UserForm] Error cargando roles:", err);
        setErrorRoles(`Error al cargar roles: ${err.message || 'Error desconocido'}`);
        setRoles([]);
      } finally { setLoadingRoles(false); }
    };
    cargarRoles();
  }, []);

  useEffect(() => {
    const newFormData = isEditing && initialData ? {
        nombreCompleto: initialData.nombreCompleto || "",
        documento: initialData.documento || "",
        email: initialData.email || "",
        celular: initialData.celular || "",
        username: initialData.username || "",
        password: "",
        roleId: initialData.role?.id?.toString() || initialData.roleId?.toString() || "",
    } : getInitialFormData();
    
    setFormData(newFormData);
    setClientFieldErrors({});
    setTouched({});
  }, [initialData, isEditing, getInitialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // YA NO FILTRAMOS CARACTERES EN DOCUMENTO AQUÍ
    // let processedValue = value;
    // if (name === "documento") {
    //     processedValue = value.replace(/[^0-9]/g, ''); 
    // }

    setFormData((prev) => ({ ...prev, [name]: value })); // Usar 'value' directamente
    
    setTouched(prevTouched => ({ ...prevTouched, [name]: true }));

    const error = validateField(name, value, formData, isEditing); // Usar 'value' para validación
    setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!touched[name]) { 
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
    }
    const error = validateField(name, value, formData, isEditing);
    setClientFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
  };

  const runAllValidations = () => {
    const fieldsToValidate = ["nombreCompleto", "documento", "email", "username", "password", "roleId", "celular"];
    let newClientErrors = {};
    let formIsValid = true;

    fieldsToValidate.forEach(fieldName => {
        const value = formData[fieldName];
        const error = validateField(fieldName, value, formData, isEditing);
        if (error) {
            newClientErrors[fieldName] = error;
            formIsValid = false;
        }
    });
    setClientFieldErrors(newClientErrors);
    return formIsValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});
    setTouched(allFieldsTouched);

    const isFormValid = runAllValidations();

    if (!isFormValid || isSaving || loadingRoles) {
        return;
    }
    const dataToSend = {
        nombreCompleto: formData.nombreCompleto.trim(),
        documento: formData.documento.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim(), // Celular es obligatorio, no enviar null si está vacío
        username: formData.username.trim(),
        roleId: formData.roleId ? parseInt(formData.roleId, 10) : null,
    };
    if (formData.password && formData.password.trim() !== "") {
        dataToSend.password = formData.password;
    }
    onSubmit(dataToSend);
  };

  const formTitle = isEditing ? "Actualizar Usuario" : "Crear Usuario";
  const getFieldError = (name) => (backendFieldErrors[name] || (touched[name] && clientFieldErrors[name]));

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && <Alert color="danger" className="mb-3">{parentApiError}</Alert>}
        {errorRoles && <Alert color="warning" className="mb-3">{errorRoles}</Alert>}

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="user-nombreCompleto" className="fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="text" name="nombreCompleto" id="user-nombreCompleto" 
                           value={formData.nombreCompleto} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving} maxLength={150} 
                           invalid={!!getFieldError("nombreCompleto")}/>
                    <FormFeedback>{getFieldError("nombreCompleto")}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label for="user-documento" className="fw-bold">Documento <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="text" name="documento" id="user-documento"
                           value={formData.documento} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving} maxLength={11} // Maxlength ajustado
                           invalid={!!getFieldError("documento")}/>
                    <FormFeedback>{getFieldError("documento")}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="user-email" className="fw-bold">Correo Electrónico <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="email" name="email" id="user-email" 
                           value={formData.email} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving} maxLength={255} 
                           invalid={!!getFieldError("email")}/>
                    <FormFeedback>{getFieldError("email")}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    {/* Celular ahora es obligatorio */}
                    <Label for="user-celular" className="fw-bold">Celular <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="text" name="celular" id="user-celular" // type="text" para permitir validación sin filtro automático
                           value={formData.celular || ''} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving} maxLength={10} // Maxlength ajustado
                           invalid={!!getFieldError("celular")}/>
                    <FormFeedback>{getFieldError("celular")}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-2">
            <Col md={6}>
                <FormGroup>
                    <Label for="user-username" className="fw-bold">Nombre de Usuario <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="text" name="username" id="user-username" 
                           value={formData.username} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={isSaving} maxLength={30} autoComplete="username" 
                           invalid={!!getFieldError("username")}/>
                    <FormFeedback>{getFieldError("username")}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label for="user-password" className="fw-bold">Contraseña {isEditing ? '(Dejar vacío para no cambiar)' : <span className="text-danger">*</span>}</Label>
                    <Input bsSize="sm" type="password" name="password" id="user-password" 
                           value={formData.password} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           placeholder={isEditing ? "Nueva contraseña si desea cambiar" : ""} 
                           disabled={isSaving} autoComplete="new-password" 
                           invalid={!!getFieldError("password")}/>
                    <FormFeedback>{getFieldError("password")}</FormFeedback>
                </FormGroup>
            </Col>
        </Row>

        <Row className="mb-3">
            <Col md={6}>
                <FormGroup>
                    <Label for="user-roleId" className="fw-bold">Rol <span className="text-danger">*</span></Label>
                    <Input bsSize="sm" type="select" name="roleId" id="user-roleId" 
                           value={formData.roleId} 
                           onChange={handleInputChange} 
                           onBlur={handleBlur}
                           disabled={loadingRoles || roles.length === 0 || isSaving} 
                           invalid={!!getFieldError("roleId")}>
                    <option value="">{loadingRoles ? 'Cargando roles...' : (roles.length === 0 && !errorRoles ? 'No hay roles para asignar' : '-- Seleccione un Rol --')}</option>
                    {roles
                        .filter(role => role.status === true || (isEditing && formData.roleId === (role.id || role._id)?.toString()))
                        .map((role) => (
                        <option key={role.id || role._id} value={role.id || role._id}>
                            {role.name} {role.status === false ? '(Inactivo)' : ''}
                        </option>
                    ))}
                    </Input>
                    {loadingRoles && <Spinner size="sm" color="secondary" className="ms-2 align-middle" />}
                    {!loadingRoles && roles.filter(r=>r.status === true).length === 0 && !errorRoles && 
                        <small className="text-warning d-block mt-1">No hay roles activos para asignar. Contacte al administrador.</small>
                    }
                    <FormFeedback>{getFieldError("roleId")}</FormFeedback>
                </FormGroup>
            </Col>
            <Col md={6}></Col>
        </Row>
        
        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
            <Button type="button" color="danger" onClick={onCancel} disabled={isSaving} size="sm">
                Cancelar
            </Button>
            <Button type="submit" color="success" 
                    disabled={isSaving || loadingRoles || Object.values(clientFieldErrors).some(err => err !== null) || Object.keys(backendFieldErrors).length > 0} 
                    size="sm">
                {isSaving ? <Spinner size="sm" /> : formTitle}
            </Button>
        </div>
      </Form>
    </div>
  );
};

export default UserForm;