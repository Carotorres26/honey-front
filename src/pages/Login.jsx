// src/pages/Login.jsx
import React, { useState } from 'react';
import {
  Form, FormGroup, Label, Input, Button, Alert,
  Card, CardBody, CardTitle, Spinner, FormFeedback
} from 'reactstrap';
import { loginUserApi } from '../api/userApi';
import { useNavigate } from "react-router-dom";
import '../assets/Login.css'; // Asegúrate que la ruta sea correcta
import logoImage from '../assets/logo.png'; // Asegúrate que la ruta sea correcta

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alertInfo, setAlertInfo] = useState({ visible: false, message: '', color: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlertInfo({ visible: false, message: '', color: '' });
    setFieldErrors({});
    setIsLoading(true);

    try {
      const credentials = { username, password }; // Envía 'username'
      const response = await loginUserApi(credentials);

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.user) { // Guardar datos del usuario si el backend los devuelve
            localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        navigate('/dashboard');
      } else {
        throw new Error('Respuesta inesperada del servidor: no se recibió token.');
      }
    } catch (error) {
      let displayMessage = error.message || 'Credenciales inválidas o error del servidor.';
      const errorData = error.data; // Asumiendo que el interceptor adjunta error.response.data como error.data

      if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
          const newFieldErrors = {};
          let hasFieldSpecificError = false;
          errorData.errors.forEach(err => {
              if (err.path) {
                  // El backend ahora espera 'username', así que el path será 'username'
                  newFieldErrors[err.path] = err.msg;
                  hasFieldSpecificError = true;
              }
          });
          setFieldErrors(newFieldErrors);
          if (hasFieldSpecificError) {
              displayMessage = "Por favor, corrija los errores indicados.";
          } else if (errorData.message) {
            displayMessage = errorData.message;
          }
      } else if (errorData && errorData.message) {
        displayMessage = errorData.message;
      }

      setAlertInfo({
        visible: true,
        message: displayMessage,
        color: 'danger'
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del enlace <a>
    navigate('/recuperar-contrasena'); // Redirige a la página de recuperación
  };

  return (
    <div className="login-split-container">
      <div className="login-image-half"></div>
      <div className="login-form-half">
        <Card className="login-form-card">
          <CardBody>
            <img src={logoImage} alt="Logo" className="login-form-logo" />
            <CardTitle tag="h4" className="login-form-title">Iniciar Sesión</CardTitle>
            <p className="login-form-subtitle">Bienvenido a H-Honey</p>

            {alertInfo.visible && (
              <Alert
                color={alertInfo.color}
                isOpen={alertInfo.visible}
                toggle={() => setAlertInfo({ ...alertInfo, visible: false })}
                fade={false}
                className="mt-3 mb-3"
              >
                {alertInfo.message}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              <FormGroup>
                <Label for="usernameLogin" className="form-label visually-hidden">Usuario</Label>
                <Input
                  type="text"
                  name="username" // El input se llama 'username'
                  id="usernameLogin"
                  value={username}
                  onChange={(e) => {
                      setUsername(e.target.value);
                      // Limpiar error del campo al escribir
                      if(fieldErrors.username) setFieldErrors(prev => ({...prev, username: null}));
                      if(alertInfo.visible) setAlertInfo({ visible: false, message: '', color: '' });
                  }}
                  placeholder="Usuario"
                  disabled={isLoading}
                  className="form-control"
                  invalid={!!fieldErrors.username} // Mostrar error si existe para 'username'
                />
                {fieldErrors.username && <FormFeedback>{fieldErrors.username}</FormFeedback>}
              </FormGroup>

              <FormGroup className="mt-3">
                <Label for="passwordLogin" className="form-label visually-hidden">Contraseña</Label>
                <Input
                  type="password"
                  name="password"
                  id="passwordLogin"
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value);
                      if(fieldErrors.password) setFieldErrors(prev => ({...prev, password: null}));
                      if(alertInfo.visible) setAlertInfo({ visible: false, message: '', color: '' });
                  }}
                  placeholder="Contraseña"
                  disabled={isLoading}
                  className="form-control"
                  invalid={!!fieldErrors.password}
                />
                {fieldErrors.password && <FormFeedback>{fieldErrors.password}</FormFeedback>}
              </FormGroup>

              <Button color="primary" type="submit" disabled={isLoading} className="btn-primary w-100 mt-3">
                {isLoading ? (<><Spinner size="sm" className="me-2"/> Ingresando...</>) : ('Iniciar Sesión')}
              </Button>
            </Form>

            <div className="text-center mt-3"> {/* Añadí mt-3 para un poco de espacio */}
              <a
                href="#" // href="#" es opcional si solo usas onClick
                className="forgot-password-link"
                onClick={handleForgotPassword} // El handler se encarga de la navegación
              >
                Olvide mi contraseña
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login; 