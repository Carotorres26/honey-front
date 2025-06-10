import React, { useEffect, useState, useCallback } from 'react';
import { getCurrentUserApi, updateCurrentUserApi } from '../api/userApi';
import PersonalProfile from '../components/Perfil/PersonalProfile';
import ProfileEditForm from '../components/Perfil/ProfileEditForm';
import PasswordChangeForm from '../components/Perfil/PasswordChangeForm';

import { Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';

const styles = {
  pageContainer: {
    padding: '2rem 1rem',
    minHeight: 'calc(100vh - 4rem)',
    boxSizing: 'border-box',
  },
  contentWrapper: {
    maxWidth: '950px',
    margin: '0 auto',
  },
  // ... otros estilos (globalSuccessMessage, globalErrorMessage) se mantienen
  globalSuccessMessage: {
    color: 'green',
    backgroundColor: '#d1e7dd',
    border: '1px solid #badbcc',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  globalErrorMessage: {
    color: 'red',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c2c7',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center'
  },
};

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await getCurrentUserApi();
      setUser(userData);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError(err.message || 'Error al cargar los datos del usuario.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const toggleEditProfileModal = () => {
    if (!isEditProfileModalOpen) {
      setError(null);
      setSuccessMessage(null);
    }
    setIsEditProfileModalOpen(!isEditProfileModalOpen);
  };

  const toggleChangePasswordModal = () => {
    if (!isChangePasswordModalOpen) {
      setError(null);
      setSuccessMessage(null);
    }
    setIsChangePasswordModalOpen(!isChangePasswordModalOpen);
  };

  const handleUpdateUser = async (updatedData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await updateCurrentUserApi(updatedData);
      // Asumiendo que updateCurrentUserApi ya maneja y lanza errores con mensajes formateados
      // y que una respuesta exitosa siempre tiene response.user
      if (response && response.user) {
        setUser(response.user);
        setSuccessMessage(response.message || '¡Perfil actualizado con éxito!');
        toggleEditProfileModal();
      } else {
        // Este caso podría no ser necesario si la API siempre devuelve error o usuario
        setError(response.message || 'Respuesta inesperada al actualizar.');
      }
    } catch (err) {
      // El interceptor de userApi.js ya debería haber formateado err.message
      setError(err.message || 'Ocurrió un error al actualizar el perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = (messageFromForm) => {
    setSuccessMessage(messageFromForm || "¡Contraseña actualizada exitosamente!");
    toggleChangePasswordModal();
  };

  // --- Renderizado ---
  if (isLoading && !user && !error) {
    return (
      <div style={styles.pageContainer}><div style={styles.contentWrapper}><p style={{ textAlign: 'center', padding: '2rem' }}>Cargando perfil...</p></div></div>
    );
  }

  if (error && !user) { // Error durante la carga inicial
    return (
      <div style={styles.pageContainer}><div style={styles.contentWrapper}><div style={styles.globalErrorMessage}>{error}</div></div></div>
    );
  }

  if (!user && !isLoading) { // No se pudo cargar el usuario, pero no hay 'loading'
       return (
           <div style={styles.pageContainer}><div style={styles.contentWrapper}><p style={{textAlign: 'center'}}>No se pudieron cargar los datos del usuario.</p></div></div>
       );
   }

  if (!user) return null; // No debería llegar aquí si los casos anteriores están bien

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {successMessage && <div style={styles.globalSuccessMessage}>{successMessage}</div>}
        {/* Si el error de carga inicial persiste y no se limpia, podría mostrarse aquí también.
            Considera si necesitas un error global específico vs. errores en modales.
            {error && !isEditProfileModalOpen && !isChangePasswordModalOpen && <div style={styles.globalErrorMessage}>{error}</div>}
        */}

        <PersonalProfile
          user={user}
          onEditProfile={toggleEditProfileModal}
          onChangePassword={toggleChangePasswordModal}
          isLoading={isLoading}
        />

        <Modal 
          isOpen={isEditProfileModalOpen} 
          toggle={toggleEditProfileModal} 
          centered 
          size="lg" 
          backdrop="static"
          fade={true} // `fade` para el Modal en sí mismo
          timeout={300} // `timeout` para la transición del Modal
        >
          <ModalHeader toggle={toggleEditProfileModal}>Editar Perfil</ModalHeader>
          <ModalBody>
            {/* CORREGIDO: Alert con fade={false} para evitar el warning de timeout */}
            {error && <Alert color="danger" className="mb-3" fade={false}>{error}</Alert>}
            <ProfileEditForm
              initialUserData={user}
              onSave={handleUpdateUser}
              onCancel={() => {
                setError(null); // Limpiar error al cancelar desde el form
                toggleEditProfileModal();
              }}
              isLoading={isLoading} // Para deshabilitar el form mientras se guarda
            />
          </ModalBody>
        </Modal>

        <Modal 
          isOpen={isChangePasswordModalOpen} 
          toggle={toggleChangePasswordModal} 
          centered 
          backdrop="static"
          fade={true}
          timeout={300}
        >
          <ModalHeader toggle={toggleChangePasswordModal}>Cambiar Contraseña</ModalHeader>
          <ModalBody>
            <PasswordChangeForm
              onPasswordChanged={handlePasswordChanged}
              onCancel={() => {
                // PasswordChangeForm maneja sus propios errores internos.
                // No es necesario limpiar 'error' de Perfil aquí a menos que se establezca globalmente.
                toggleChangePasswordModal();
              }}
            />
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};

export default Perfil;