// src/pages/ControlEjemplarPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, CardHeader, CardBody, Spinner, Alert } from 'reactstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Import faStethoscope for the module title, and other icons
import { 
  faAppleAlt, 
  faClinicMedical, 
  faSyringe, 
  faStethoscope // Changed to faStethoscope
} from "@fortawesome/free-solid-svg-icons"; 
import SpecimenSelector from '../components/Specimens/SpecimenSelector';
import AlimentacionTable from '../components/Alimentacion/AlimentacionTable';
import MedicineTable from '../components/Medicina/MedicineTable';
import VacunacionTable from '../components/Vacunacion/VacunacionTable';

import { getAlimentacionBySpecimenId } from '../api/alimentacionApi';
import { getMedicineBySpecimenId } from '../api/medicineApi';
import { getVacunacionBySpecimenId } from '../api/vacunacionApi';

const ControlEjemplarPage = () => {
  const [selectedSpecimen, setSelectedSpecimen] = useState(null);
  const [alimentacionData, setAlimentacionData] = useState([]);
  const [medicineData, setMedicineData] = useState([]);
  const [vacunacionData, setVacunacionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpecimenSelect = useCallback(async (specimen) => {
    if (!specimen || !specimen.id) {
      setSelectedSpecimen(null);
      setAlimentacionData([]);
      setMedicineData([]);
      setVacunacionData([]);
      setError('');
      return;
    }

    setSelectedSpecimen(specimen);
    setLoading(true);
    setError('');
    setAlimentacionData([]);
    setMedicineData([]);
    setVacunacionData([]);

    try {
      const [alimentacionRes, medicineRes, vacunacionRes] = await Promise.all([
        getAlimentacionBySpecimenId(specimen.id),
        getMedicineBySpecimenId(specimen.id),
        getVacunacionBySpecimenId(specimen.id)
      ]);

      setAlimentacionData(alimentacionRes || []);
      setMedicineData(medicineRes || []);
      setVacunacionData(vacunacionRes || []);

    } catch (err) {
      console.error("Error fetching data for specimen:", err);
      const errorMsg = err?.message || 'Error al cargar datos del ejemplar.';
      setError(errorMsg);
      setAlimentacionData([]);  
      setMedicineData([]);
      setVacunacionData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Container fluid className="mt-4">
      {/* START: New Dashboard-like Header for Control por Ejemplar */}
        <Row className="mb-2"> {/* Row for Title and Icon */}
            <Col className="text-center">
                <h2 
                    className="mb-0 d-inline-flex align-items-center" style={{ fontWeight: 500, fontSize: '1.75rem', color: '#343a40' }}>
                    <FontAwesomeIcon icon={faStethoscope} size="lg" className="me-3" style={{ color: '#80B0AA' }} />
                    Control por Ejemplar
                </h2>
            </Col>
        </Row>

        <Row className="mb-4"> {/* Row for the underline */}
            <Col>
                <hr className="mt-0" style={{ borderTop: '1px solid #ced4da', opacity: 0}}/>
            </Col>
        </Row>
      {/* END: New Dashboard-like Header */}

      <SpecimenSelector onSpecimenSelect={handleSpecimenSelect} />

      {error && <Alert color="danger" className="mt-3">{error}</Alert>}

      {selectedSpecimen && (
        <div className="mt-4">
          <h4 className="mb-3">
            Historial de: <strong>{selectedSpecimen.name}</strong> 
            {/* (ID: {selectedSpecimen.id}) */}
          </h4>

          {loading ? (
            <div className="text-center p-5"><Spinner>Cargando historial...</Spinner></div>
          ) : (
            <Row>
              {/* Alimentación */}
              <Col lg={4} md={6} sm={12} className="mb-3">
                <Card className="h-100">
                   <CardHeader className="bg-success text-white">
                    <FontAwesomeIcon icon={faAppleAlt} className="me-2"/>Alimentación
                  </CardHeader>
                  <CardBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {alimentacionData.length > 0 ? (
                      <AlimentacionTable data={alimentacionData} />
                    ) : (
                      <p className="text-muted fst-italic mt-2">No hay registros.</p>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Medicinas */}
              <Col lg={4} md={6} sm={12} className="mb-3">
                <Card className="h-100">
                  <CardHeader className="bg-info text-white">
                     <FontAwesomeIcon icon={faClinicMedical} className="me-2"/>Medicinas
                  </CardHeader>
                  <CardBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
                     {medicineData.length > 0 ? (
                       <MedicineTable data={medicineData} />
                     ) : (
                       <p className="text-muted fst-italic mt-2">No hay registros.</p>
                     )}
                  </CardBody>
                </Card>
              </Col>

              {/* Vacunación */}
              <Col lg={4} md={12} sm={12} className="mb-3">
                <Card className="h-100">
                  <CardHeader className="bg-warning text-dark">
                     <FontAwesomeIcon icon={faSyringe} className="me-2"/>Vacunación
                  </CardHeader>
                  <CardBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
                     {vacunacionData.length > 0 ? (
                        <VacunacionTable data={vacunacionData} />
                     ) : (
                        <p className="text-muted fst-italic mt-2">No hay registros.</p>
                     )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )}
    </Container>
  );
};

export default ControlEjemplarPage;