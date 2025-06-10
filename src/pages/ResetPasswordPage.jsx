// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Form, FormGroup, Label, Input, Button, Alert, Card, CardBody, CardTitle, Spinner
} from 'reactstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { verifyResetTokenAPI, resetPasswordAPI } from '../api/authApiService'; // <<--- IMPORTA LAS FUNCIONES

import '../assets/Login.css'; // Reutiliza los estilos
import logoImage from '../assets/logo.png'; // Reutiliza el logo

const ResetPasswordPage = () => {
  const { token } = useParams(); // Obtiene el token de la URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [alertInfo, setAlertInfo] = useState({ visible: false, message: '', color: '' });
  
  const [isTokenVerificationLoading, setIsTokenVerificationLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const verifyTokenOnLoad = async () => {
      if (!token) {
        setAlertInfo({ visible: true, message: 'Token no proporcionado o inválido.', color: 'danger' });
        setIsTokenValid(false);
        setIsTokenVerificationLoading(false);
        return;
      }
      try {
        // Llama a la API para verificar el token
        await verifyResetTokenAPI(token);
        setIsTokenValid(true);
        setAlertInfo({ visible: false, message: '', color: '' }); // Limpiar alertas previas
      } catch (err) {
        setAlertInfo({ 
            visible: true, 
            message: err.response?.data?.message || 'El token es inválido, ha expirado o ya fue utilizado.', 
            color: 'danger' 
        });
        setIsTokenValid(false);
      } finally {
        setIsTokenVerificationLoading(false);
      }
    };
    verifyTokenOnLoad();
  }, [token]); // Se ejecuta cuando el token cambia (al cargar la página)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setAlertInfo({ visible: false, message: '', color: '' });

    if (newPassword !== confirmPassword) {
      setAlertInfo({ visible: true, message: 'Las contraseñas no coinciden.', color: 'danger' });
      setIsResetting(false);
      return;
    }
    if (newPassword.length < 6) { // Sincroniza con la validación del backend
      setAlertInfo({ visible: true, message: 'La nueva contraseña debe tener al menos 6 caracteres.', color: 'danger' });
      setIsResetting(false);
      return;
    }

    try {
      const response = await resetPasswordAPI(token, newPassword);
      setAlertInfo({
        visible: true,
        message: response.data.message || '¡Contraseña restablecida con éxito! Serás redirigido para iniciar sesión.',
        color: 'success'
      });
      // Opcional: si tu API devuelve un JWT para auto-login, podrías manejarlo aquí.
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Espera 3 segundos antes de redirigir
    } catch (err) {
      setAlertInfo({
        visible: true,
        message: err.response?.data?.message || 'Error al restablecer la contraseña. El token podría haber expirado o ser incorrecto.',
        color: 'danger'
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isTokenVerificationLoading) {
    return (
      <div className="login-split-container">
        <div className="login-image-half"></div>
        <div className="login-form-half d-flex align-items-center justify-content-center">
          <div>
            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3">Verificando token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si el token no es válido, muestra un mensaje y no el formulario de reseteo
  if (!isTokenValid && !isTokenVerificationLoading) { // Asegúrate de que la carga haya terminado
    return (
      <div className="login-split-container">
        <div className="login-image-half"></div>
        <div className="login-form-half">
          <Card className="login-form-card">
            <CardBody>
              <img src={logoImage} alt="Logo" className="login-form-logo" />
              <CardTitle tag="h4" className="login-form-title text-danger">
                Error de Token
              </CardTitle>
              {alertInfo.visible && (
                <Alert color={alertInfo.color} isOpen={alertInfo.visible} fade={false} className="mt-3 mb-3">
                  {alertInfo.message}
                </Alert>
              )}
              <div className="text-center mt-3">
                <Link to="/recuperar-contrasena" className="forgot-password-link">
                  Solicitar un nuevo enlace
                </Link>
                <br />
                <Link to="/login" className="forgot-password-link mt-2 d-inline-block">
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }
  
  // Si el token es válido, muestra el formulario para la nueva contraseña
  return (
    <div className="login-split-container">
      <div className="login-image-half"></div>
      <div className="login-form-half">
        <Card className="login-form-card">
          <CardBody>
            <img src={logoImage} alt="Logo" className="login-form-logo" />
            <CardTitle tag="h4" className="login-form-title">
              Establecer Nueva Contraseña
            </CardTitle>
            <p className="login-form-subtitle">
              Ingresa tu nueva contraseña.
            </p>

            {alertInfo.visible && (
              <Alert color={alertInfo.color} isOpen={alertInfo.visible} toggle={() => setAlertInfo({ ...alertInfo, visible: false })} fade={false} className="mt-3 mb-3">
                {alertInfo.message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="newPassword-reset" className="form-label visually-hidden">Nueva Contraseña</Label>
                <Input
                  type="password"
                  id="newPassword-reset"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva Contraseña"
                  required
                  disabled={isResetting}
                  className="form-control"
                />
              </FormGroup>

              <FormGroup className="mt-3">
                <Label htmlFor="confirmPassword-reset" className="form-label visually-hidden">Confirmar Nueva Contraseña</Label>
                <Input
                  type="password"
                  id="confirmPassword-reset"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar Nueva Contraseña"
                  required
                  disabled={isResetting}
                  className="form-control"
                />
              </FormGroup>

              <Button color="primary" type="submit" disabled={isResetting} className="btn-primary mt-3">
                {isResetting ? (
                  <><Spinner size="sm" className="me-2"/> Estableciendo...</>
                ) : (
                  'Establecer Contraseña'
                )}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <Link to="/login" className="forgot-password-link">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;