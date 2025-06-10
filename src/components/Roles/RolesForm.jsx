// src/components/Roles/RolesForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Añadido useCallback
import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Table,
  Alert,
  Spinner,
  FormFeedback,
  Row,
  Col,
} from "reactstrap";
import { modules as allAvailablePermissionNames, moduleNameMap } from "./rolesConstants";

// --- Función de Validación Específica ---
const validateField = (name, value, selectedPermissions, allPermissions) => {
    switch (name) {
        case "name": // 'name' del input, que corresponde a 'roleName' en el estado
            if (!value.trim()) return "El nombre del rol es obligatorio.";
            if (!/^[a-zA-Z0-9_ ÁÉÍÓÚáéíóúñÑ-]+$/.test(value.trim())) {
                return "Nombre del rol: solo letras, números, espacios y guiones (_-).";
            }
            if (value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres."; // Ejemplo
            return null;
        case "permissions": // 'permissions' es un concepto, no un input directo con 'value'
            if (allPermissions.length > 0 && selectedPermissions.length === 0) {
                return "Debe seleccionar al menos un permiso para el rol.";
            }
            return null;
        default:
            return null;
    }
};


const RolesForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  apiError: parentApiError, // Renombrado
  isSaving,
  fieldErrors: backendFieldErrors = {}, // Renombrado
}) => {
  const [roleName, setRoleName] = useState("");
  const [selectedPermissionNames, setSelectedPermissionNames] = useState([]);
  
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  // localFormError ya no se usa para errores de campo

  const isEditing = !!initialData;

  // runAllValidations envuelta en useCallback
  const runAllValidations = useCallback(() => {
    const fieldsToValidate = ["name", "permissions"];
    let newClientErrors = {};
    let formIsValid = true;

    fieldsToValidate.forEach(fieldName => {
        const value = fieldName === "name" ? roleName : selectedPermissionNames;
        const error = validateField(fieldName, value, selectedPermissionNames, allAvailablePermissionNames);
        if (error) {
            newClientErrors[fieldName] = error;
            formIsValid = false;
        } else {
            newClientErrors[fieldName] = null;
        }
    });
    setClientFieldErrors(newClientErrors);
    return formIsValid;
  }, [roleName, selectedPermissionNames]); // Dependencias


  useEffect(() => {
    // Resetear errores y 'touched' cuando initialData cambia
    setClientFieldErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);

    if (initialData) {
      setRoleName(initialData.name || "");
      const initialPerms = Array.isArray(initialData.permissions) ? initialData.permissions : [];
      setSelectedPermissionNames(initialPerms.filter(pName => allAvailablePermissionNames.includes(pName)));
    } else {
      setRoleName("");
      setSelectedPermissionNames([]);
    }
    // No llamar a runAllValidations aquí para el comportamiento deseado del botón
  }, [initialData]); // Quitado runAllValidations de aquí

  const isAllSelected = useMemo(() => {
    if (allAvailablePermissionNames.length === 0) return false;
    return allAvailablePermissionNames.every(permName => selectedPermissionNames.includes(permName));
  }, [selectedPermissionNames, allAvailablePermissionNames]);

  const handleRoleNameChange = (e) => {
    const { value } = e.target;
    setRoleName(value);
    setTouched(prev => ({ ...prev, name: true }));
    const error = validateField("name", value, selectedPermissionNames, allAvailablePermissionNames);
    setClientFieldErrors(prev => ({ ...prev, name: error }));
  };

  const handlePermissionChange = (permissionName) => {
    const newSelectedPermissions = selectedPermissionNames.includes(permissionName)
        ? selectedPermissionNames.filter((pName) => pName !== permissionName)
        : [...selectedPermissionNames, permissionName];
    setSelectedPermissionNames(newSelectedPermissions);
    
    setTouched(prev => ({ ...prev, permissions: true }));
    const error = validateField("permissions", newSelectedPermissions, newSelectedPermissions, allAvailablePermissionNames);
    setClientFieldErrors(prev => ({ ...prev, permissions: error }));
  };

  const handleSelectAllChange = (e) => {
    const isChecked = e.target.checked;
    const newSelectedPermissions = isChecked ? [...allAvailablePermissionNames] : [];
    setSelectedPermissionNames(newSelectedPermissions);

    setTouched(prev => ({ ...prev, permissions: true }));
    const error = validateField("permissions", newSelectedPermissions, newSelectedPermissions, allAvailablePermissionNames);
    setClientFieldErrors(prev => ({ ...prev, permissions: error }));
  };
  
  const handleBlur = (e) => { // Específico para roleName
    const { name, value } = e.target; // name será "name"
    if (!touched[name]) {
        setTouched(prev => ({ ...prev, [name]: true }));
    }
    const error = validateField(name, value, selectedPermissionNames, allAvailablePermissionNames);
    setClientFieldErrors(prev => ({ ...prev, [name]: error }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const allFieldsTouched = { name: true, permissions: true }; // Campos principales a marcar
    setTouched(allFieldsTouched);
    
    const isFormValid = runAllValidations();
    if (!isFormValid || isSaving) {
      return;
    }
    const dataToSend = {
      name: roleName.trim(),
      permissions: selectedPermissionNames,
    };
    onSubmit(dataToSend);
  };

  const formTitle = isEditing ? "Guardar Cambios" : "Crear Rol";
  const getFieldError = (name) => (backendFieldErrors[name] || ((touched[name] || hasAttemptedSubmit) && clientFieldErrors[name]));

  const isButtonDisabled = isSaving || Object.keys(backendFieldErrors).length > 0 ||
                         (hasAttemptedSubmit && Object.values(clientFieldErrors).some(err => err !== null));

  return (
    <div className="border p-3 rounded">
      <Form onSubmit={handleSubmit} className="mt-3" noValidate>
        {parentApiError && !Object.keys(backendFieldErrors).length && (
          <Alert color="danger" className="mb-3"> {parentApiError} </Alert>
        )}
        {/* No hay alerta de localFormError general, los errores son por campo */}

        <Row className="mb-3">
          <Col md={6}>
            <FormGroup>
              <Label for="roleName" className="fw-bold">
                Nombre del Rol <span className="text-danger">*</span>
              </Label>
              <Input
                id="roleName" name="name" type="text"
                value={roleName}
                onChange={handleRoleNameChange}
                onBlur={handleBlur} // Añadido onBlur
                disabled={isSaving}
                invalid={!!getFieldError("name")}
                bsSize="sm"
                placeholder="Ej: Administrador, Cuidador"
              />
              <FormFeedback>{getFieldError("name")}</FormFeedback>
            </FormGroup>
          </Col>
          <Col md={6}></Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <FormGroup>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label className="fw-bold mb-0">
                  Permisos <span className="text-danger">*</span>
                </Label>
                  {allAvailablePermissionNames.length > 0 && (
                  <div className="ms-auto d-flex align-items-center">
                    <Input
                      type="checkbox" id="select-all-permissions"
                      className="form-check-input position-static m-0 me-1"
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      checked={isAllSelected}
                      onChange={handleSelectAllChange} // Valida al cambiar "Todos"
                      disabled={isSaving}
                    />
                    <Label for="select-all-permissions" className="small mb-0" style={{ cursor: 'pointer' }}>
                      Todos
                    </Label>
                  </div>
                )}
              </div>

              {/* Aplicar clase 'is-invalid' al contenedor si hay error en 'permissions' */}
              <div
                className={`border rounded p-2 mt-1 ${getFieldError('permissions') ? 'is-invalid' : ''}`}
                style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}
              >
                {allAvailablePermissionNames.length > 0 ? (
                  <Table borderless hover responsive size="sm" className="mb-0 align-middle">
                    {/* ... (thead y tbody de la tabla sin cambios funcionales) ... */}
                    <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                      <tr>
                        <th>Permiso </th>
                        <th className="text-center" style={{ width: '80px' }}>Asignar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAvailablePermissionNames.map((permissionName) => (
                        <tr key={permissionName}>
                          <td>
                            <strong>
                              {moduleNameMap[permissionName] ||
                               permissionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </strong>
                          </td>
                          <td className="text-center">
                            <FormGroup check className="d-inline-block m-0 p-0">
                              <Label check className="d-flex justify-content-center align-items-center h-100">
                                <Input
                                  type="checkbox"
                                  className="form-check-input position-static m-0"
                                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                  checked={selectedPermissionNames.includes(permissionName)}
                                  onChange={() => handlePermissionChange(permissionName)} // Valida al cambiar permiso individual
                                  disabled={isSaving}
                                />
                              </Label>
                            </FormGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center text-muted fst-italic py-3">
                    No hay módulos de permisos definidos en `rolesConstants.js`.
                  </div>
                )}
              </div>
              {/* FormFeedback para 'permissions' */}
              {getFieldError('permissions') && <FormFeedback className="d-block mt-1">{getFieldError('permissions')}</FormFeedback>}
            </FormGroup>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          <Button type="button" color="danger" onClick={onCancel} disabled={isSaving} size="sm">
            Cancelar
          </Button>
          <Button type="submit" color="success" 
                  disabled={isButtonDisabled} 
                  size="sm">
            {isSaving ? <Spinner size="sm" /> : formTitle}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default RolesForm;