// src/components/Usuarios/ViewUserModal.jsx
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge } from 'reactstrap';

const formatDateWithTime = (dateString) => {
    if (!dateString) return <span className="text-muted fst-italic small">N/A</span>;
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return <span className="text-danger small">Fecha inválida</span>;
    }
};

const ViewUserModal = ({ isOpen, toggle, user }) => {
  if (!isOpen || !user) return null;

  const titleAccentColor = "#FDC830";
  const labelColor = "#495057";
  const valueColor = "#212529";
  const roleBadgeBackgroundColor = "#D0F0C0"; // Define your desired color here

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="lg"
      backdrop="static"
      contentClassName="border-0 shadow-lg" // Sombra y sin borde
      modalClassName="modal-view-user" // Para posibles ajustes mínimos si los necesitas
    >
      <ModalHeader
        toggle={toggle} // Esto mostrará la X por defecto y la conectará a toggle
        className="border-bottom-0 pb-3 pt-4 px-4"
        tag="h5" // Para que el título principal use h5
        style={{ alignItems: 'center' }} // Para mejor alineación vertical si el título es largo
      >
        <span style={{ color: titleAccentColor, fontWeight: '600', fontSize: '1.1rem' }}>
          Detalles del Usuario
        </span>
      </ModalHeader>
      <ModalBody className="py-4 px-4">
        {/* Sección Información Personal */}
        <div className="mb-4">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Información Personal</h6>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Usuario:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-normal">{user.id || user._id || <span className="fst-italic">N/A</span>}</Col>
            </Row>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Nombre Completo:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-bold">{user.nombreCompleto || <span className="fst-italic">N/A</span>}</Col>
            </Row>
             <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Username:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-bold">{user.username || <span className="fst-italic">N/A</span>}</Col>
            </Row>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Documento:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-normal">{user.documento || <span className="fst-italic">N/A</span>}</Col>
            </Row>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Correo Electrónico:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-normal">{user.email || <span className="fst-italic">N/A</span>}</Col>
            </Row>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Celular:</Col>
                <Col sm="8" style={{ color: valueColor }} className="fw-normal">{user.celular || <span className="fst-italic">N/A</span>}</Col>
            </Row>
          <Row className="mb-2">
              <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Rol:</Col>
              <Col sm="8">
                  {user.role?.name ? (
                      <span
                          className="fw-medium"
                          style={{
                              backgroundColor: '#D0F0C0',
                              color: '#000000',
                              fontSize: '0.85rem',
                              padding: '4px 12px',
                              borderRadius: '999px', // borde completamente redondeado
                              border: '1px solid #D0F0C0',
                              display: 'inline-block'
                          }}
                      >
                          {user.role.name}
                      </span>
                  ) : (
                      <span className="fst-italic" style={{ color: valueColor }}>N/A</span>
                  )}
              </Col>
          </Row>
        </div>

        {/* Sección Registros */}
        {(user.createdAt || user.updatedAt) && (
            <div className="mt-4 pt-3 border-top">
                 <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Registros</h6>
                {user.createdAt && (
                    <Row className="mb-2">
                        <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Fecha de Creación:</Col>
                        <Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(user.createdAt)}</Col>
                    </Row>
                )}
                {user.updatedAt && (
                    <Row className="mb-2">
                        <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Última Actualización:</Col>
                        <Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(user.updatedAt)}</Col>
                    </Row>
                )}
            </div>
        )}
      </ModalBody>
      {/* <ModalFooter className="border-top-0 pt-3 pb-4 px-4 bg-light">
        <Button
            onClick={toggle}
            block // Usa "w-100" para Bootstrap 5 si "block" no funciona
            className="py-2" // Un poco más de padding vertical
            style={{
                backgroundColor: titleAccentColor,
                color: '#212529',
                borderColor: titleAccentColor,
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '0.9rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
            Cerrar
        </Button>
      </ModalFooter> */}
    </Modal>
  );
};

export default ViewUserModal;