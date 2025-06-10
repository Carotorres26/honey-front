// src/components/Pagos/ViewPagoModal.jsx
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge, Alert } from 'reactstrap';

const formatDate = (dateString) => { if (!dateString) return <span className="text-muted fst-italic small">N/A</span>; try { const d=new Date(dateString); if(isNaN(d.getTime())) {const p=dateString.split(/[-/T]/); if(p.length>=3){const y=parseInt(p[0]),m=parseInt(p[1])-1,dd=parseInt(p[2]),uD=new Date(Date.UTC(y,m,dd)); if(!isNaN(uD.getTime()))return uD.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})} return <span className="text-danger small">Inválida</span>} return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})} catch(e){return <span className="text-danger small">Error</span>}};
const formatCurrency = (v) => {const n=parseFloat(v); if(isNaN(n))return <span className="text-muted fst-italic small">N/A</span>; return n.toLocaleString('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0})};
const formatDateWithTime = (dS) => {if(!dS)return <span className="text-muted fst-italic small">N/A</span>; try{return new Date(dS).toLocaleString('es-ES',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return <span className="text-danger small">Inválida</span>}};

const ViewPagoModal = ({ isOpen, toggle, pago }) => {
  if (!isOpen || !pago) return null;

  const titleAccentColor = "#FDC830"; 
  const labelColor = "#495057";
  const valueColor = "#212529";

  const contract = pago.contract;
  const client = contract?.client;
  const specimen = contract?.contractSpecimens?.[0];

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" contentClassName="border-0 shadow-lg" modalClassName="modal-view-pago">
      <ModalHeader toggle={toggle} className="border-bottom-0 pb-3 pt-4 px-4" tag="h5" style={{ alignItems: 'center' }}>
        <span style={{ color: titleAccentColor, fontWeight: '600', fontSize: '1.1rem' }}>
          Detalles del Pago
        </span>
      </ModalHeader>
      <ModalBody className="py-4 px-4">
        {/* Información del Pago */}
        <div className="mb-4">
            <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Información del Pago</h6>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Pago:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{pago.id_pago || pago.id || <span className="fst-italic">N/A</span>}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Fecha de Pago:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{formatDate(pago.fechaPago)}</Col></Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Valor Pagado:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold text-success">{formatCurrency(pago.valor)}</Col></Row>
            <Row className="mb-2">
                <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Método:</Col>
                <Col sm="8">
                <Badge 
                    color={pago.metodoPago?.toLowerCase() === 'efectivo' ? 'success' : (pago.metodoPago?.toLowerCase() === 'transferencia' ? 'info' : 'secondary')} 
                    pill 
                    className="px-3 py-1 fw-medium"
                    style={{ fontSize: '0.8rem' }}
                >
                    {pago.metodoPago ? pago.metodoPago.charAt(0).toUpperCase() + pago.metodoPago.slice(1) : <span className="fst-italic">N/A</span>}
                </Badge>
                </Col>
            </Row>
            <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Mes Cubierto:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{pago.mesPago || <span className="fst-italic">N/A</span>}</Col></Row>
        </div>

        {/* Contrato Vinculado */}
        {contract && (
            <div className="mb-4 pt-3 border-top">
                <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Contrato Vinculado</h6>
                <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Contrato:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{contract.id || <span className="fst-italic">N/A</span>}</Col></Row>
                {client && (
                  <>
                    <Row className="mb-2">
                        <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Cliente:</Col>
                        <Col sm="8" style={{ color: valueColor }} className="fw-normal">
                            {client.nombre || <span className="fst-italic">N/A</span>}
                        </Col>
                    </Row>
                    <Row className="mb-2">
                        <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Documento:</Col>
                        <Col sm="8" style={{ color: valueColor }} className="fw-normal">
                            {client.documento || <span className="fst-italic">N/A</span>}
                        </Col>
                    </Row>
                  </>
                )}
                {specimen && (
                <Row className="mb-2">
                    <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Ejemplar:</Col>
                    <Col sm="8" style={{ color: valueColor }} className="fw-normal">{specimen.name || <span className="fst-italic">N/A</span>} </Col>
                </Row>
                )}
            </div>
        )}
        {!contract && (
             <Alert color="light" className="text-center fst-italic py-2 border small mt-3">Pago sin contrato directamente asociado.</Alert>
        )}
        
        {/* Registros del Pago */}
        {(pago.createdAt || pago.updatedAt) && (
            <div className="mt-4 pt-3 border-top">
                <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Registros del Pago</h6>
                {pago.createdAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Creado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(pago.createdAt)}</Col></Row>}
                {pago.updatedAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Actualizado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(pago.updatedAt)}</Col></Row>}
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

export default ViewPagoModal;