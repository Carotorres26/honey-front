import React from "react";
import { Table, Button, ButtonGroup, Badge } from "reactstrap"; // Import Badge
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faEye, faToggleOn, faToggleOff, faSpinner } from "@fortawesome/free-solid-svg-icons"; // Add toggle icons

// Add onToggleStatus and loadingStatusStates props
const UserTable = ({ usuarios, onEdit, onDelete, onView, onToggleStatus, loadingStatusStates = {} }) => {

  if (!usuarios || usuarios.length === 0) {
    return null;
  }

  return (
    <Table className="table table-bordered table-hover align-middle" responsive>
      <thead className="table-dark">
        <tr>
          <th>Nombre Completo</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((user) => {
           const userId = user.id || user._id;
           const isActive = user.status;
           const isLoadingStatus = loadingStatusStates[userId]; 

          return (
             // Add class for inactive users
            <tr key={userId} className={!isActive ? 'table-secondary text-muted' : ''}>
              <td>{user.nombreCompleto || "-"}</td>
              <td>{user.username || "-"}</td>
              <td>
                  {/* Display role name and status */}
                  {user.role?.name || "N/A"}
                  {/* {user.role && !user.role.status && <Badge color="warning" className="ms-2" pill>Rol Inactivo</Badge>} */}
              </td>
              <td>
                {/* Status Badge */}
                <Badge color={isActive ? "success" : "danger"} pill>
                  {isActive ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td>
                <ButtonGroup size="sm">
                  {onView && (
                    <Button outline color="info" onClick={() => onView(user)} title="Ver Detalles" style={{ border:'none', padding: '0.25rem 0.5rem' }}
                    className="me-1" disabled={isLoadingStatus}>
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                  )}
                   {/* Toggle Status Button */}
                   {onToggleStatus && (
                     <Button
                        color={isActive ? "success" : "danger"}
                        onClick={() => onToggleStatus(userId, !isActive)}
                        title={isActive ? "Desactivar Usuario" : "Activar Usuario"}
                        className="me-1"
                        disabled={isLoadingStatus} 
                      >
                        {isLoadingStatus ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={isActive ? faToggleOff : faToggleOn} />
                        )}
                      </Button>
                  )}
                  <Button color="dark" onClick={() => onEdit(user)} title="Editar" className="me-1" disabled={isLoadingStatus}>
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button color="danger" onClick={() => onDelete(userId)} title="Eliminar" disabled={isLoadingStatus}>
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

export default UserTable;