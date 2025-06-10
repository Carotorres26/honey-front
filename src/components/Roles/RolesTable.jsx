import React from "react";
import { Table, Button, ButtonGroup, Badge } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faEye, faToggleOn, faToggleOff, faSpinner } from "@fortawesome/free-solid-svg-icons";

const RolesTable = ({ roles, onEdit, onDelete, onView, onToggleStatus, loadingStatusStates = {} }) => {

  if (!roles || roles.length === 0) {
      return null;
  }

  return (
    <Table className="table table-bordered table-hover align-middle" responsive>
      <thead className="table-dark">
        <tr>
          <th>ID</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => {
          const roleId = role.id || role._id;
          const isActive = role.status;
          const isLoading = loadingStatusStates[roleId];

          return (
            <tr key={roleId} className={!isActive ? 'table-secondary text-muted' : ''}>
              <td>{roleId}</td>
              <td>{role.name}</td>
              <td>
                <Badge color={isActive ? "success" : "danger"} pill>
                  {isActive ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td>
                <ButtonGroup size="sm">
                  <Button outline color="info" onClick={() => onView(role)} title="Ver Permisos" style={{ border:'none', padding: '0.25rem 0.5rem' }}
                      className="me-1" disabled={isLoading}>
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                  <Button
                    color={isActive ? "success" : "danger"}
                    onClick={() => onToggleStatus(roleId, !isActive)}
                    title={isActive ? "Desactivar Rol" : "Activar Rol"}
                    className="me-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={isActive ? faToggleOff : faToggleOn} />
                    )}
                  </Button>

                  <Button color="dark" onClick={() => onEdit(role)} title="Editar" className="me-1" disabled={isLoading}>
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                 
                  <Button color="danger" onClick={() => onDelete(roleId)} title="Eliminar" disabled={isLoading}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default RolesTable;