// src/components/Specimens/ViewSpecimenModal.jsx
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge, Alert } from 'reactstrap';

const formatDate = (dateString) => { if (!dateString) return <span className="text-muted fst-italic small">N/A</span>; try { const d=new Date(dateString); if(isNaN(d.getTime())) {const p=dateString.split(/[-/T]/); if(p.length>=3){const y=parseInt(p[0]),m=parseInt(p[1])-1,dd=parseInt(p[2]),uD=new Date(Date.UTC(y,m,dd)); if(!isNaN(uD.getTime()))return uD.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})} return <span className="text-danger small">Inválida</span>} return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})} catch(e){return <span className="text-danger small">Error</span>}};
const formatCurrency = (v) => {const n=parseFloat(v); if(isNaN(n))return <span className="text-muted fst-italic small">N/A</span>; return n.toLocaleString('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0})};
const formatDateWithTime = (dS) => {if(!dS)return <span className="text-muted fst-italic small">N/A</span>; try{return new Date(dS).toLocaleString('es-ES',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return <span className="text-danger small">Inválida</span>}};

const ViewSpecimenModal = ({ isOpen, toggle, specimen }) => {
  if (!isOpen || !specimen) return null;

  const titleAccentColor = "#FDC830"; 
  const labelColor = "#495057";
  const valueColor = "#212529";

  const categoryName = specimen.category?.name || <span className="fst-italic">N/A</span>;
  const sedeName = specimen.sede?.NombreSede || <span className="fst-italic">N/A</span>;
  const clientData = specimen.propietario;
  const contractData = specimen.contract;

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" contentClassName="border-0 shadow-lg" modalClassName="modal-view-specimen">
      <ModalHeader toggle={toggle} className="border-bottom-0 pb-3 pt-4 px-4" tag="h5" style={{ alignItems: 'center' }}>
        <span style={{ color: titleAccentColor, fontWeight: '600', fontSize: '1.1rem' }}>
          Detalles del Ejemplar
        </span>
      </ModalHeader>
      <ModalBody className="py-4 px-4">
        {/* Información Básica */}
        <div className="mb-4">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Información Básica</h6>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Ejemplar:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{specimen.id || specimen._id || <span className="fst-italic">N/A</span>}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Nombre:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{specimen.name || <span className="fst-italic">N/A</span>}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Raza:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{specimen.breed || <span className="fst-italic">N/A</span>}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Color:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{specimen.color || <span className="fst-italic">N/A</span>}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Fecha Nacimiento:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{formatDate(specimen.birthDate)}</Col></Row>
        </div>
        
        {/* Clasificación y Ubicación */}
        <div className="mb-4 pt-3 border-top">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Clasificación y Ubicación</h6>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Categoría:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{categoryName}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Sede Actual:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{sedeName}</Col></Row>
        </div>

        {/* Propietario */}
        <div className="mb-4 pt-3 border-top">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Propietario</h6>
            {clientData ? (
            <>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Nombre:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{clientData.nombre || <span className="fst-italic">N/A</span>}</Col></Row>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Documento:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.documento || <span className="fst-italic">N/A</span>}</Col></Row>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Email:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.email || <span className="fst-italic">N/A</span>}</Col></Row>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Celular:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.celular || <span className="fst-italic">N/A</span>}</Col></Row>
            </>
            ) : (
            <Alert color="light" className="text-center fst-italic py-2 border small">Sin propietario asignado.</Alert>
            )}
        </div>
        
        {/* Contrato Vinculado */}
        <div className="mb-4 pt-3 border-top">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Contrato Vinculado</h6>
            {contractData ? (
            <>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Contrato:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{contractData.id || <span className="fst-italic">N/A</span>}</Col></Row>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Inicio:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{formatDate(contractData.fechaInicio)}</Col></Row>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Precio:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{formatCurrency(contractData.precioMensual)}</Col></Row>
                {contractData.hasOwnProperty('estado') && (
                <Row className="mb-2">
                    <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Estado:</Col>
                    <Col sm="8">
                    <Badge 
                        color={contractData.estado?.toLowerCase() === 'activo' ? 'success' : (contractData.estado?.toLowerCase() === 'finalizado' ? 'dark' : 'warning')} 
                        pill 
                        className="px-3 py-1 fw-medium"
                        style={{ fontSize: '0.8rem' }}
                    >
                        {contractData.estado ? contractData.estado.charAt(0).toUpperCase() + contractData.estado.slice(1) : <span className="fst-italic">N/A</span>}
                    </Badge>
                    </Col>
                </Row>
                )}
            </>
            ) : (
            <Alert color="light" className="text-center fst-italic py-2 border small">Ejemplar sin contrato asociado.</Alert>
            )}
        </div>

        {/* Registros del Ejemplar */}
        {(specimen.createdAt || specimen.updatedAt) && (
            <div className="mt-4 pt-3 border-top">
                <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Registros del Ejemplar</h6>
                {specimen.createdAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Creado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(specimen.createdAt)}</Col></Row>}
                {specimen.updatedAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Actualizado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(specimen.updatedAt)}</Col></Row>}
            </div>
        )}
      </ModalBody>
      {/* <ModalFooter className="border-top-0 pt-3 pb-4 px-4 bg-light">
        <Button 
            onClick={toggle} 
            block
            className="py-2"
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

export default ViewSpecimenModal;