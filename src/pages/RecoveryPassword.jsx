// src/pages/RecoveryPassword.jsx
import React, { useState } from 'react';
import {
  Form, FormGroup, Label, Input, Button, Alert, Card, CardBody, CardTitle, Spinner
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { requestPasswordResetAPI } from '../api/authApiService'; // Asumiendo que esta función se adaptará

import '../assets/Login.css';
import logoImage from '../assets/logo.png';

const RecoveryPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [alertInfo, setAlertInfo] = useState({ visible: false, message: '', color: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertInfo({ visible: false, message: '', color: '' });

    try {
      // Llamada real a la API, ahora pasando un objeto con username y email
      const response = await requestPasswordResetAPI({ username, email }); // <<--- CAMBIO AQUÍ
      
      console.log('Solicitud de recuperación enviada para usuario:', username, 'y correo:', email);
      setAlertInfo({
        visible: true,
        message: response.data.message || 'Si el usuario y correo electrónico están registrados y coinciden, recibirás instrucciones.',
        color: 'success'
      });
      setUsername(''); 
      setEmail('');   
    } catch (error) {
      console.error("Error en RecoveryPassword handleSubmit:", error);
      setAlertInfo({
        visible: true,
        message: error.response?.data?.message || error.message || 'Error al procesar la solicitud. Verifica los datos e inténtalo de nuevo.',
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      <div className="login-image-half"></div>
      <div className="login-form-half">
        <Card className="login-form-card">
          <CardBody>
            <img src={logoImage} alt="Logo" className="login-form-logo" />
            <CardTitle tag="h4" className="login-form-title">
              Recuperar Contraseña
            </CardTitle>
            <p className="login-form-subtitle">
              Ingresa tu nombre de usuario y correo electrónico.
            </p>

            {alertInfo.visible && (
              <Alert color={alertInfo.color} isOpen={alertInfo.visible} toggle={() => setAlertInfo({ ...alertInfo, visible: false })} fade={false} className="mt-3 mb-3">
                {alertInfo.message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="username-recovery" className="form-label visually-hidden">Usuario</Label>
                <Input
                  type="text"
                  id="username-recovery"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  required
                  disabled={isLoading}
                  className="form-control"
                />
              </FormGroup>

              <FormGroup className="mt-3">
                <Label htmlFor="email-recovery" className="form-label visually-hidden">Correo Electrónico</Label>
                <Input
                  type="email"
                  id="email-recovery"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  required
                  disabled={isLoading}
                  className="form-control"
                />
              </FormGroup>

              <Button color="primary" type="submit" disabled={isLoading} className="btn-primary mt-3">
                {isLoading ? (
                  <><Spinner size="sm" className="me-2"/> Enviando...</>
                ) : (
                  'Enviar Instrucciones'
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

export default RecoveryPassword;