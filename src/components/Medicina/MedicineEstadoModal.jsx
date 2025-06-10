// src/components/Medicina/MedicineEstadoModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Form, FormGroup, Label, Input, Button, Spinner, Alert,
    Row, Col
} from 'reactstrap';

const MedicineEstadoModal = ({
    isOpen,
    toggle,
    medicineRecord, // El registro de medicina cuyo estado se va a cambiar
    onEstadoSubmit, // Función para llamar al guardar el nuevo estado
    isSaving,       // Booleano para el spinner del botón guardar
    apiError        // Para mostrar errores de API dentro del modal
}) => {
    const [selectedEstado, setSelectedEstado] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (medicineRecord) {
            setSelectedEstado(medicineRecord.estado || 'Programado'); // Default al estado actual o 'Programado'
        }
        setLocalError(''); // Limpiar error local al abrir/cambiar
    }, [medicineRecord, isOpen]);

    const handleEstadoChange = (e) => {
        setSelectedEstado(e.target.value);
        if (localError) setLocalError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedEstado) {
            setLocalError("Debe seleccionar un estado.");
            return;
        }
        if (isSaving || selectedEstado === medicineRecord.estado) {
            if (selectedEstado === medicineRecord.estado) {
                setLocalError("El nuevo estado es igual al actual. No se realizaron cambios.");
            }
            return;
        }
        onEstadoSubmit(medicineRecord.id, selectedEstado); // Usar el ID correcto del registro
    };

    if (!medicineRecord) return null;

    const formIdPrefix = `estado-med-${medicineRecord.id}`;

    return (
        <Modal isOpen={isOpen} toggle={!isSaving ? toggle : undefined} centered backdrop="static">
            <ModalHeader toggle={!isSaving ? toggle : undefined}>
                Cambiar Estado de Medicina
            </ModalHeader>
            <ModalBody>
                <div className="border p-3 rounded"> 
                    <Form onSubmit={handleSubmit} className="mt-3">
                        {apiError && <Alert color="danger" className="mb-3">{apiError}</Alert>}
                        {localError && <Alert color="warning" className="mb-3" toggle={() => setLocalError('')}>{localError}</Alert>}

                        <p className="mb-2 small text-muted">Editando estado para el registro:</p>
                        
                        <Row className="mb-2">
                            <Col md={12}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-nombreMedicina`} className="fw-bold small mb-1">Medicina</Label>
                                    <Input
                                        bsSize="sm" type="text" id={`${formIdPrefix}-nombreMedicina`}
                                        value={medicineRecord.nombre || '-'}
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
                                        value={medicineRecord.specimen?.name || `ID: ${medicineRecord.specimenId}` || '-'}
                                        readOnly style={{ backgroundColor: '#e9ecef', opacity: 1 }}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-dosis`} className="fw-bold small mb-1">Dosis</Label>
                                    <Input
                                        bsSize="sm" type="text" id={`${formIdPrefix}-dosis`}
                                        value={medicineRecord.dosis ?? '-'}
                                        readOnly style={{ backgroundColor: '#e9ecef', opacity: 1 }}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        <hr className="my-3" />

                        <Row className="mb-3">
                            <Col md={12}>
                                <FormGroup>
                                    <Label for={`${formIdPrefix}-estadoMedicinaModal`} className="fw-bold">Nuevo Estado <span className="text-danger">*</span></Label>
                                    <Input
                                        id={`${formIdPrefix}-estadoMedicinaModal`}
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
                                    {localError.includes("estado") && <FormFeedback>{localError}</FormFeedback>}
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        {/* Botones dentro del Form, no en ModalFooter separado */}
                        <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                            <Button color="danger" onClick={toggle} disabled={isSaving} size="sm">
                                Cancelar
                            </Button>
                            <Button 
                                color="success" 
                                type="submit"
                                disabled={isSaving || !selectedEstado || selectedEstado === medicineRecord.estado} 
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

export default MedicineEstadoModal;