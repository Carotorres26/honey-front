// src/components/Alimentacion/AlimentacionEstadoModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Form, FormGroup, Label, Input, Button, Spinner, Alert,
    Row, Col, FormFeedback // Añadido FormFeedback
} from 'reactstrap';

const AlimentacionEstadoModal = ({
    isOpen,
    toggle,
    alimentacionRecord,
    onEstadoSubmit,
    isSaving,
    apiError
}) => {
    const [selectedEstado, setSelectedEstado] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (alimentacionRecord) {
            setSelectedEstado(alimentacionRecord.estado || 'Programado');
        }
        setLocalError('');
    }, [alimentacionRecord, isOpen]);

    const handleEstadoChange = (e) => {
        setSelectedEstado(e.target.value);
        if (localError) setLocalError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedEstado) {
            setLocalError("Debe seleccionar un nuevo estado.");
            return;
        }
        if (isSaving || selectedEstado === alimentacionRecord.estado) {
            if (selectedEstado === alimentacionRecord.estado) {
                setLocalError("El nuevo estado es igual al actual. No se realizaron cambios.");
            }
            return;
        }
        onEstadoSubmit(alimentacionRecord.id, selectedEstado);
    };

    if (!alimentacionRecord) return null;

    const formIdPrefix = `estado-alim-${alimentacionRecord.id}`;

    return (
        <Modal isOpen={isOpen} toggle={!isSaving ? toggle : undefined} centered backdrop="static">
            <ModalHeader toggle={!isSaving ? toggle : undefined}>
                Cambiar Estado de Alimentación
            </ModalHeader>
            <ModalBody>
                {/* Contenedor con borde y padding como en CategoryForm */}
                <div className="border p-3 rounded"> 
                    <Form onSubmit={handleSubmit} className="mt-3">
                        {apiError && <Alert color="danger" className="mb-3">{apiError}</Alert>}
                        {localError && <Alert color="warning" className="mb-3" toggle={() => setLocalError('')}>{localError}</Alert>}

                        <p className="mb-2 small text-muted">Editando estado para el registro:</p>
                        
                        {/* Información del registro - Siguiendo estructura de CategoryForm */}
                        <Row className="mb-2"> {/* Menor margen para info */}
                            <Col md={12}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-nombreAlimento`} className="fw-bold small mb-1">Alimento</Label>
                                    <Input
                                        bsSize="sm" type="text" id={`${formIdPrefix}-nombreAlimento`}
                                        value={alimentacionRecord.nombreAlimento || '-'}
                                        readOnly style={{ backgroundColor: '#e9ecef', opacity: 1 }}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-2">
                             <Col md={8}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-especimen`} className="fw-bold small mb-1">Espécimen</Label>
                                    <Input
                                        bsSize="sm" type="text" id={`${formIdPrefix}-especimen`}
                                        value={alimentacionRecord.specimen?.name || `ID: ${alimentacionRecord.specimenId}` || '-'}
                                        readOnly style={{ backgroundColor: '#e9ecef', opacity: 1 }}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-cantidad`} className="fw-bold small mb-1">Cantidad</Label>
                                    <Input
                                        bsSize="sm" type="text" id={`${formIdPrefix}-cantidad`}
                                        value={alimentacionRecord.cantidad ?? '-'}
                                        readOnly style={{ backgroundColor: '#e9ecef', opacity: 1 }}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        <hr className="my-3" /> {/* Separador antes del campo editable */}

                        <Row className="mb-3"> {/* Campo editable */}
                            <Col md={12}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-estadoAlimentacionModal`} className="fw-bold">Nuevo Estado <span className="text-danger">*</span></Label>
                                    <Input
                                        id={`${formIdPrefix}-estadoAlimentacionModal`}
                                        type="select" name="estado"
                                        value={selectedEstado}
                                        onChange={handleEstadoChange}
                                        disabled={isSaving} bsSize="sm"
                                        invalid={!!localError.includes("estado")} 
                                    >
                                        <option value="Programado">Programado</option>
                                        <option value="Administrado">Administrado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </Input>
                                    {/* Usar FormFeedback para el error del select si se prefiere */}
                                    {localError.includes("estado") && <FormFeedback>{localError}</FormFeedback>}
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        {/* Botones con el mismo div wrapper que CategoryForm */}
                        {/* Este div ahora estará DENTRO de ModalBody, pero el ModalFooter original se quita */}
                        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                            <Button color="danger" onClick={toggle} disabled={isSaving} size="sm">
                                Cancelar
                            </Button>
                            <Button 
                                color="success" 
                                type="submit" // submit para que el Form lo maneje
                                disabled={isSaving || !selectedEstado || selectedEstado === alimentacionRecord.estado} 
                                size="sm"
                            >
                                {isSaving ? <Spinner size="sm" /> : 'Guardar Estado'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default AlimentacionEstadoModal;