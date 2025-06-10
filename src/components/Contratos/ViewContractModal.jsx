// src/components/Contracts/ViewContractModal.jsx
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge, ListGroup, ListGroupItem, Spinner, Alert } from 'reactstrap';

const formatDate = (dateString) => { if (!dateString) return <span className="text-muted fst-italic small">N/A</span>; try { const d=new Date(dateString); if(isNaN(d.getTime())) {const p=dateString.split(/[-/T]/); if(p.length>=3){const y=parseInt(p[0]),m=parseInt(p[1])-1,dd=parseInt(p[2]),uD=new Date(Date.UTC(y,m,dd)); if(!isNaN(uD.getTime()))return uD.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})} return <span className="text-danger small">Inválida</span>} return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})} catch(e){return <span className="text-danger small">Error</span>}};
const formatCurrency = (v) => {const n=parseFloat(v); if(isNaN(n))return <span className="text-muted fst-italic small">N/A</span>; return n.toLocaleString('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0})};
const formatDateWithTime = (dS) => {if(!dS)return <span className="text-muted fst-italic small">N/A</span>; try{return new Date(dS).toLocaleString('es-ES',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return <span className="text-danger small">Inválida</span>}};

const ViewContractModal = ({ isOpen, toggle, contract, isLoadingDetails = false }) => {
    const titleAccentColor = "#FDC830"; 
    const labelColor = "#495057";
    const valueColor = "#212529";

    if (!isOpen) return null;

    if (isLoadingDetails) {
        return (
             <Modal isOpen={isOpen} centered size="md" contentClassName="border-0 shadow-lg">
                <ModalBody className="text-center p-5">
                    <Spinner style={{width: '3rem', height: '3rem', color: titleAccentColor}} />
                    <p className="mt-3 text-muted fw-medium">Cargando detalles...</p>
                </ModalBody>
             </Modal>
        );
    }
     if (!contract) {
         return (
            <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" contentClassName="border-0 shadow-lg" modalClassName="modal-view-contract-error">
                <ModalHeader toggle={toggle} className="border-bottom-0 pb-3 pt-4 px-4" tag="h5" style={{ alignItems: 'center' }}>
                    <span style={{ color: titleAccentColor, fontWeight: '600', fontSize: '1.1rem' }}>
                        Error de Datos
                    </span>
                </ModalHeader>
                <ModalBody className="py-4 px-4">
                    <Alert color="danger" className="text-center fw-medium">No se proporcionaron datos del contrato.</Alert>
                </ModalBody>
                <ModalFooter className="border-top-0 pt-3 pb-4 px-4 bg-light">
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
                </ModalFooter>
            </Modal>
         );
     }

    const estado = contract.estado || 'desconocido';
    const isActive = estado.toLowerCase() === 'activo';

    const clientData = contract.client;
    const specimenData = contract.contractSpecimens?.[0];
    const services = Array.isArray(contract.servicios) ? contract.servicios : [];

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" contentClassName="border-0 shadow-lg" modalClassName="modal-view-contract">
            <ModalHeader toggle={toggle} className="border-bottom-0 pb-3 pt-4 px-4" tag="h5" style={{ alignItems: 'center' }}>
                <span style={{ color: titleAccentColor, fontWeight: '600', fontSize: '1.1rem' }}>
                  Detalles del Contrato
                </span>
            </ModalHeader>
            <ModalBody className="py-4 px-4">
                {/* Información General */}
                <div className="mb-4">
                    <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Información General</h6>
                    <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">ID Contrato:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{contract.id || contract._id || <span className="fst-italic">N/A</span>}</Col></Row>
                    <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Fecha Inicio:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{formatDate(contract.fechaInicio)}</Col></Row>
                    <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Precio Mensual:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{formatCurrency(contract.precioMensual)}</Col></Row>
                    <Row className="mb-2">
                        <Col sm="4" style={{ color: labelColor }} className="fw-medium small">Estado:</Col>
                        <Col sm="8">
                        <Badge 
                            color={isActive ? "success" : (estado.toLowerCase() === 'finalizado' ? 'dark' : 'warning')} 
                            pill 
                            className="px-3 py-1 fw-medium"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </Badge>
                        </Col>
                    </Row>
                </div>

                {/* Cliente */}
                <div className="mb-4 pt-3 border-top">
                    <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Cliente</h6>
                    {clientData ? (
                        <>
                        <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Nombre:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{clientData.nombre || <span className="fst-italic">N/A</span>}</Col></Row>
                        <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Documento:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.documento || <span className="fst-italic">N/A</span>}</Col></Row>
                        <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Correo:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.email || clientData.correo || <span className="fst-italic">N/A</span>}</Col></Row>
                        <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Celular:</Col><Col sm="8" style={{ color: valueColor }} className="fw-normal">{clientData.celular || <span className="fst-italic">N/A</span>}</Col></Row>
                        </>
                    ) : <Alert color="light" className="text-center fst-italic py-2 border small">Sin información del cliente.</Alert>}
                </div>
                
                {/* Ejemplar Asociado */}
                <div className="mb-4 pt-3 border-top">
                    <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Ejemplar Asociado</h6>
                    {specimenData ? (
                        <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Nombre Ejemplar:</Col><Col sm="8" style={{ color: valueColor }} className="fw-bold">{specimenData.name || <span className="fst-italic">N/A</span>}</Col></Row>
                    ) : <Alert color="light" className="text-center fst-italic py-2 border small">Sin ejemplar asociado.</Alert>}
                </div>

                {/* Servicios Incluidos */}
                <div className="mb-4 pt-3 border-top">
                    <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Servicios Incluidos</h6>
                    {services.length > 0 ? (
                    <ListGroup flush className="border-0">
                        {services.map((service) => (
                            <ListGroupItem key={service.id || service._id} className="px-0 py-2 d-flex justify-content-between align-items-center border-bottom bg-transparent">
                                <span className="small" style={{ color: valueColor }}>{service.nombre || 'Servicio sin nombre'}</span>
                                {service.precio !== undefined && (
                                    <Badge color="light" text="dark" pill className="px-2 py-1 small fw-normal">
                                        {formatCurrency(service.precio)}
                                    </Badge>
                                )}
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                    ) : (
                    <Alert color="light" className="text-center fst-italic py-2 border small">No hay servicios asociados.</Alert>
                    )}
                </div>
                
                {/* Registros del Contrato */}
                {(contract.createdAt || contract.updatedAt) && (
                    <div className="mt-4 pt-3 border-top">
                        <h6 className="text-muted text-uppercase small fw-bold mb-3 pb-1 border-bottom">Registros del Contrato</h6>
                        {contract.createdAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Creado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(contract.createdAt)}</Col></Row>}
                        {contract.updatedAt && <Row className="mb-2"><Col sm="4" style={{ color: labelColor }} className="fw-medium small">Actualizado:</Col><Col sm="8" className="small" style={{ color: valueColor, opacity: 0.8 }}>{formatDateWithTime(contract.updatedAt)}</Col></Row>}
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

export default ViewContractModal;