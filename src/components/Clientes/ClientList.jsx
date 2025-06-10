// src/components/ClientList.jsx
import React from 'react';
import { Table, Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const ClientList = ({ clients, onEdit, onDelete }) => {
  if (!clients || clients.length === 0) {
    return <p className="text-center mt-3">No hay clientes para mostrar.</p>;
  }

  return (
    <Table className="table table-bordered table-hover mt-3" responsive striped>
      <thead className="table-dark">
        {/* Asegurar que no haya espacios/saltos de línea entre <tr> y el primer <th>,
            ni entre el último <th> y </tr> */}
        <tr><th>Nombre</th><th>Documento</th><th>Correo</th><th>Celular</th><th>Ejemplares</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client.nombre}</td>
            <td>{client.documento}</td>
            <td>{client.email}</td>
            <td>{client.celular || '-'}</td>
            <td>{client.ejemplares ?? 0}</td>
            <td>
              <ButtonGroup size="sm">
                <Button
                  color="dark"
                  onClick={() => onEdit(client)}
                  title="Editar Cliente"
                  className="me-1"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                  color="danger"
                  onClick={() => onDelete(client.id)}
                  title="Eliminar Cliente"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </ButtonGroup>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ClientList;